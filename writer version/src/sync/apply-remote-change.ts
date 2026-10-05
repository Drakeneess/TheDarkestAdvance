import {
  chapterVersions,
  chapters,
  stories,
} from '../data/database'

import type {
  SyncChange,
  SyncServerRecord,
} from './protocol'

import {
  getSyncEntityState,
  saveSyncEntityState,
} from './storage'

import {
  createSyncEntityKey,
} from './sync-state'

export type ApplyRemoteChangeResult =
  | 'applied'
  | 'conflict'

function getLocalRevision(
  change: SyncChange,
) {
  switch (change.entityType) {
    case 'story': {
      return (
        stories.findOne(
          {
            id:
              change.entityId,
          },
          {
            reactive: false,
          },
        )?.revision ??
        null
      )
    }

    case 'chapter': {
      return (
        chapters.findOne(
          {
            id:
              change.entityId,
          },
          {
            reactive: false,
          },
        )?.revision ??
        null
      )
    }

    case 'chapterVersion': {
      return (
        chapterVersions.findOne(
          {
            id:
              change.entityId,
          },
          {
            reactive: false,
          },
        )?.revision ??
        null
      )
    }
  }
}

function toServerRecord(
  change: SyncChange,
): SyncServerRecord {
  switch (change.entityType) {
    case 'story':
      return {
        entityType:
          'story',

        entityId:
          change.entityId,

        serverVersion:
          change.serverVersion,

        payload:
          change.payload,
      }

    case 'chapter':
      return {
        entityType:
          'chapter',

        entityId:
          change.entityId,

        serverVersion:
          change.serverVersion,

        payload:
          change.payload,
      }

    case 'chapterVersion':
      return {
        entityType:
          'chapterVersion',

        entityId:
          change.entityId,

        serverVersion:
          change.serverVersion,

        payload:
          change.payload,
      }
  }
}

function applyStory(
  change:
    Extract<
      SyncChange,
      {
        entityType: 'story'
      }
    >,
) {
  const existing =
    stories.findOne(
      {
        id:
          change.entityId,
      },
      {
        reactive: false,
      },
    )

  if (!existing) {
    stories.insert(
      change.payload,
    )

    return
  }

  stories.updateOne(
    {
      id:
        change.entityId,
    },
    {
      $set: {
        title:
          change.payload.title,

        description:
          change.payload.description,

        createdAt:
          change.payload.createdAt,

        updatedAt:
          change.payload.updatedAt,

        revision:
          change.payload.revision,

        deletedAt:
          change.payload.deletedAt,
      },
    },
  )
}

function applyChapter(
  change:
    Extract<
      SyncChange,
      {
        entityType: 'chapter'
      }
    >,
) {
  const existing =
    chapters.findOne(
      {
        id:
          change.entityId,
      },
      {
        reactive: false,
      },
    )

  if (!existing) {
    chapters.insert(
      change.payload,
    )

    return
  }

  chapters.updateOne(
    {
      id:
        change.entityId,
    },
    {
      $set: {
        storyId:
          change.payload.storyId,

        title:
          change.payload.title,

        order:
          change.payload.order,

        currentVersionId:
          change.payload
            .currentVersionId,

        draftContent:
          change.payload
            .draftContent,

        draftUpdatedAt:
          change.payload
            .draftUpdatedAt,

        createdAt:
          change.payload.createdAt,

        updatedAt:
          change.payload.updatedAt,

        revision:
          change.payload.revision,

        deletedAt:
          change.payload.deletedAt,
      },
    },
  )
}

function applyChapterVersion(
  change:
    Extract<
      SyncChange,
      {
        entityType:
          'chapterVersion'
      }
    >,
) {
  const existing =
    chapterVersions.findOne(
      {
        id:
          change.entityId,
      },
      {
        reactive: false,
      },
    )

  if (!existing) {
    chapterVersions.insert(
      change.payload,
    )

    return
  }

  chapterVersions.updateOne(
    {
      id:
        change.entityId,
    },
    {
      $set: {
        chapterId:
          change.payload.chapterId,

        parentVersionId:
          change.payload
            .parentVersionId,

        label:
          change.payload.label,

        content:
          change.payload.content,

        createdAt:
          change.payload.createdAt,

        updatedAt:
          change.payload.updatedAt,

        deviceId:
          change.payload.deviceId,

        revision:
          change.payload.revision,

        deletedAt:
          change.payload.deletedAt,
      },
    },
  )
}

function applySnapshot(
  change: SyncChange,
) {
  switch (change.entityType) {
    case 'story':
      applyStory(change)
      return

    case 'chapter':
      applyChapter(change)
      return

    case 'chapterVersion':
      applyChapterVersion(
        change,
      )
      return
  }
}

export function applyRemoteChange(
  change: SyncChange,
): ApplyRemoteChangeResult {
  const state =
    getSyncEntityState(
      change.entityType,
      change.entityId,
    )

  const localRevision =
    getLocalRevision(
      change,
    )

  /**
   * Una entidad es dirty cuando:
   *
   * - tiene una mutación pendiente;
   * - ya está en conflicto;
   * - existe localmente pero nunca fue
   *   sincronizada;
   * - su revision cambió desde la última
   *   revisión sincronizada.
   */
  const dirty =
    state?.pendingMutationId !==
      null &&
    state?.pendingMutationId !==
      undefined
      ? true
      : state?.conflict === true
        ? true
        : localRevision !== null &&
            (
              !state ||
              state
                .lastSyncedRevision ===
                null ||
              localRevision !==
                state
                  .lastSyncedRevision
            )

  if (dirty) {
    saveSyncEntityState({
      id:
        state?.id ??
        createSyncEntityKey(
          change.entityType,
          change.entityId,
        ),

      entityType:
        change.entityType,

      entityId:
        change.entityId,

      /**
       * No avanzamos la base local.
       *
       * El serverVersion remoto queda
       * guardado dentro del conflicto.
       */
      serverVersion:
        state?.serverVersion ??
        null,

      lastSyncedRevision:
        state
          ?.lastSyncedRevision ??
        null,

      pendingMutationId:
        state
          ?.pendingMutationId ??
        null,

      conflict:
        true,

      conflictServerRecord:
        toServerRecord(
          change,
        ),
    })

    return 'conflict'
  }

  /**
   * No usamos servicios de edición.
   *
   * Es replicación del servidor,
   * así que copiamos exactamente
   * la revision recibida.
   */
  applySnapshot(
    change,
  )

  saveSyncEntityState({
    id:
      state?.id ??
      createSyncEntityKey(
        change.entityType,
        change.entityId,
      ),

    entityType:
      change.entityType,

    entityId:
      change.entityId,

    serverVersion:
      change.serverVersion,

    lastSyncedRevision:
      change.payload.revision,

    pendingMutationId:
      null,

    conflict:
      false,

    conflictServerRecord:
      null,
  })

  return 'applied'
}

export function applyRemoteChanges(
  changes:
    SyncChange[],
) {
  return changes.map(
    (change) => ({
      change,

      result:
        applyRemoteChange(
          change,
        ),
    }),
  )
}