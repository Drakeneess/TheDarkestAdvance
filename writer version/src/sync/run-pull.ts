import {
  getDeviceId,
} from './device-id'

import {
  getWorkspaceId,
} from './config'

import {
  exchangeSync,
} from './client'

import {
  SYNC_PROTOCOL_VERSION,
} from './protocol'

import {
  ensureSyncCheckpoint,
} from './storage'

import {
  processPullBatch,
} from './process-pull'

import {
  getSyncCheckpoint,
} from './storage'

export async function runSyncPull() {
  const workspaceId =
    getWorkspaceId()

  const deviceId =
    getDeviceId()

  let checkpoint =
    ensureSyncCheckpoint(
      workspaceId,
      deviceId,
    )

  let totalApplied =
    0

  let totalConflicts =
    0

  let pages =
    0

  while (true) {
    const response =
      await exchangeSync({
        protocolVersion:
          SYNC_PROTOCOL_VERSION,

        workspaceId,
        deviceId,

        cursor:
          checkpoint.cursor,

        mutations:
          [],

        maxChanges:
          100,
      })

    if (
      response.protocolVersion !==
      SYNC_PROTOCOL_VERSION
    ) {
      throw new Error(
        `Versión de protocolo incompatible: ${response.protocolVersion}`,
      )
    }

    const processed =
      await processPullBatch({
        workspaceId,

        changes:
          response.changes,

        nextCursor:
          response.nextCursor,
      })

    totalApplied +=
      processed.applied

    totalConflicts +=
      processed.conflicts

    pages +=
      1

    checkpoint =
        getSyncCheckpoint(
            workspaceId,
        ) ??
        ensureSyncCheckpoint(
            workspaceId,
            deviceId,
        )

    if (!response.hasMore) {
      return {
        workspaceId,
        deviceId,

        cursor:
          processed.nextCursor,

        serverHead:
          response.serverHead,

        applied:
          totalApplied,

        conflicts:
          totalConflicts,

        pages,
      }
    }
  }
}