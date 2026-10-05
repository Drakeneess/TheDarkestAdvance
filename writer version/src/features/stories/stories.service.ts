import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import type {
  Chapter,
  Story,
} from '../../domain/models'

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

  const duplicatedStory: Story = {
    id: id(),

    title:
      `${story.title} · copia`,

    description:
      story.description,

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

  for (
    const sourceChapter
      of sourceChapters
  ) {
    const duplicatedChapter:
      Chapter = {
      id: id(),

      storyId:
        duplicatedStory.id,

      title:
        sourceChapter.title,

      order:
        sourceChapter.order,

      /**
       * La nueva historia comienza
       * sin historial de snapshots.
       */
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

  /**
   * Tombstones de todas las versiones.
   */
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

    /**
     * Tombstone del capítulo.
     */
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

  /**
   * Finalmente tombstone de la historia.
   */
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