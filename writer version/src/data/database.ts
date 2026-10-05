import {
  Collection,
} from '@signaldb/core'

import createIndexedDBAdapter from '@signaldb/indexeddb'

import maverickReactivityAdapter from '@signaldb/maverickjs'

import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../domain/models'

import {
  migrateDatabase,
} from './database.migrations'

import type {
  SyncCheckpoint,
  SyncEntityState,
  SyncOutboxItem,
} from '../sync/sync-state'

const persistenceOptions = {
  prefix: 'writer-',
}

export const stories =
  new Collection<Story>({
    reactivity:
      maverickReactivityAdapter,

    persistence:
      createIndexedDBAdapter(
        'stories',
        persistenceOptions,
      ),
  })

export const chapters =
  new Collection<Chapter>({
    reactivity:
      maverickReactivityAdapter,

    persistence:
      createIndexedDBAdapter(
        'chapters',
        persistenceOptions,
      ),
  })

export const chapterVersions =
  new Collection<ChapterVersion>({
    reactivity:
      maverickReactivityAdapter,

    persistence:
      createIndexedDBAdapter(
        'chapter-versions',
        persistenceOptions,
      ),
  })

export const syncCheckpoints =
  new Collection<SyncCheckpoint>({
    reactivity:
      maverickReactivityAdapter,

    persistence:
      createIndexedDBAdapter(
        'sync-checkpoints',
        persistenceOptions,
      ),
  })

export const syncEntityStates =
  new Collection<SyncEntityState>({
    reactivity:
      maverickReactivityAdapter,

    persistence:
      createIndexedDBAdapter(
        'sync-entity-states',
        persistenceOptions,
      ),
  })

export const syncOutbox =
  new Collection<SyncOutboxItem>({
    reactivity:
      maverickReactivityAdapter,

    persistence:
      createIndexedDBAdapter(
        'sync-outbox',
        persistenceOptions,
      ),
  })

const collectionsReady =
  Promise.all([
    stories.isReady(),
    chapters.isReady(),
    chapterVersions.isReady(),

    syncCheckpoints.isReady(),
    syncEntityStates.isReady(),
    syncOutbox.isReady(),
  ])

export const databaseReady =
  collectionsReady.then(
    () => {
      migrateDatabase({
        stories,
        chapters,
        chapterVersions,
      })
    },
  )