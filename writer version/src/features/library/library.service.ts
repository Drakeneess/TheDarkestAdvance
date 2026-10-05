import { chapterVersions, chapters, stories } from '../../data/database'
import type { Chapter, ChapterVersion, Story } from '../../domain/models'
import {
  createSyncMetadata,
  createUpdateMetadata,
  getActiveEntity,
  isActive,
} from '../../domain/sync-metadata'
import {
  getDeviceId,
} from '../../sync/device-id'

function now() {
  return new Date().toISOString()
}

function id() {
  return crypto.randomUUID()
}

export function createStory(title: string, description = ''): Story {
  const timestamp = now()

  const story: Story = {
    id: id(),
    title: title.trim(),
    description: description.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,

    ...createSyncMetadata(),
  }

  stories.insert(story)

  return story
}

export function createChapter(
  storyId: string,
  title: string,
): Chapter {
  const currentStory =
    getActiveEntity(
      stories.findOne(
        {
          id: storyId,
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

  const existing =
    chapters
      .find(
        {
          storyId,
        },
        {
          reactive: false,
        },
      )
      .fetch()
      .filter(
        isActive,
      )

  const timestamp = now()

  const chapter: Chapter = {
    id: id(),

    storyId,

    title:
      title.trim(),

    order:
      existing.length + 1,

    currentVersionId:
      null,

    draftContent:
      '',

    draftUpdatedAt:
      timestamp,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,

    ...createSyncMetadata(),
  }

  chapters.insert(
    chapter,
  )

  stories.updateOne(
    {
      id: storyId,
    },
    {
      $set: {
        ...createUpdateMetadata(
          currentStory.revision,
          timestamp,
        ),
      },
    },
  )

  return chapter
}

/**
 * Guarda el estado actual de trabajo.
 *
 * Esto NO genera una nueva ChapterVersion.
 */
export function saveChapterDraft(
  chapterId: string,
  storyId: string,
  content: string,
) {
  const timestamp = now()

  const currentChapter =
    getActiveEntity(
      chapters.findOne(
        {
          id: chapterId,
        },
        {
          reactive: false,
        },
      ),
    )

  if (!currentChapter) {
    return
  }

  chapters.updateOne(
    {
      id: chapterId,
    },
    {
      $set: {
        draftContent:
          content,

        draftUpdatedAt:
          timestamp,

        ...createUpdateMetadata(
          currentChapter?.revision,
          timestamp,
        ),
      },
    },
  )

  const currentStory =
    getActiveEntity(
      stories.findOne(
        {
          id: storyId,
        },
        {
          reactive: false,
        },
      ),
    )

  if (!currentStory) {
    return
  }

  stories.updateOne(
    {
      id: storyId,
    },
    {
      $set: {
        ...createUpdateMetadata(
          currentStory?.revision,
          timestamp,
        ),
      },
    },
  )
}

/**
 * Crea un snapshot inmutable del contenido actual.
 */
export function saveChapterVersion(
  chapter: Chapter,
  content: string,
  label = 'Snapshot',
): ChapterVersion {
  const timestamp = now()

  /**
   * Buscamos el capítulo otra vez para asegurarnos de obtener
   * el currentVersionId más reciente.
   */
  const currentChapter =
    chapters.findOne(
      { id: chapter.id },
      { reactive: false },
    ) ?? chapter

  const version: ChapterVersion = {
    id: id(),
    chapterId: chapter.id,
    parentVersionId:
      currentChapter.currentVersionId,
    label:
      label.trim() ||
      'Snapshot',
    content,

    createdAt: timestamp,
    updatedAt: timestamp,

    deviceId:
      getDeviceId(),

    ...createSyncMetadata(),
  }

  chapterVersions.insert(version)

  chapters.updateOne(
    {
      id: chapter.id,
    },
    {
      $set: {
        currentVersionId:
          version.id,

        draftContent:
          content,

        draftUpdatedAt:
          timestamp,

        ...createUpdateMetadata(
          currentChapter.revision,
          timestamp,
        ),
      },
    },
  )

  const currentStory =
    stories.findOne(
      {
        id: chapter.storyId,
      },
      {
        reactive: false,
      },
    )

  stories.updateOne(
    {
      id: chapter.storyId,
    },
    {
      $set: {
        ...createUpdateMetadata(
          currentStory?.revision,
          timestamp,
        ),
      },
    },
  )

  return version
}

/**
 * Restaurar una versión NO elimina historia.
 *
 * Simplemente copia ese contenido nuevamente al borrador.
 */
export function restoreVersionToDraft(
  chapter: Chapter,
  version: ChapterVersion,
) {
  saveChapterDraft(
    chapter.id,
    chapter.storyId,
    version.content,
  )
}
