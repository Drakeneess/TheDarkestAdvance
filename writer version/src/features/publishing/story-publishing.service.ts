import {
  getWriterSessionToken,
  WriterSessionError,
} from '../../auth/session'

import {
  stories,
} from '../../data/database'

import type {
  Story,
} from '../../domain/models'

import {
  getWorkspaceId,
} from '../../sync/config'

import {
  getOutboxMutationForEntity,
  getSyncEntityState,
} from '../../sync/storage'

import {
  queueEntityMutation,
} from '../../sync/queue-dirty'

import {
  requestSync,
} from '../../sync/sync-runtime'

import {
  publishStoryCommand,
} from './publishing.client'

import type {
  PublishStoryResult,
} from './publishing.client'

import {
  PublishingPreflightError,
} from './publishing.service'

function loadStory(
  storyId: string,
): Story {
  const story =
    stories.findOne(
      {
        id: storyId,
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

  return story
}

function assertStoryNotBlocked(
  story: Story,
) {
  const state =
    getSyncEntityState(
      'story',
      story.id,
    )

  if (state?.conflict) {
    throw new PublishingPreflightError(
      'SYNC_CONFLICT',
      'La historia tiene un conflicto de sincronización pendiente. Elige qué versión conservar y resincroniza antes de publicar.',
      {
        entityType: 'story',
        entityId: story.id,
        label: 'La historia',
        hasServerRecord:
          state.conflictServerRecord !==
          null,
      },
    )
  }

  const outbox =
    getOutboxMutationForEntity(
      'story',
      story.id,
    )

  if (
    outbox?.status ===
      'rejected'
  ) {
    throw new PublishingPreflightError(
      'SYNC_REJECTED',
      outbox.rejection?.message ??
        'La historia tiene una mutación rechazada y no puede publicarse.',
    )
  }
}

function assertStorySynchronized(
  story: Story,
) {
  const current =
    loadStory(
      story.id,
    )

  if (
    current.revision !==
      story.revision
  ) {
    throw new PublishingPreflightError(
      'SYNC_INCOMPLETE',
      'La historia cambió durante la sincronización. Vuelve a intentar publicar.',
    )
  }

  assertStoryNotBlocked(
    current,
  )

  const state =
    getSyncEntityState(
      'story',
      current.id,
    )

  const outbox =
    getOutboxMutationForEntity(
      'story',
      current.id,
    )

  if (
    outbox ||
    state?.pendingMutationId
  ) {
    throw new PublishingPreflightError(
      'SYNC_PENDING',
      'La historia todavía tiene cambios pendientes de sincronización.',
    )
  }

  if (
    !state ||
    !state.serverVersion ||
    state.lastSyncedRevision !==
      current.revision
  ) {
    throw new PublishingPreflightError(
      'SYNC_INCOMPLETE',
      'La historia no quedó confirmada por el servidor y no puede publicarse todavía.',
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

export async function publishStoryFromWriter(
  storyId: string,
): Promise<PublishStoryResult> {
  if (!navigator.onLine) {
    throw new PublishingPreflightError(
      'OFFLINE',
      'Publicar requiere conexión. Los cambios siguen disponibles localmente.',
    )
  }

  if (!getWriterSessionToken()) {
    throw new WriterSessionError(
      'MISSING_SESSION',
      'Inicia una sesión del Writer antes de publicar.',
    )
  }

  loadStory(storyId)

  /**
   * Primero drenamos mutaciones previas y
   * consumimos cualquier cambio remoto.
   */
  await requireSyncResult(
    'No se pudo completar la sincronización inicial previa a la publicación de la historia.',
  )

  /**
   * El pull puede haber modificado la entidad.
   * Releemos antes de decidir qué snapshot publicar.
   */
  const story =
    loadStory(storyId)

  assertStoryNotBlocked(
    story,
  )

  /**
   * La migración local puede completar campos
   * sin incrementar revision. Forzamos el payload
   * actual para que el servidor tenga exactamente
   * profile/assets/visuals antes de publicar.
   */
  queueEntityMutation(
    'story',
    story.id,
    {
      force: true,
    },
  )

  await requireSyncResult(
    'No se pudo confirmar en el servidor la metadata actual de la historia.',
  )

  assertStorySynchronized(
    story,
  )

  return publishStoryCommand({
    workspaceId:
      getWorkspaceId(),

    storyId:
      story.id,
  })
}
