import {
  chapterVersions,
  chapters,
  stories,
} from '../data/database'

import type {
  SyncEntityType,
} from './protocol'

import type {
  SyncOutboxItem,
} from './sync-state'

import {
  enqueueMutation,
  getPendingMutationForEntity,
  getPendingMutations,
  getSyncEntityState,
} from './storage'

function mutationId() {
  return crypto.randomUUID()
}

export function queueEntityMutation(
  entityType:
    SyncEntityType,

  entityId: string,
): SyncOutboxItem | null {
  const state =
    getSyncEntityState(
      entityType,
      entityId,
    )

  /**
   * V4.1 no intenta resolver una
   * entidad que ya está en conflicto.
   */
  if (
    state?.conflict === true
  ) {
    return null
  }

  /**
   * Mientras exista una mutación
   * pendiente no creamos otra.
   *
   * Si la entidad vuelve a editarse
   * durante el envío, seguirá dirty
   * después del ACK y será enviada
   * en una mutación posterior.
   */
  const pending =
    getPendingMutationForEntity(
      entityType,
      entityId,
    )

  if (pending) {
    return pending
  }

  switch (entityType) {
    case 'story': {
      const entity =
        stories.findOne(
          {
            id:
              entityId,
          },
          {
            reactive: false,
          },
        )

      if (!entity) {
        return null
      }

      if (
        state &&
        state.lastSyncedRevision ===
          entity.revision
      ) {
        return null
      }

      return enqueueMutation({
        mutationId:
          mutationId(),

        entityType:
          'story',

        entityId:
          entity.id,

        clientRevision:
          entity.revision,

        baseServerVersion:
          state?.serverVersion ??
          null,

        payload:
          entity,
      })
    }

    case 'chapter': {
      const entity =
        chapters.findOne(
          {
            id:
              entityId,
          },
          {
            reactive: false,
          },
        )

      if (!entity) {
        return null
      }

      if (
        state &&
        state.lastSyncedRevision ===
          entity.revision
      ) {
        return null
      }

      return enqueueMutation({
        mutationId:
          mutationId(),

        entityType:
          'chapter',

        entityId:
          entity.id,

        clientRevision:
          entity.revision,

        baseServerVersion:
          state?.serverVersion ??
          null,

        payload:
          entity,
      })
    }

    case 'chapterVersion': {
      const entity =
        chapterVersions.findOne(
          {
            id:
              entityId,
          },
          {
            reactive: false,
          },
        )

      if (!entity) {
        return null
      }

      if (
        state &&
        state.lastSyncedRevision ===
          entity.revision
      ) {
        return null
      }

      return enqueueMutation({
        mutationId:
          mutationId(),

        entityType:
          'chapterVersion',

        entityId:
          entity.id,

        clientRevision:
          entity.revision,

        baseServerVersion:
          state?.serverVersion ??
          null,

        payload:
          entity,
      })
    }
  }
}

export function queueAllDirtyEntities() {
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
    queueEntityMutation(
      'story',
      story.id,
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
    queueEntityMutation(
      'chapter',
      chapter.id,
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
    queueEntityMutation(
      'chapterVersion',
      version.id,
    )
  }

  return getPendingMutations()
}