import {
  db,
} from '../db'

interface PullChangesOptions {
  workspaceId: string
  deviceId: string

  cursor:
    | string
    | null

  maxChanges?:
    number
}

export async function pullChanges({
  workspaceId,
  deviceId,
  cursor,
  maxChanges,
}: PullChangesOptions) {
  const after =
    cursor === null
      ? 0n
      : BigInt(cursor)

  const limit =
    maxChanges ?? 100

  /*
   * IMPORTANTE:
   *
   * No filtramos sourceDeviceId
   * en SQL.
   *
   * Los eventos creados por este mismo
   * dispositivo también deben consumir
   * cursor, aunque no se devuelvan al
   * cliente.
   */
  const rows =
    await db.syncChange.findMany({
      where: {
        workspaceId,

        cursor: {
          gt: after,
        },
      },

      orderBy: {
        cursor: 'asc',
      },

      /*
       * Una fila extra permite saber
       * si existe otra página.
       */
      take:
        limit + 1,
    })

  const page =
    rows.slice(
      0,
      limit,
    )

  const hasMore =
    rows.length >
    limit

  const lastScanned =
    page.at(-1)

  const nextCursor =
    lastScanned
      ? lastScanned
          .cursor
          .toString()
      : cursor

  const changes =
    page
      .filter(
        (change) =>
          change
            .sourceDeviceId !==
          deviceId,
      )
      .map(
        (change) => ({
          cursor:
            change
              .cursor
              .toString(),

          entityType:
            change.entityType,

          entityId:
            change.entityId,

          serverVersion:
            change
              .serverVersion
              .toString(),

          payload:
            change.payload,

          sourceDeviceId:
            change
              .sourceDeviceId,

          sourceMutationId:
            change
              .sourceMutationId,
        }),
      )

  const head =
    await db
      .syncChange
      .findFirst({
        where: {
          workspaceId,
        },

        orderBy: {
          cursor: 'desc',
        },

        select: {
          cursor: true,
        },
      })

  return {
    changes,

    nextCursor,

    serverHead:
      head
        ? head
            .cursor
            .toString()
        : null,

    hasMore,
  }
}