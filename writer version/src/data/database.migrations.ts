import type {
  Collection,
} from '@signaldb/core'

import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../domain/models'

import {
  normalizeStoryAssets,
  normalizeStoryProfile,
  normalizeStoryVisuals,
} from '../domain/story-profile'

import {
  createUniqueSlug,
} from '../domain/slug'

import {
  DEFAULT_STORY_THEME_KEY,
} from '../domain/story-theme'

export const DATABASE_SCHEMA_VERSION =
  4

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

function hasText(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
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

function migrateStoryEditorialFields(
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

  /**
   * Conservamos slugs válidos existentes.
   * Los tombstones también reservan su slug
   * para no reutilizar identidades antiguas.
   */
  const usedSlugs =
    new Set(
      records
        .map(
          (story) =>
            story.slug,
        )
        .filter(
          hasText,
        ),
    )

  for (
    const story
      of records
  ) {
    const update:
      Partial<Story> = {}

    if (!hasText(story.slug)) {
      const slug =
        createUniqueSlug(
          story.title,
          usedSlugs,
          `story-${story.id.slice(0, 8)}`,
        )

      update.slug = slug
      usedSlugs.add(slug)
    }

    if (!hasText(story.themeKey)) {
      update.themeKey =
        DEFAULT_STORY_THEME_KEY
    }

    if (
      Object.keys(
        update,
      ).length === 0
    ) {
      continue
    }

    /**
     * Esta migración solo completa el esquema.
     * No representa una edición del usuario:
     * revision, timestamps y tombstones
     * permanecen intactos.
     */
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

function migrateChapterEditorialFields(
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

  const usedByStory =
    new Map<
      string,
      Set<string>
    >()

  for (
    const chapter
      of records
  ) {
    if (!hasText(chapter.slug)) {
      continue
    }

    const used =
      usedByStory.get(
        chapter.storyId,
      ) ?? new Set<string>()

    used.add(chapter.slug)

    usedByStory.set(
      chapter.storyId,
      used,
    )
  }

  for (
    const chapter
      of records
  ) {
    if (hasText(chapter.slug)) {
      continue
    }

    const used =
      usedByStory.get(
        chapter.storyId,
      ) ?? new Set<string>()

    const slug =
      createUniqueSlug(
        chapter.title,
        used,
        `chapter-${chapter.id.slice(0, 8)}`,
      )

    used.add(slug)

    usedByStory.set(
      chapter.storyId,
      used,
    )

    /**
     * Igual que Story, Chapter conserva
     * revision, timestamps y tombstone.
     */
    collection.updateOne(
      {
        id: chapter.id,
      },
      {
        $set: {
          slug,
        },
      },
    )
  }
}

function migrateToVersion3(
  collections:
    DatabaseCollections,
) {
  migrateStoryEditorialFields(
    collections.stories,
  )

  migrateChapterEditorialFields(
    collections.chapters,
  )
}

function migrateStoryProfiles(
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
    /**
     * La V4 completa y normaliza el contrato,
     * incluso si una build intermedia escribió
     * datos parciales.
     *
     * No incrementamos revision ni updatedAt:
     * esto es una migración de esquema local,
     * no una edición del usuario.
     */
    collection.updateOne(
      {
        id: story.id,
      },
      {
        $set: {
          profile:
            normalizeStoryProfile(
              story.profile,
            ),

          assets:
            normalizeStoryAssets(
              story.assets,
            ),

          visuals:
            normalizeStoryVisuals(
              story.visuals,
            ),
        },
      },
    )
  }
}

function migrateToVersion4(
  collections:
    DatabaseCollections,
) {
  migrateStoryProfiles(
    collections.stories,
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

  const parsedVersion =
    rawVersion
      ? Number(rawVersion)
      : 1

  const storedVersion =
    Number.isFinite(
      parsedVersion,
    ) &&
    parsedVersion >= 1
      ? parsedVersion
      : 1

  if (storedVersion < 2) {
    migrateToVersion2(
      collections,
    )
  }

  if (storedVersion < 3) {
    migrateToVersion3(
      collections,
    )
  }

  if (storedVersion < 4) {
    migrateToVersion4(
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
