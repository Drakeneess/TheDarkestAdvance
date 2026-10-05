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

export function getPendingMutationForEntity(
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