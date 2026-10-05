import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import type {
  Chapter,
} from '../../domain/models'

import {
  createDeleteMetadata,
  createSyncMetadata,
  createUpdateMetadata,
  isActive,
} from '../../domain/sync-metadata'

function now() {
  return new Date().toISOString()
}

function id() {
  return crypto.randomUUID()
}

function touchStory(
  storyId: string,
  timestamp: string,
) {
  const story =
    stories.findOne(
      {
        id: storyId,
      },
      {
        reactive: false,
      },
    )

  stories.updateOne(
    {
      id: storyId,
    },
    {
      $set: {
        ...createUpdateMetadata(
          story?.revision,
          timestamp,
        ),
      },
    },
  )
}

export function renameChapter(
  chapter: Chapter,
  title: string,
) {
  const normalizedTitle =
    title.trim()

  if (!normalizedTitle) {
    return
  }

  const timestamp = now()

  const currentChapter =
    chapters.findOne(
      {
        id: chapter.id,
      },
      {
        reactive: false,
      },
    ) ?? chapter

  chapters.updateOne(
    {
      id: chapter.id,
    },
    {
      $set: {
        title:
          normalizedTitle,

        ...createUpdateMetadata(
          currentChapter.revision,
          timestamp,
        ),
      },
    },
  )

  touchStory(
    chapter.storyId,
    timestamp,
  )
}

export function moveChapter(
  chapter: Chapter,
  direction:
    | 'up'
    | 'down',
) {
  const siblings =
    chapters
      .find(
        {
          storyId:
            chapter.storyId,
        },
        {
          reactive: false,

          sort: {
            order: 1,
          },
        },
      )
      .fetch()

  const currentIndex =
    siblings.findIndex(
      (candidate) =>
        candidate.id ===
        chapter.id,
    )

  if (currentIndex === -1) {
    return
  }

  const targetIndex =
    direction === 'up'
      ? currentIndex - 1
      : currentIndex + 1

  if (
    targetIndex < 0 ||
    targetIndex >=
      siblings.length
  ) {
    return
  }

  const current =
    siblings[currentIndex]

  const target =
    siblings[targetIndex]

  const timestamp = now()

  chapters.updateOne(
    {
      id: current.id,
    },
    {
      $set: {
        order:
          target.order,

        ...createUpdateMetadata(
          current.revision,
          timestamp,
        ),
      },
    },
  )

  chapters.updateOne(
    {
      id: target.id,
    },
    {
      $set: {
        order:
          current.order,

        ...createUpdateMetadata(
          target.revision,
          timestamp,
        ),
      },
    },
  )

  touchStory(
    chapter.storyId,
    timestamp,
  )
}

export function duplicateChapter(
  chapter: Chapter,
): Chapter {
  /**
   * Volvemos a leer el capítulo para
   * obtener el draftContent más reciente.
   */
  const source =
    chapters.findOne(
      {
        id: chapter.id,
      },
      {
        reactive: false,
      },
    ) ?? chapter

  let content =
    source.draftContent

  /**
   * Compatibilidad con capítulos antiguos
   * que todavía no tengan draftContent.
   */
  if (
    typeof content !==
      'string'
  ) {
    if (
      source.currentVersionId
    ) {
      const currentVersion =
        chapterVersions.findOne(
          {
            id:
              source.currentVersionId,
          },
          {
            reactive: false,
          },
        )

      content =
        currentVersion?.content ??
        ''
    } else {
      content = ''
    }
  }

  const siblings =
    chapters
      .find(
        {
          storyId:
            source.storyId,
        },
        {
          reactive: false,

          sort: {
            order: 1,
          },
        },
      )
      .fetch()

  const timestamp = now()

  /**
   * Insertaremos la copia justo después
   * del capítulo original.
   *
   * Primero desplazamos los posteriores.
   */
  for (
    const sibling of siblings
  ) {
    if (
      sibling.order >
      source.order
    ) {
      chapters.updateOne(
        {
          id: sibling.id,
        },
        {
          $set: {
            order:
              sibling.order + 1,

            ...createUpdateMetadata(
              sibling.revision,
              timestamp,
            ),
          },
        },
      )
    }
  }

  const duplicated: Chapter = {
    id: id(),

    storyId:
      source.storyId,

    title:
      `${source.title} · copia`,

    order:
      source.order + 1,

    /**
     * Una copia es un capítulo nuevo.
     * No hereda historial.
     */
    currentVersionId:
      null,

    draftContent:
      content,

    draftUpdatedAt:
      timestamp,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
    ...createSyncMetadata(),
  }

  chapters.insert(
    duplicated,
  )

  touchStory(
    source.storyId,
    timestamp,
  )

  return duplicated
}

export function deleteChapter(
  chapter: Chapter,
) {
  const timestamp = now()

  const currentChapter =
    chapters.findOne(
      {
        id: chapter.id,
      },
      {
        reactive: false,
      },
    ) ?? chapter

  /**
   * Las versiones ya no desaparecen.
   * Se convierten en tombstones.
   */
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
    const version of versions
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
          currentChapter.revision,
          timestamp,
        ),
      },
    },
  )

  /**
   * Recalculamos únicamente capítulos activos.
   */
  const remaining =
    chapters
      .find(
        {
          storyId:
            chapter.storyId,
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

  remaining.forEach(
    (
      remainingChapter,
      index,
    ) => {
      const expectedOrder =
        index + 1

      if (
        remainingChapter.order ===
        expectedOrder
      ) {
        return
      }

      chapters.updateOne(
        {
          id:
            remainingChapter.id,
        },
        {
          $set: {
            order:
              expectedOrder,

            ...createUpdateMetadata(
              remainingChapter.revision,
              timestamp,
            ),
          },
        },
      )
    },
  )

  touchStory(
    chapter.storyId,
    timestamp,
  )
}