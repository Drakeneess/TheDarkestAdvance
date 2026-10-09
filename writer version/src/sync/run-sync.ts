import {
  syncEntityStates,
  syncOutbox,
} from '../data/database'

import {
  exchangeSync,
} from './client'

import {
  getWorkspaceId,
} from './config'

import {
  getDeviceId,
} from './device-id'

import {
  waitForPersistenceIdle,
} from './persistence'

import {
  processMutationAcknowledgements,
} from './process-ack'

import {
  processPullBatch,
} from './process-pull'

import {
  SYNC_PROTOCOL_VERSION,
} from './protocol'

import {
  queueAllDirtyEntities,
} from './queue-dirty'

import {
  ensureSyncCheckpoint,
  getPendingMutations,
  getSyncCheckpoint,
  markMutationAttempt,
} from './storage'

export interface RunSyncResult {
  workspaceId: string
  deviceId: string

  cursor:
    | string
    | null

  serverHead:
    | string
    | null

  pages: number
  sentMutations: number

  acknowledgements: {
    applied: number
    duplicates: number
    conflicts: number

    rejected: Array<{
      mutationId: string
      code: string
      message: string
    }>
  }

  pull: {
    applied: number
    conflicts: number
  }
}

export async function runSync():
Promise<RunSyncResult> {
  const workspaceId =
    getWorkspaceId()

  const deviceId =
    getDeviceId()

  let checkpoint =
    getSyncCheckpoint(
      workspaceId,
    ) ??
    ensureSyncCheckpoint(
      workspaceId,
      deviceId,
    )

  /**
   * Detectamos todas las entidades
   * modificadas desde su último estado
   * confirmado por el servidor.
   *
   * Las entidades con conflicto o con
   * una mutación ya pendiente no generan
   * una nueva mutación.
   */
  queueAllDirtyEntities()

  /**
   * El outbox debe existir durablemente
   * antes de iniciar cualquier request.
   *
   * Si el proceso muere después de enviar
   * pero antes de recibir el ACK, el mismo
   * mutationId podrá reenviarse.
   */
  await Promise.all([
    waitForPersistenceIdle(
      syncOutbox,
    ),

    waitForPersistenceIdle(
      syncEntityStates,
    ),
  ])

  /**
   * Snapshot del outbox para ESTE ciclo.
   *
   * Mutaciones creadas después de este
   * punto quedan para el próximo ciclo.
   */
  const pendingItems =
    getPendingMutations()

  for (
    const item
    of pendingItems
  ) {
    markMutationAttempt(
      item.id,
    )
  }

  let mutations =
    pendingItems.map(
      (item) =>
        item.mutation,
    )

  let ackApplied =
    0

  let ackDuplicates =
    0

  let ackConflicts =
    0

  const ackRejected:
    RunSyncResult[
      'acknowledgements'
    ]['rejected'] = []

  let pullApplied =
    0

  let pullConflicts =
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

        mutations,

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

    const ackResult =
      await processMutationAcknowledgements(
        response.acknowledgements,
      )

    ackApplied +=
      ackResult.applied

    ackDuplicates +=
      ackResult.duplicates

    ackConflicts +=
      ackResult.conflicts

    ackRejected.push(
      ...ackResult.rejected,
    )

    const pullResult =
      await processPullBatch({
        workspaceId,

        changes:
          response.changes,

        nextCursor:
          response.nextCursor,
      })

    pullApplied +=
      pullResult.applied

    pullConflicts +=
      pullResult.conflicts

    pages +=
      1

    /**
     * Las mutaciones locales se envían
     * únicamente en la primera request.
     *
     * Si hay más páginas, las siguientes
     * requests solo terminan de consumir
     * el pull remoto.
     */
    mutations =
      []

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
          checkpoint.cursor,

        serverHead:
          response.serverHead,

        pages,

        sentMutations:
          pendingItems.length,

        acknowledgements: {
          applied:
            ackApplied,

          duplicates:
            ackDuplicates,

          conflicts:
            ackConflicts,

          rejected:
            ackRejected,
        },

        pull: {
          applied:
            pullApplied,

          conflicts:
            pullConflicts,
        },
      }
    }
  }
}