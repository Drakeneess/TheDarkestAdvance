import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import type {
  Chapter,
  Story,
} from '../../domain/models'

import type {
  StoryCustomLayout,
} from '../../domain/story-layout'

import {
  normalizeStoryCustomLayout,
} from '../../domain/story-layout'

import type {
  StoryAssets,
  StoryStatus,
  StoryVisuals,
} from '../../domain/story-profile'

import {
  normalizeStoryAssets,
  normalizeStoryProfile,
  normalizeStoryVisuals,
} from '../../domain/story-profile'

import {
  createUniqueSlug,
} from '../../domain/slug'

import {
  DEFAULT_STORY_THEME_KEY,
} from '../../domain/story-theme'

import {
  createDeleteMetadata,
  createSyncMetadata,
  createUpdateMetadata,
  isActive,
  getActiveEntity,
} from '../../domain/sync-metadata'

function now() {
  return new Date().toISOString()
}

function id() {
  return crypto.randomUUID()
}

function getUsedStorySlugs() {
  return stories
    .find(
      {},
      {
        reactive: false,
      },
    )
    .fetch()
    .map(
      (story) =>
        story.slug,
    )
    .filter(
      (slug): slug is string =>
        typeof slug === 'string' &&
        slug.length > 0,
    )
}

function getChapterContent(
  chapter: Chapter,
) {
  if (
    typeof chapter.draftContent ===
    'string'
  ) {
    return chapter.draftContent
  }

  if (!chapter.currentVersionId) {
    return ''
  }

  const currentVersion =
    getActiveEntity(
      chapterVersions.findOne(
        {
          id:
            chapter.currentVersionId,
        },
        {
          reactive: false,
        },
      ),
    )

  return (
    currentVersion?.content ??
    ''
  )
}

export interface StoryEditorialProfileInput {
  title: string
  description: string
  subtitle: string
  authorName: string
  status: StoryStatus
  language: string
  genres: string[]
  tags: string[]
  contentRating: string | null
}

export interface StoryVisualIdentityInput {
  themeKey: string
  assets: StoryAssets
  visuals: StoryVisuals
}

export type StoryCustomLayoutInput =
  StoryCustomLayout

export function updateStoryEditorialProfile(
  story: Story,
  input: StoryEditorialProfileInput,
) {
  const title =
    input.title.trim()

  if (!title) {
    throw new Error(
      'El título de la historia no puede quedar vacío.',
    )
  }

  const timestamp = now()

  const currentStory =
    getActiveEntity(
      stories.findOne(
        {
          id: story.id,
        },
        {
          reactive: false,
        },
      ),
    )

  if (!currentStory) {
    throw new Error(
      'La historia ya no está disponible.',
    )
  }

  const profile =
    normalizeStoryProfile({
      subtitle:
        input.subtitle,
      authorName:
        input.authorName,
      status:
        input.status,
      language:
        input.language,
      genres:
        input.genres,
      tags:
        input.tags,
      contentRating:
        input.contentRating,
    })

  stories.updateOne(
    {
      id: story.id,
    },
    {
      $set: {
        title,
        description:
          input.description.trim(),
        profile,

        ...createUpdateMetadata(
          currentStory.revision,
          timestamp,
        ),
      },
    },
  )
}

export function updateStoryVisualIdentity(
  story: Story,
  input: StoryVisualIdentityInput,
) {
  const themeKey =
    input.themeKey.trim()

  if (!themeKey) {
    throw new Error(
      'La historia necesita una clave de tema base.',
    )
  }

  const timestamp = now()

  const currentStory =
    getActiveEntity(
      stories.findOne(
        {
          id: story.id,
        },
        {
          reactive: false,
        },
      ),
    )

  if (!currentStory) {
    throw new Error(
      'La historia ya no está disponible.',
    )
  }

  stories.updateOne(
    {
      id: story.id,
    },
    {
      $set: {
        themeKey,
        assets:
          normalizeStoryAssets(
            input.assets,
          ),
        visuals:
          normalizeStoryVisuals(
            input.visuals,
          ),

        ...createUpdateMetadata(
          currentStory.revision,
          timestamp,
        ),
      },
    },
  )
}

export function updateStoryCustomLayout(
  story: Story,
  input: StoryCustomLayoutInput,
) {
  const timestamp = now()

  const currentStory =
    getActiveEntity(
      stories.findOne(
        {
          id: story.id,
        },
        {
          reactive: false,
        },
      ),
    )

  if (!currentStory) {
    throw new Error(
      'La historia ya no está disponible.',
    )
  }

  stories.updateOne(
    {
      id: story.id,
    },
    {
      $set: {
        layout:
          normalizeStoryCustomLayout(
            input,
          ),

        ...createUpdateMetadata(
          currentStory.revision,
          timestamp,
        ),
      },
    },
  )
}

export function renameStory(
  story: Story,
  title: string,
) {
  const normalizedTitle =
    title.trim()

  if (!normalizedTitle) {
    return
  }

  const timestamp = now()

  const currentStory =
    stories.findOne(
      {
        id: story.id,
      },
      {
        reactive: false,
      },
    ) ?? story

  stories.updateOne(
    {
      id: story.id,
    },
    {
      $set: {
        title:
          normalizedTitle,

        ...createUpdateMetadata(
          currentStory.revision,
          timestamp,
        ),
      },
    },
  )
}

export function duplicateStory(
  story: Story,
): Story {
  const timestamp = now()
  const duplicatedStoryId = id()
  const duplicatedTitle =
    `${story.title} · copia`

  const duplicatedStory: Story = {
    id: duplicatedStoryId,

    slug:
      createUniqueSlug(
        duplicatedTitle,
        getUsedStorySlugs(),
        `story-${duplicatedStoryId.slice(0, 8)}`,
      ),

    themeKey:
      typeof story.themeKey ===
        'string' &&
      story.themeKey.trim().length > 0
        ? story.themeKey
        : DEFAULT_STORY_THEME_KEY,

    title:
      duplicatedTitle,

    description:
      story.description,

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

    layout:
      normalizeStoryCustomLayout(
        story.layout,
      ),

    createdAt:
      timestamp,

    updatedAt:
      timestamp,

    ...createSyncMetadata(),
  }

  stories.insert(
    duplicatedStory,
  )

  const sourceChapters =
    chapters
      .find(
        {
          storyId:
            story.id,
        },
        {
          reactive: false,

          sort: {
            order: 1,
          },
        },
      )
      .fetch()
      .filter(
        isActive,
      )

  const usedChapterSlugs:
    string[] = []

  for (
    const sourceChapter
      of sourceChapters
  ) {
    const duplicatedChapterId =
      id()

    const duplicatedChapterSlug =
      createUniqueSlug(
        typeof sourceChapter.slug ===
          'string' &&
        sourceChapter.slug.trim().length > 0
          ? sourceChapter.slug
          : sourceChapter.title,
        usedChapterSlugs,
        `chapter-${duplicatedChapterId.slice(0, 8)}`,
      )

    usedChapterSlugs.push(
      duplicatedChapterSlug,
    )

    const duplicatedChapter:
      Chapter = {
      id:
        duplicatedChapterId,

      storyId:
        duplicatedStory.id,

      slug:
        duplicatedChapterSlug,

      title:
        sourceChapter.title,

      order:
        sourceChapter.order,

      currentVersionId:
        null,

      draftContent:
        getChapterContent(
          sourceChapter,
        ),

      draftUpdatedAt:
        timestamp,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,

      ...createSyncMetadata(),
    }

    chapters.insert(
      duplicatedChapter,
    )
  }

  return duplicatedStory
}

export function deleteStory(
  story: Story,
) {
  const timestamp = now()

  const currentStory =
    stories.findOne(
      {
        id: story.id,
      },
      {
        reactive: false,
      },
    ) ?? story

  const storyChapters =
    chapters
      .find(
        {
          storyId:
            story.id,
        },
        {
          reactive: false,
        },
      )
      .fetch()
      .filter(
        isActive,
      )

  for (
    const chapter
      of storyChapters
  ) {
    const versions =
      chapterVersions
        .find(
          {
            chapterId:
              chapter.id,
          },
          {
            reactive: false,
          },
        )
        .fetch()
        .filter(
          isActive,
        )

    for (
      const version
        of versions
    ) {
      chapterVersions.updateOne(
        {
          id: version.id,
        },
        {
          $set: {
            ...createDeleteMetadata(
              version.revision,
              timestamp,
            ),
          },
        },
      )
    }

    chapters.updateOne(
      {
        id: chapter.id,
      },
      {
        $set: {
          ...createDeleteMetadata(
            chapter.revision,
            timestamp,
          ),
        },
      },
    )
  }

  stories.updateOne(
    {
      id: story.id,
    },
    {
      $set: {
        ...createDeleteMetadata(
          currentStory.revision,
          timestamp,
        ),
      },
    },
  )
}
