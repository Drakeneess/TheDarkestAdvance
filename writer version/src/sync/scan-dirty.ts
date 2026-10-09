import {
  chapterVersions,
  chapters,
  stories,
} from '../data/database'

import type {
  SyncEntityType,
} from './protocol'

import {
  getOutboxMutationForEntity,
  getSyncEntityState,
} from './storage'

export type SyncEntityStatus =
  | 'clean'
  | 'dirty'
  | 'pending'
  | 'rejected'
  | 'conflict'

export interface ScannedSyncEntity {
  entityType:
    SyncEntityType

  entityId:
    string

  revision:
    number

  lastSyncedRevision:
    number | null

  serverVersion:
    string | null

  status:
    SyncEntityStatus

  rejection:
    | {
        code: string
        message: string
        rejectedAt: string
      }
    | null
}

export interface DirtyScanResult {
  entities:
    ScannedSyncEntity[]

  totals: {
    all: number
    clean: number
    dirty: number
    pending: number
    rejected: number
    conflict: number
  }
}

function classifyEntity(
  entityType:
    SyncEntityType,

  entityId:
    string,

  revision:
    number,
): ScannedSyncEntity {
  const state =
    getSyncEntityState(
      entityType,
      entityId,
    )

  const outbox =
    getOutboxMutationForEntity(
      entityType,
      entityId,
    )

  let status:
    SyncEntityStatus

  if (
    state?.conflict ===
    true
  ) {
    status =
      'conflict'
  } else if (
    outbox?.status ===
    'rejected'
  ) {
    status =
      'rejected'
  } else if (
    outbox ||
    state?.pendingMutationId
  ) {
    status =
      'pending'
  } else if (
    !state ||
    state.lastSyncedRevision ===
      null ||
    revision !==
      state.lastSyncedRevision
  ) {
    status =
      'dirty'
  } else {
    status =
      'clean'
  }

  return {
    entityType,
    entityId,
    revision,

    lastSyncedRevision:
      state
        ?.lastSyncedRevision ??
      null,

    serverVersion:
      state?.serverVersion ??
      null,

    status,

    rejection:
      outbox?.status ===
      'rejected'
        ? outbox.rejection
        : null,
  }
}

export function scanSyncEntities():
DirtyScanResult {
  const entities:
    ScannedSyncEntity[] =
    []

  for (
    const story
    of stories
      .find(
        {},
        {
          reactive: false,
        },
      )
      .fetch()
  ) {
    entities.push(
      classifyEntity(
        'story',
        story.id,
        story.revision,
      ),
    )
  }

  for (
    const chapter
    of chapters
      .find(
        {},
        {
          reactive: false,
        },
      )
      .fetch()
  ) {
    entities.push(
      classifyEntity(
        'chapter',
        chapter.id,
        chapter.revision,
      ),
    )
  }

  for (
    const version
    of chapterVersions
      .find(
        {},
        {
          reactive: false,
        },
      )
      .fetch()
  ) {
    entities.push(
      classifyEntity(
        'chapterVersion',
        version.id,
        version.revision,
      ),
    )
  }

  return {
    entities,

    totals: {
      all:
        entities.length,

      clean:
        entities.filter(
          (entity) =>
            entity.status ===
            'clean',
        ).length,

      dirty:
        entities.filter(
          (entity) =>
            entity.status ===
            'dirty',
        ).length,

      pending:
        entities.filter(
          (entity) =>
            entity.status ===
            'pending',
        ).length,

      rejected:
        entities.filter(
          (entity) =>
            entity.status ===
            'rejected',
        ).length,

      conflict:
        entities.filter(
          (entity) =>
            entity.status ===
            'conflict',
        ).length,
    },
  }
}