import {
  syncCheckpoints,
  syncEntityStates,
  syncOutbox,
} from '../data/database'

import {
  SYNC_PROTOCOL_VERSION,
} from './protocol'

import type {
  SyncEntityType,
  SyncMutation,
} from './protocol'

import type {
  SyncCheckpoint,
  SyncEntityState,
  SyncOutboxItem,
  SyncOutboxRejection,
} from './sync-state'

import {
  createSyncEntityKey,
} from './sync-state'

export function getSyncCheckpoint(
  workspaceId: string,
) {
  return (
    syncCheckpoints.findOne(
      {
        id:
          workspaceId,
      },
      {
        reactive: false,
      },
    ) ??
    null
  )
}

export function ensureSyncCheckpoint(
  workspaceId: string,
  deviceId: string,
): SyncCheckpoint {
  const existing =
    getSyncCheckpoint(
      workspaceId,
    )

  if (existing) {
    return existing
  }

  const checkpoint:
    SyncCheckpoint = {
      id:
        workspaceId,

      protocolVersion:
        SYNC_PROTOCOL_VERSION,

      workspaceId,
      deviceId,

      cursor:
        null,
    }

  syncCheckpoints.insert(
    checkpoint,
  )

  return checkpoint
}

export function updateSyncCursor(
  workspaceId: string,

  cursor:
    | string
    | null,
) {
  syncCheckpoints.updateOne(
    {
      id:
        workspaceId,
    },
    {
      $set: {
        cursor,
      },
    },
  )
}

export function getSyncEntityState(
  entityType:
    SyncEntityType,

  entityId: string,
) {
  const id =
    createSyncEntityKey(
      entityType,
      entityId,
    )

  return (
    syncEntityStates.findOne(
      {
        id,
      },
      {
        reactive: false,
      },
    ) ??
    null
  )
}

export function ensureSyncEntityState(
  entityType:
    SyncEntityType,

  entityId: string,
): SyncEntityState {
  const existing =
    getSyncEntityState(
      entityType,
      entityId,
    )

  if (existing) {
    return existing
  }

  const state:
    SyncEntityState = {
      id:
        createSyncEntityKey(
          entityType,
          entityId,
        ),

      entityType,
      entityId,

      serverVersion:
        null,

      lastSyncedRevision:
        null,

      pendingMutationId:
        null,

      conflict:
        false,

      conflictServerRecord:
        null,
    }

  syncEntityStates.insert(
    state,
  )

  return state
}

export function saveSyncEntityState(
  state:
    SyncEntityState,
) {
  const existing =
    syncEntityStates.findOne(
      {
        id:
          state.id,
      },
      {
        reactive: false,
      },
    )

  if (!existing) {
    syncEntityStates.insert(
      state,
    )

    return
  }

  syncEntityStates.updateOne(
    {
      id:
        state.id,
    },
    {
      $set: {
        entityType:
          state.entityType,

        entityId:
          state.entityId,

        serverVersion:
          state.serverVersion,

        lastSyncedRevision:
          state.lastSyncedRevision,

        pendingMutationId:
          state.pendingMutationId,

        conflict:
          state.conflict,

        conflictServerRecord:
          state.conflictServerRecord,
      },
    },
  )
}

export function enqueueMutation(
  mutation:
    SyncMutation,
): SyncOutboxItem {
  const existing =
    syncOutbox.findOne(
      {
        id:
          mutation.mutationId,
      },
      {
        reactive: false,
      },
    )

  if (existing) {
    return existing
  }

  const entityKey =
    createSyncEntityKey(
      mutation.entityType,
      mutation.entityId,
    )

  const item:
    SyncOutboxItem = {
      id:
        mutation.mutationId,

      entityKey,

      mutation,

      createdAt:
        new Date()
          .toISOString(),

      attempts:
        0,

      lastAttemptAt:
        null,

      status:
        'pending',

      rejection:
        null,
    }

  syncOutbox.insert(
    item,
  )

  const state =
    ensureSyncEntityState(
      mutation.entityType,
      mutation.entityId,
    )

  saveSyncEntityState({
    ...state,

    pendingMutationId:
      mutation.mutationId,
  })

  return item
}

/**
 * Solo devuelve mutaciones que pueden
 * enviarse por red.
 *
 * Un item antiguo que todavía no tenga
 * `status` se considera pending.
 */
export function getPendingMutations() {
  return syncOutbox
    .find(
      {},
      {
        reactive: false,

        sort: {
          createdAt: 1,
        },
      },
    )
    .fetch()
    .filter(
      (item) =>
        item.status !==
        'rejected',
    )
}

/**
 * Los rejected permanecen guardados
 * para diagnóstico y recuperación
 * manual, pero nunca son reenviados
 * automáticamente.
 */
export function getRejectedMutations() {
  return syncOutbox
    .find(
      {},
      {
        reactive: false,

        sort: {
          createdAt: 1,
        },
      },
    )
    .fetch()
    .filter(
      (item) =>
        item.status ===
        'rejected',
    )
}

export function markMutationAttempt(
  mutationId: string,
) {
  const item =
    syncOutbox.findOne(
      {
        id:
          mutationId,
      },
      {
        reactive: false,
      },
    )

  if (!item) {
    return
  }

  /**
   * Un rejected es terminal.
   * Ni siquiera incrementamos attempts
   * porque ya no debe volver a salir.
   */
  if (
    item.status ===
    'rejected'
  ) {
    return
  }

  syncOutbox.updateOne(
    {
      id:
        mutationId,
    },
    {
      $set: {
        attempts:
          item.attempts + 1,

        lastAttemptAt:
          new Date()
            .toISOString(),

        /**
         * También normaliza items legacy
         * que todavía no tenían status.
         */
        status:
          'pending',

        rejection:
          null,
      },
    },
  )
}

export function markMutationRejected(
  mutationId: string,

  rejection:
    Pick<
      SyncOutboxRejection,
      | 'code'
      | 'message'
    >,
) {
  const item =
    syncOutbox.findOne(
      {
        id:
          mutationId,
      },
      {
        reactive: false,
      },
    )

  if (!item) {
    return
  }

  syncOutbox.updateOne(
    {
      id:
        mutationId,
    },
    {
      $set: {
        status:
          'rejected',

        rejection: {
          code:
            rejection.code,

          message:
            rejection.message,

          rejectedAt:
            new Date()
              .toISOString(),
        },
      },
    },
  )
}

export function removeOutboxMutation(
  mutationId: string,
) {
  syncOutbox.removeOne({
    id:
      mutationId,
  })
}

/**
 * Devuelve cualquier outbox asociado
 * a la entidad, incluyendo rejected.
 *
 * Esto es intencional:
 * una mutación rechazada debe bloquear
 * la creación automática de otra
 * mutación idéntica.
 */
export function getOutboxMutationForEntity(
  entityType:
    SyncEntityType,

  entityId: string,
) {
  const entityKey =
    createSyncEntityKey(
      entityType,
      entityId,
    )

  return (
    syncOutbox.findOne(
      {
        entityKey,
      },
      {
        reactive: false,
      },
    ) ??
    null
  )
}

/**
 * Alias temporal para no romper los
 * consumidores actuales.
 *
 * Más adelante sustituiremos su uso
 * por getOutboxMutationForEntity().
 */
export function getPendingMutationForEntity(
  entityType:
    SyncEntityType,

  entityId: string,
) {
  return getOutboxMutationForEntity(
    entityType,
    entityId,
  )
}

export function getOutboxMutation(
  mutationId: string,
) {
  return (
    syncOutbox.findOne(
      {
        id:
          mutationId,
      },
      {
        reactive: false,
      },
    ) ??
    null
  )
}