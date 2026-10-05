import type {
  Collection,
} from '@signaldb/core'

import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../domain/models'

export const DATABASE_SCHEMA_VERSION =
  2

const SCHEMA_VERSION_KEY =
  'writer:database-schema-version'

interface DatabaseCollections {
  stories:
    Collection<Story>

  chapters:
    Collection<Chapter>

  chapterVersions:
    Collection<ChapterVersion>
}

function needsRevisionMigration(
  revision:
    | number
    | null
    | undefined,
) {
  return (
    typeof revision !==
      'number' ||
    !Number.isFinite(
      revision,
    ) ||
    revision < 1
  )
}

function migrateStories(
  collection:
    Collection<Story>,
) {
  const records =
    collection
      .find(
        {},
        {
          reactive: false,
        },
      )
      .fetch()

  for (
    const story
      of records
  ) {
    const update:
      Partial<Story> = {}

    if (
      needsRevisionMigration(
        story.revision,
      )
    ) {
      update.revision = 1
    }

    if (
      story.deletedAt ===
      undefined
    ) {
      update.deletedAt = null
    }

    if (
      Object.keys(
        update,
      ).length === 0
    ) {
      continue
    }

    collection.updateOne(
      {
        id: story.id,
      },
      {
        $set: update,
      },
    )
  }
}

function migrateChapters(
  collection:
    Collection<Chapter>,
) {
  const records =
    collection
      .find(
        {},
        {
          reactive: false,
        },
      )
      .fetch()

  for (
    const chapter
      of records
  ) {
    const update:
      Partial<Chapter> = {}

    if (
      needsRevisionMigration(
        chapter.revision,
      )
    ) {
      update.revision = 1
    }

    if (
      chapter.deletedAt ===
      undefined
    ) {
      update.deletedAt = null
    }

    if (
      Object.keys(
        update,
      ).length === 0
    ) {
      continue
    }

    collection.updateOne(
      {
        id: chapter.id,
      },
      {
        $set: update,
      },
    )
  }
}

function migrateChapterVersions(
  collection:
    Collection<ChapterVersion>,
) {
  const records =
    collection
      .find(
        {},
        {
          reactive: false,
        },
      )
      .fetch()

  for (
    const version
      of records
  ) {
    const update:
      Partial<ChapterVersion> =
        {}

    if (
      needsRevisionMigration(
        version.revision,
      )
    ) {
      update.revision = 1
    }

    if (
      version.deletedAt ===
      undefined
    ) {
      update.deletedAt =
        null
    }

    /**
     * Las versiones antiguas no tenían
     * updatedAt.
     *
     * createdAt es el único timestamp
     * histórico verificable que tenemos.
     */
    if (
      !version.updatedAt
    ) {
      update.updatedAt =
        version.createdAt
    }

    if (
      Object.keys(
        update,
      ).length === 0
    ) {
      continue
    }

    collection.updateOne(
      {
        id: version.id,
      },
      {
        $set: update,
      },
    )
  }
}

function migrateToVersion2(
  collections:
    DatabaseCollections,
) {
  migrateStories(
    collections.stories,
  )

  migrateChapters(
    collections.chapters,
  )

  migrateChapterVersions(
    collections.chapterVersions,
  )
}

export function migrateDatabase(
  collections:
    DatabaseCollections,
) {
  const rawVersion =
    localStorage.getItem(
      SCHEMA_VERSION_KEY,
    )

  const storedVersion =
    rawVersion
      ? Number(rawVersion)
      : 1

  if (
    !Number.isFinite(
      storedVersion,
    ) ||
    storedVersion < 2
  ) {
    migrateToVersion2(
      collections,
    )
  }

  localStorage.setItem(
    SCHEMA_VERSION_KEY,
    String(
      DATABASE_SCHEMA_VERSION,
    ),
  )
}