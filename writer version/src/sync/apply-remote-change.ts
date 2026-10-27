import {
  chapterVersions,
  chapters,
  stories,
} from '../data/database'

import {
  normalizeStoryCustomLayout,
} from '../domain/story-layout'

import {
  normalizeStoryAssets,
  normalizeStoryProfile,
  normalizeStoryVisuals,
} from '../domain/story-profile'

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
  const payload = {
    ...change.payload,

    profile:
      normalizeStoryProfile(
        change.payload.profile,
      ),

    assets:
      normalizeStoryAssets(
        change.payload.assets,
      ),

    visuals:
      normalizeStoryVisuals(
        change.payload.visuals,
      ),

    layout:
      normalizeStoryCustomLayout(
        change.payload.layout,
      ),
  }

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
    stories.insert(payload)

    return
  }

  stories.updateOne(
    {
      id:
        change.entityId,
    },
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

        layout:
          payload.layout,

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

        slug:
          change.payload.slug,

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
