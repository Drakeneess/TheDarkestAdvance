import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../../domain/models'

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

interface PublicationEntities {
  story: Story
  chapter: Chapter
  version: ChapterVersion
}

interface TargetEntity {
  entityType: SyncEntityType
  entityId: string
  revision: number
  label: string
}

function loadPublicationEntities(
  input:
    PublishChapterVersionFromWriterInput,
): PublicationEntities {
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

  return {
    story,
    chapter,
    version,
  }
}

function buildTargets(
  entities:
    PublicationEntities,
): TargetEntity[] {
  return [
    {
      entityType: 'story',
      entityId:
        entities.story.id,
      revision:
        entities.story.revision,
      label: 'La historia',
    },
    {
      entityType: 'chapter',
      entityId:
        entities.chapter.id,
      revision:
        entities.chapter.revision,
      label: 'El capítulo',
    },
    {
      entityType:
        'chapterVersion',
      entityId:
        entities.version.id,
      revision:
        entities.version.revision,
      label: 'La versión',
    },
  ]
}

function getCurrentRevision(
  target: TargetEntity,
) {
  switch (target.entityType) {
    case 'story':
      return stories.findOne(
        { id: target.entityId },
        { reactive: false },
      )?.revision ?? null

    case 'chapter':
      return chapters.findOne(
        { id: target.entityId },
        { reactive: false },
      )?.revision ?? null

    case 'chapterVersion':
      return chapterVersions.findOne(
        { id: target.entityId },
        { reactive: false },
      )?.revision ?? null
  }
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

  const currentRevision =
    getCurrentRevision(
      target,
    )

  if (
    currentRevision === null ||
    currentRevision !==
      target.revision
  ) {
    throw new PublishingPreflightError(
      'SYNC_INCOMPLETE',
      `${target.label} cambió durante la sincronización. Vuelve a intentar publicar.`,
    )
  }

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
      currentRevision
  ) {
    throw new PublishingPreflightError(
      'SYNC_INCOMPLETE',
      `${target.label} no quedó confirmado por el servidor y no puede publicarse todavía.`,
    )
  }
}

async function requireSyncResult(
  message: string,
) {
  const result =
    await requestSync()

  if (!result) {
    throw new PublishingPreflightError(
      'SYNC_FAILED',
      message,
    )
  }

  return result
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

  /**
   * Validamos que el usuario eligió una
   * versión real antes de tocar la red.
   */
  loadPublicationEntities(
    input,
  )

  /**
   * Paso 1: drenamos el outbox existente y
   * consumimos cambios remotos.
   *
   * Esto evita reutilizar una mutación vieja
   * cuyo payload haya sido creado antes de V3.
   */
  await requireSyncResult(
    'No se pudo completar la sincronización inicial previa a la publicación.',
  )

  /**
   * El pull anterior pudo modificar entidades.
   * Las volvemos a leer y validar antes de
   * construir el payload que será publicable.
   */
  const entities =
    loadPublicationEntities(
      input,
    )

  const targets =
    buildTargets(
      entities,
    )

  targets.forEach(
    assertEntityNotBlocked,
  )

  /**
   * Paso 2: refresh forzado del payload actual.
   *
   * Story/Chapter pueden haber recibido
   * slug/themeKey mediante una migración
   * de esquema sin incrementar revision.
   * El publish necesita que el servidor
   * tenga exactamente este payload local.
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

  await requireSyncResult(
    'No se pudo confirmar en el servidor la versión seleccionada para publicar.',
  )

  /**
   * También detecta ediciones locales que
   * hayan ocurrido mientras el sync estaba
   * en vuelo: en ese caso no publicamos una
   * metadata que ya quedó obsoleta.
   */
  targets.forEach(
    assertEntitySynchronized,
  )

  return publishChapterCommand({
    workspaceId:
      getWorkspaceId(),

    storyId:
      entities.story.id,

    chapterId:
      entities.chapter.id,

    sourceVersionId:
      entities.version.id,
  })
}
