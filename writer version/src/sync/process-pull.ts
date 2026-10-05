import {
  chapterVersions,
  chapters,
  stories,
  syncCheckpoints,
  syncEntityStates,
} from '../data/database'

import {
  applyRemoteChange,
} from './apply-remote-change'

import type {
  SyncChange,
  SyncCursor,
  SyncEntityType,
} from './protocol'

import {
  waitForPersistenceIdle,
} from './persistence'

import {
  getSyncCheckpoint,
  updateSyncCursor,
} from './storage'

interface ProcessPullBatchOptions {
  workspaceId:
    string

  changes:
    SyncChange[]

  nextCursor:
    | SyncCursor
    | null
}

export interface ProcessPullBatchResult {
  applied:
    number

  conflicts:
    number

  nextCursor:
    | SyncCursor
    | null
}

function getEntityCollection(
  entityType:
    SyncEntityType,
) {
  switch (entityType) {
    case 'story':
      return stories

    case 'chapter':
      return chapters

    case 'chapterVersion':
      return chapterVersions
  }
}

export async function processPullBatch({
  workspaceId,
  changes,
  nextCursor,
}: ProcessPullBatchOptions):
Promise<ProcessPullBatchResult> {
  const checkpoint =
    getSyncCheckpoint(
      workspaceId,
    )

  if (!checkpoint) {
    throw new Error(
      `No existe checkpoint para workspace ${workspaceId}`,
    )
  }

  let applied =
    0

  let conflicts =
    0

  /**
   * Procesamos secuencialmente.
   *
   * No queremos avanzar al siguiente
   * evento hasta que el anterior haya
   * quedado persistido.
   */
  for (
    const change
    of changes
  ) {
    const result =
      applyRemoteChange(
        change,
      )

    if (
      result ===
      'applied'
    ) {
      const collection =
        getEntityCollection(
          change.entityType,
        )

      await Promise.all([
        waitForPersistenceIdle(
          collection,
        ),

        waitForPersistenceIdle(
          syncEntityStates,
        ),
      ])

      applied +=
        1

      continue
    }

    /**
     * En conflicto no modificamos
     * la entidad local.
     *
     * Pero conflictServerRecord sí
     * debe quedar persistido antes
     * de consumir el cursor remoto.
     */
    await waitForPersistenceIdle(
      syncEntityStates,
    )

    conflicts +=
      1
  }

  /**
   * Esta es la barrera importante:
   *
   * SOLO después de persistir todos
   * los cambios remotos avanzamos
   * el checkpoint.
   */
  updateSyncCursor(
    workspaceId,
    nextCursor,
  )

  await waitForPersistenceIdle(
    syncCheckpoints,
  )

  return {
    applied,
    conflicts,
    nextCursor,
  }
}