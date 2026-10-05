import {
  Prisma,
} from '../../generated/prisma/client'

import {
  db,
} from '../db'

import type {
  SyncMutationInput,
} from './schemas'

interface ApplyMutationOptions {
  workspaceId: string
  deviceId: string
  mutation: SyncMutationInput
}

function toJson(
  value: unknown,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value),
  ) as Prisma.InputJsonValue
}

function serializeEntity(
  entity: {
    entityType: string
    entityId: string
    serverVersion: bigint
    payload: unknown
  },
) {
  return {
    entityType:
      entity.entityType,

    entityId:
      entity.entityId,

    serverVersion:
      entity.serverVersion.toString(),

    payload:
      entity.payload,
  }
}

export async function applyMutation({
  workspaceId,
  deviceId,
  mutation,
}: ApplyMutationOptions) {
  return db.$transaction(
    async (tx) => {
      const previous =
        await tx.syncMutation.findUnique({
          where: {
            mutationId:
              mutation.mutationId,
          },
        })

      if (previous) {
        const stored =
          previous.result as
            | Record<
                string,
                unknown
              >
            | null

        if (
          previous.status ===
            'applied' &&
          stored
        ) {
          return {
            ...stored,
            status:
              'duplicate',
          }
        }

        return stored
      }

      if (
        mutation.entityId !==
        mutation.payload.id
      ) {
        const result = {
          mutationId:
            mutation.mutationId,

          entityType:
            mutation.entityType,

          entityId:
            mutation.entityId,

          clientRevision:
            mutation.clientRevision,

          status:
            'rejected',

          error: {
            code:
              'ENTITY_ID_MISMATCH',

            message:
              'entityId no coincide con payload.id',
          },
        }

        await tx.syncMutation.create({
          data: {
            mutationId:
              mutation.mutationId,

            workspaceId,
            deviceId,

            entityType:
              mutation.entityType,

            entityId:
              mutation.entityId,

            clientRevision:
              mutation.clientRevision,

            status:
              'rejected',

            result:
              toJson(result),
          },
        })

        return result
      }

      if (
        mutation.clientRevision !==
        mutation.payload.revision
      ) {
        const result = {
          mutationId:
            mutation.mutationId,

          entityType:
            mutation.entityType,

          entityId:
            mutation.entityId,

          clientRevision:
            mutation.clientRevision,

          status:
            'rejected',

          error: {
            code:
              'REVISION_MISMATCH',

            message:
              'clientRevision no coincide con payload.revision',
          },
        }

        await tx.syncMutation.create({
          data: {
            mutationId:
              mutation.mutationId,

            workspaceId,
            deviceId,

            entityType:
              mutation.entityType,

            entityId:
              mutation.entityId,

            clientRevision:
              mutation.clientRevision,

            status:
              'rejected',

            result:
              toJson(result),
          },
        })

        return result
      }

      const current =
        await tx.syncEntity.findUnique({
          where: {
            workspaceId_entityType_entityId: {
              workspaceId,

              entityType:
                mutation.entityType,

              entityId:
                mutation.entityId,
            },
          },
        })

      const expected =
        mutation.baseServerVersion

      const currentVersion =
        current?.serverVersion.toString() ??
        null

      if (
        expected !==
        currentVersion
      ) {
        const result = {
          mutationId:
            mutation.mutationId,

          entityType:
            mutation.entityType,

          entityId:
            mutation.entityId,

          clientRevision:
            mutation.clientRevision,

          status:
            'conflict',

          serverRecord:
            current
              ? serializeEntity(
                  current,
                )
              : null,
        }

        await tx.syncMutation.create({
          data: {
            mutationId:
              mutation.mutationId,

            workspaceId,
            deviceId,

            entityType:
              mutation.entityType,

            entityId:
              mutation.entityId,

            clientRevision:
              mutation.clientRevision,

            status:
              'conflict',

            result:
              toJson(result),
          },
        })

        return result
      }

      const payload =
        toJson(
          mutation.payload,
        )

      /*
       * cursor y serverVersion usan
       * el mismo contador global.
       *
       * Creamos el evento dentro de
       * la misma transacción y luego
       * sustituimos el valor temporal.
       */
      const change =
        await tx.syncChange.create({
          data: {
            workspaceId,

            entityType:
              mutation.entityType,

            entityId:
              mutation.entityId,

            serverVersion:
              0n,

            payload,

            sourceDeviceId:
              deviceId,

            sourceMutationId:
              mutation.mutationId,
          },
        })

      const serverVersion =
        change.cursor

      await tx.syncChange.update({
        where: {
          cursor:
            change.cursor,
        },

        data: {
          serverVersion,
        },
      })

      await tx.syncEntity.upsert({
        where: {
          workspaceId_entityType_entityId: {
            workspaceId,

            entityType:
              mutation.entityType,

            entityId:
              mutation.entityId,
          },
        },

        create: {
          workspaceId,

          entityType:
            mutation.entityType,

          entityId:
            mutation.entityId,

          serverVersion,

          payload,

          deletedAt:
            mutation.payload
              .deletedAt
              ? new Date(
                  mutation.payload
                    .deletedAt,
                )
              : null,
        },

        update: {
          serverVersion,

          payload,

          deletedAt:
            mutation.payload
              .deletedAt
              ? new Date(
                  mutation.payload
                    .deletedAt,
                )
              : null,
        },
      })

      const result = {
        mutationId:
          mutation.mutationId,

        entityType:
          mutation.entityType,

        entityId:
          mutation.entityId,

        clientRevision:
          mutation.clientRevision,

        status:
          'applied',

        serverVersion:
          serverVersion.toString(),

        cursor:
          serverVersion.toString(),
      }

      await tx.syncMutation.create({
        data: {
          mutationId:
            mutation.mutationId,

          workspaceId,
          deviceId,

          entityType:
            mutation.entityType,

          entityId:
            mutation.entityId,

          clientRevision:
            mutation.clientRevision,

          status:
            'applied',

          serverVersion,
          cursor:
            serverVersion,

          result:
            toJson(result),
        },
      })

      return result
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  )
}