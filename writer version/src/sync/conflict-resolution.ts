import {
  chapterVersions,
  chapters,
  stories,
} from '../data/database'

import {
  normalizeStoryAssets,
  normalizeStoryProfile,
  normalizeStoryVisuals,
} from '../domain/story-profile'

import type {
  SyncEntityType,
  SyncServerRecord,
} from './protocol'

import {
  queueEntityMutation,
} from './queue-dirty'

import {
  getOutboxMutationForEntity,
  getSyncEntityState,
  removeOutboxMutation,
  saveSyncEntityState,
} from './storage'

import {
  requestSync,
} from './sync-runtime'

export type SyncConflictResolutionStrategy =
  | 'keep-local'
  | 'use-server'

export type SyncConflictResolutionErrorCode =
  | 'NO_CONFLICT'
  | 'NO_SERVER_RECORD'
  | 'ENTITY_NOT_AVAILABLE'
  | 'SYNC_FAILED'
  | 'SYNC_CONFLICT'
  | 'SYNC_REJECTED'
  | 'SYNC_PENDING'
  | 'SYNC_INCOMPLETE'

export class SyncConflictResolutionError
  extends Error {
  constructor(
    public readonly code:
      SyncConflictResolutionErrorCode,
    message: string,
  ) {
    super(message)
    this.name =
      'SyncConflictResolutionError'
  }
}

export interface ResolveSyncConflictInput {
  entityType: SyncEntityType
  entityId: string
  strategy:
    SyncConflictResolutionStrategy
}

function clearStaleOutbox(
  entityType: SyncEntityType,
  entityId: string,
) {
  const item =
    getOutboxMutationForEntity(
      entityType,
      entityId,
    )

  if (item) {
    removeOutboxMutation(
      item.id,
    )
  }
}

function assertMatchingServerRecord(
  entityType: SyncEntityType,
  entityId: string,
  record: SyncServerRecord,
) {
  if (
    record.entityType !== entityType ||
    record.entityId !== entityId
  ) {
    throw new SyncConflictResolutionError(
      'SYNC_INCOMPLETE',
      'El registro remoto del conflicto no coincide con la entidad seleccionada.',
    )
  }
}

function applyServerRecord(
  record: SyncServerRecord,
) {
  switch (record.entityType) {
    case 'story': {
      const payload = {
        ...record.payload,

        profile:
          normalizeStoryProfile(
            record.payload.profile,
          ),

        assets:
          normalizeStoryAssets(
            record.payload.assets,
          ),

        visuals:
          normalizeStoryVisuals(
            record.payload.visuals,
          ),
      }

      const existing =
        stories.findOne(
          { id: record.entityId },
          { reactive: false },
        )

      if (!existing) {
        stories.insert(payload)
        return
      }

      stories.updateOne(
        { id: record.entityId },
        {
          $set: {
            slug:
              payload.slug,
            themeKey:
              payload.themeKey,
            title:
              payload.title,
            description:
              payload.description,
            profile:
              payload.profile,
            assets:
              payload.assets,
            visuals:
              payload.visuals,
            createdAt:
              payload.createdAt,
            updatedAt:
              payload.updatedAt,
            revision:
              payload.revision,
            deletedAt:
              payload.deletedAt,
          },
        },
      )
      return
    }

    case 'chapter': {
      const existing =
        chapters.findOne(
          { id: record.entityId },
          { reactive: false },
        )

      if (!existing) {
        chapters.insert(
          record.payload,
        )
        return
      }

      chapters.updateOne(
        { id: record.entityId },
        {
          $set: {
            storyId:
              record.payload.storyId,
            slug:
              record.payload.slug,
            title:
              record.payload.title,
            order:
              record.payload.order,
            currentVersionId:
              record.payload.currentVersionId,
            draftContent:
              record.payload.draftContent,
            draftUpdatedAt:
              record.payload.draftUpdatedAt,
            createdAt:
              record.payload.createdAt,
            updatedAt:
              record.payload.updatedAt,
            revision:
              record.payload.revision,
            deletedAt:
              record.payload.deletedAt,
          },
        },
      )
      return
    }

    case 'chapterVersion': {
      const existing =
        chapterVersions.findOne(
          { id: record.entityId },
          { reactive: false },
        )

      if (!existing) {
        chapterVersions.insert(
          record.payload,
        )
        return
      }

      chapterVersions.updateOne(
        { id: record.entityId },
        {
          $set: {
            chapterId:
              record.payload.chapterId,
            parentVersionId:
              record.payload.parentVersionId,
            label:
              record.payload.label,
            content:
              record.payload.content,
            createdAt:
              record.payload.createdAt,
            updatedAt:
              record.payload.updatedAt,
            deviceId:
              record.payload.deviceId,
            revision:
              record.payload.revision,
            deletedAt:
              record.payload.deletedAt,
          },
        },
      )
      return
    }
  }
}

function assertResolutionCompleted(
  entityType: SyncEntityType,
  entityId: string,
) {
  const state =
    getSyncEntityState(
      entityType,
      entityId,
    )

  if (state?.conflict) {
    throw new SyncConflictResolutionError(
      'SYNC_CONFLICT',
      'La entidad volvió a entrar en conflicto durante la resincronización.',
    )
  }

  const outbox =
    getOutboxMutationForEntity(
      entityType,
      entityId,
    )

  if (
    outbox?.status ===
      'rejected'
  ) {
    throw new SyncConflictResolutionError(
      'SYNC_REJECTED',
      outbox.rejection?.message ??
        'El servidor rechazó la resolución del conflicto.',
    )
  }

  if (
    outbox ||
    state?.pendingMutationId
  ) {
    throw new SyncConflictResolutionError(
      'SYNC_PENDING',
      'La resolución todavía tiene cambios pendientes de sincronización.',
    )
  }

  if (
    !state ||
    !state.serverVersion ||
    state.lastSyncedRevision === null
  ) {
    throw new SyncConflictResolutionError(
      'SYNC_INCOMPLETE',
      'El servidor no confirmó completamente la resolución del conflicto.',
    )
  }
}

async function resyncResolvedEntity(
  entityType: SyncEntityType,
  entityId: string,
) {
  const result =
    await requestSync()

  if (!result) {
    throw new SyncConflictResolutionError(
      'SYNC_FAILED',
      'No se pudo completar la resincronización después de resolver el conflicto.',
    )
  }

  assertResolutionCompleted(
    entityType,
    entityId,
  )
}

async function keepLocalAndResync(
  entityType: SyncEntityType,
  entityId: string,
  record: SyncServerRecord | null,
) {
  clearStaleOutbox(
    entityType,
    entityId,
  )

  const state =
    getSyncEntityState(
      entityType,
      entityId,
    )

  if (!state) {
    throw new SyncConflictResolutionError(
      'NO_CONFLICT',
      'La entidad ya no conserva el estado del conflicto.',
    )
  }

  saveSyncEntityState({
    ...state,
    serverVersion:
      record?.serverVersion ?? null,
    lastSyncedRevision:
      null,
    pendingMutationId:
      null,
    conflict:
      false,
    conflictServerRecord:
      null,
  })

  const queued =
    queueEntityMutation(
      entityType,
      entityId,
      {
        force: true,
      },
    )

  if (!queued) {
    saveSyncEntityState({
      ...state,
      pendingMutationId:
        null,
    })

    throw new SyncConflictResolutionError(
      'ENTITY_NOT_AVAILABLE',
      'La entidad local ya no está disponible para conservarla.',
    )
  }

  await resyncResolvedEntity(
    entityType,
    entityId,
  )
}

async function useServerAndResync(
  entityType: SyncEntityType,
  entityId: string,
  record: SyncServerRecord | null,
) {
  if (!record) {
    throw new SyncConflictResolutionError(
      'NO_SERVER_RECORD',
      'El servidor ya no contiene esta entidad. No hay una versión remota que aplicar.',
    )
  }

  assertMatchingServerRecord(
    entityType,
    entityId,
    record,
  )

  clearStaleOutbox(
    entityType,
    entityId,
  )

  applyServerRecord(
    record,
  )

  const state =
    getSyncEntityState(
      entityType,
      entityId,
    )

  if (!state) {
    throw new SyncConflictResolutionError(
      'NO_CONFLICT',
      'La entidad ya no conserva el estado del conflicto.',
    )
  }

  saveSyncEntityState({
    ...state,
    serverVersion:
      record.serverVersion,
    lastSyncedRevision:
      record.payload.revision,
    pendingMutationId:
      null,
    conflict:
      false,
    conflictServerRecord:
      null,
  })

  await resyncResolvedEntity(
    entityType,
    entityId,
  )
}

export async function resolveSyncConflict({
  entityType,
  entityId,
  strategy,
}: ResolveSyncConflictInput) {
  const state =
    getSyncEntityState(
      entityType,
      entityId,
    )

  if (!state?.conflict) {
    throw new SyncConflictResolutionError(
      'NO_CONFLICT',
      'Esta entidad ya no tiene un conflicto pendiente.',
    )
  }

  const record =
    state.conflictServerRecord

  if (strategy === 'use-server') {
    await useServerAndResync(
      entityType,
      entityId,
      record,
    )
  } else {
    await keepLocalAndResync(
      entityType,
      entityId,
      record,
    )
  }

  return {
    entityType,
    entityId,
    strategy,
  }
}
