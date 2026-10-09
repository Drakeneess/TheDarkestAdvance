import {
  syncEntityStates,
  syncOutbox,
} from '../data/database'

import type {
  SyncMutationAck,
} from './protocol'

import {
  waitForPersistenceIdle,
} from './persistence'

import {
  getOutboxMutation,
  getSyncEntityState,
  markMutationRejected,
  removeOutboxMutation,
  saveSyncEntityState,
} from './storage'

import {
  createSyncEntityKey,
} from './sync-state'

export interface ProcessAcknowledgementsResult {
  applied: number
  duplicates: number
  conflicts: number

  rejected: Array<{
    mutationId: string
    code: string
    message: string
  }>
}

export async function processMutationAcknowledgements(
  acknowledgements:
    SyncMutationAck[],
): Promise<ProcessAcknowledgementsResult> {
  let applied =
    0

  let duplicates =
    0

  let conflicts =
    0

  const rejected:
    ProcessAcknowledgementsResult[
      'rejected'
    ] = []

  for (
    const ack
    of acknowledgements
  ) {
    const state =
      getSyncEntityState(
        ack.entityType,
        ack.entityId,
      )

    const item =
      getOutboxMutation(
        ack.mutationId,
      )

    const pendingMutationId =
      state?.pendingMutationId ===
      ack.mutationId
        ? null
        : state?.pendingMutationId ??
          null

    switch (ack.status) {
      case 'applied':
      case 'duplicate': {
        saveSyncEntityState({
          id:
            state?.id ??
            createSyncEntityKey(
              ack.entityType,
              ack.entityId,
            ),

          entityType:
            ack.entityType,

          entityId:
            ack.entityId,

          serverVersion:
            ack.serverVersion,

          /**
           * Importante:
           *
           * usamos la revision incluida
           * en el ACK, no necesariamente
           * la revision local actual.
           *
           * La entidad pudo editarse otra
           * vez mientras la request estaba
           * en vuelo.
           */
          lastSyncedRevision:
            ack.clientRevision,

          pendingMutationId,

          /**
           * Un ACK aplicado no borra un
           * conflicto que pudiera haberse
           * registrado por otra causa.
           */
          conflict:
            state?.conflict ??
            false,

          conflictServerRecord:
            state
              ?.conflictServerRecord ??
            null,
        })

        removeOutboxMutation(
          ack.mutationId,
        )

        if (
          ack.status ===
          'applied'
        ) {
          applied +=
            1
        } else {
          duplicates +=
            1
        }

        break
      }

      case 'conflict': {
        saveSyncEntityState({
          id:
            state?.id ??
            createSyncEntityKey(
              ack.entityType,
              ack.entityId,
            ),

          entityType:
            ack.entityType,

          entityId:
            ack.entityId,

          /**
           * No reemplazamos nuestra base
           * conocida con la versión que
           * produjo el conflicto.
           *
           * Esa versión queda preservada
           * en conflictServerRecord.
           */
          serverVersion:
            state?.serverVersion ??
            item?.mutation
              .baseServerVersion ??
            null,

          lastSyncedRevision:
            state
              ?.lastSyncedRevision ??
            null,

          pendingMutationId,

          conflict:
            true,

          conflictServerRecord:
            ack.serverRecord,
        })

        /**
         * La mutación ya fue resuelta por
         * el servidor como conflicto.
         *
         * Reintentar el mismo mutationId
         * no la convertirá en applied.
         */
        removeOutboxMutation(
          ack.mutationId,
        )

        conflicts +=
          1

        break
      }

      case 'rejected': {
        /**
         * Rejected es terminal.
         *
         * Conservamos el outbox para diagnóstico
         * y posible recuperación manual, pero ya
         * no volverá a formar parte de
         * getPendingMutations().
         */
        markMutationRejected(
          ack.mutationId,
          {
            code:
              ack.error.code,

            message:
              ack.error.message,
          },
        )

        rejected.push({
          mutationId:
            ack.mutationId,

          code:
            ack.error.code,

          message:
            ack.error.message,
        })

        break
      }
    }
  }

  /**
   * ACKs y eliminación del outbox deben
   * quedar persistidos antes de considerar
   * procesada esta parte del exchange.
   */
  await Promise.all([
    waitForPersistenceIdle(
      syncEntityStates,
    ),

    waitForPersistenceIdle(
      syncOutbox,
    ),
  ])

  return {
    applied,
    duplicates,
    conflicts,
    rejected,
  }
}