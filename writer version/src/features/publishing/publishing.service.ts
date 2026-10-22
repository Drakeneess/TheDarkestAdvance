import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import {
  getWriterSessionToken,
  WriterSessionError,
} from '../../auth/session'

import type {
  SyncEntityType,
} from '../../sync/protocol'

import {
  getWorkspaceId,
} from '../../sync/config'

import {
  queueEntityMutation,
} from '../../sync/queue-dirty'

import {
  getOutboxMutationForEntity,
  getSyncEntityState,
} from '../../sync/storage'

import {
  requestSync,
} from '../../sync/sync-runtime'

import {
  publishChapterCommand,
} from './publishing.client'

import type {
  PublishChapterResult,
} from './publishing.client'

export type PublishingPreflightErrorCode =
  | 'OFFLINE'
  | 'STORY_NOT_AVAILABLE'
  | 'CHAPTER_NOT_AVAILABLE'
  | 'VERSION_NOT_AVAILABLE'
  | 'CHAPTER_STORY_MISMATCH'
  | 'VERSION_CHAPTER_MISMATCH'
  | 'SYNC_CONFLICT'
  | 'SYNC_REJECTED'
  | 'SYNC_PENDING'
  | 'SYNC_INCOMPLETE'
  | 'SYNC_FAILED'

export class PublishingPreflightError extends Error {
  constructor(
    public readonly code:
      PublishingPreflightErrorCode,
    message: string,
  ) {
    super(message)

    this.name =
      'PublishingPreflightError'
  }
}

export interface PublishChapterVersionFromWriterInput {
  storyId: string
  chapterId: string
  sourceVersionId: string
}

interface TargetEntity {
  entityType: SyncEntityType
  entityId: string
  revision: number
  label: string
}

function assertEntityNotBlocked(
  target: TargetEntity,
) {
  const state =
    getSyncEntityState(
      target.entityType,
      target.entityId,
    )

  if (state?.conflict) {
    throw new PublishingPreflightError(
      'SYNC_CONFLICT',
      `${target.label} tiene un conflicto de sincronización pendiente. Resuélvelo antes de publicar.`,
    )
  }

  const outbox =
    getOutboxMutationForEntity(
      target.entityType,
      target.entityId,
    )

  if (
    outbox?.status ===
      'rejected'
  ) {
    throw new PublishingPreflightError(
      'SYNC_REJECTED',
      outbox.rejection?.message ??
        `${target.label} tiene una mutación rechazada y no puede publicarse.`,
    )
  }
}

function assertEntitySynchronized(
  target: TargetEntity,
) {
  assertEntityNotBlocked(
    target,
  )

  const state =
    getSyncEntityState(
      target.entityType,
      target.entityId,
    )

  const outbox =
    getOutboxMutationForEntity(
      target.entityType,
      target.entityId,
    )

  if (
    outbox ||
    state?.pendingMutationId
  ) {
    throw new PublishingPreflightError(
      'SYNC_PENDING',
      `${target.label} todavía tiene cambios pendientes de sincronización.`,
    )
  }

  if (
    !state ||
    !state.serverVersion ||
    state.lastSyncedRevision !==
      target.revision
  ) {
    throw new PublishingPreflightError(
      'SYNC_INCOMPLETE',
      `${target.label} no quedó confirmado por el servidor y no puede publicarse todavía.`,
    )
  }
}

/**
 * Publica exclusivamente un ChapterVersion
 * existente. Un draft sin snapshot nunca
 * llega a este flujo.
 */
export async function publishChapterVersionFromWriter(
  input:
    PublishChapterVersionFromWriterInput,
): Promise<PublishChapterResult> {
  if (!navigator.onLine) {
    throw new PublishingPreflightError(
      'OFFLINE',
      'Publicar requiere conexión. El borrador sigue disponible localmente.',
    )
  }

  if (!getWriterSessionToken()) {
    throw new WriterSessionError(
      'MISSING_SESSION',
      'Inicia una sesión del Writer antes de publicar.',
    )
  }

  const story =
    stories.findOne(
      {
        id: input.storyId,
      },
      {
        reactive: false,
      },
    )

  if (
    !story ||
    story.deletedAt
  ) {
    throw new PublishingPreflightError(
      'STORY_NOT_AVAILABLE',
      'La historia ya no está disponible para publicar.',
    )
  }

  const chapter =
    chapters.findOne(
      {
        id: input.chapterId,
      },
      {
        reactive: false,
      },
    )

  if (
    !chapter ||
    chapter.deletedAt
  ) {
    throw new PublishingPreflightError(
      'CHAPTER_NOT_AVAILABLE',
      'El capítulo ya no está disponible para publicar.',
    )
  }

  if (
    chapter.storyId !==
      story.id
  ) {
    throw new PublishingPreflightError(
      'CHAPTER_STORY_MISMATCH',
      'El capítulo no pertenece a la historia seleccionada.',
    )
  }

  const version =
    chapterVersions.findOne(
      {
        id:
          input.sourceVersionId,
      },
      {
        reactive: false,
      },
    )

  if (
    !version ||
    version.deletedAt
  ) {
    throw new PublishingPreflightError(
      'VERSION_NOT_AVAILABLE',
      'La versión seleccionada ya no está disponible para publicar.',
    )
  }

  if (
    version.chapterId !==
      chapter.id
  ) {
    throw new PublishingPreflightError(
      'VERSION_CHAPTER_MISMATCH',
      'La versión seleccionada no pertenece a este capítulo.',
    )
  }

  const targets:
    TargetEntity[] = [
      {
        entityType: 'story',
        entityId: story.id,
        revision: story.revision,
        label: 'La historia',
      },
      {
        entityType: 'chapter',
        entityId: chapter.id,
        revision: chapter.revision,
        label: 'El capítulo',
      },
      {
        entityType:
          'chapterVersion',
        entityId: version.id,
        revision: version.revision,
        label: 'La versión',
      },
    ]

  /**
   * No intentamos publicar encima de un
   * conflicto/rechazo ya conocido.
   */
  targets.forEach(
    assertEntityNotBlocked,
  )

  /**
   * Force es deliberado.
   *
   * Story/Chapter pueden haber recibido
   * slug/themeKey mediante una migración
   * de esquema sin incrementar revision.
   * El publish necesita que el servidor
   * tenga exactamente el payload local.
   */
  for (
    const target
      of targets
  ) {
    queueEntityMutation(
      target.entityType,
      target.entityId,
      {
        force: true,
      },
    )
  }

  const syncResult =
    await requestSync()

  if (!syncResult) {
    throw new PublishingPreflightError(
      'SYNC_FAILED',
      'No se pudo completar la sincronización previa a la publicación.',
    )
  }

  targets.forEach(
    assertEntitySynchronized,
  )

  return publishChapterCommand({
    workspaceId:
      getWorkspaceId(),

    storyId:
      story.id,

    chapterId:
      chapter.id,

    sourceVersionId:
      version.id,
  })
}
