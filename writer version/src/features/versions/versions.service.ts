import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import type {
  Chapter,
  ChapterVersion,
} from '../../domain/models'

import {
  createDeleteMetadata,
  createSyncMetadata,
  createUpdateMetadata,
  isActive,
  getActiveEntity,
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

function touchStory(
  chapter: Chapter,
  timestamp: string,
) {
  const story =
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
          story?.revision,
          timestamp,
        ),
      },
    },
  )
}

/**
 * Cambia únicamente la etiqueta.
 * El contenido del snapshot sigue siendo inmutable.
 */
export function renameChapterVersion(
  chapter: Chapter,
  version: ChapterVersion,
  label: string,
) {
  const normalizedLabel =
    label.trim()

  if (!normalizedLabel) {
    return
  }

  const timestamp = now()

  const currentVersion =
    getActiveEntity(
      chapterVersions.findOne(
        {
          id: version.id,
        },
        {
          reactive: false,
        },
      ),
    )

  if (!currentVersion) {
    return
  }

  chapterVersions.updateOne(
    {
      id: version.id,
    },
    {
      $set: {
        label:
          normalizedLabel,

        ...createUpdateMetadata(
          currentVersion.revision,
          timestamp,
        ),
      },
    },
  )

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
        ...createUpdateMetadata(
          currentChapter.revision,
          timestamp,
        ),
      },
    },
  )

  touchStory(
    chapter,
    timestamp,
  )
}

/**
 * Crea una nueva variante histórica basada
 * en el snapshot seleccionado.
 *
 * NO modifica:
 *
 * - draftContent
 * - currentVersionId
 *
 * La nueva versión apunta a la original
 * mediante parentVersionId.
 */
export function duplicateChapterVersion(
  chapter: Chapter,
  source: ChapterVersion,
): ChapterVersion {
  const timestamp = now()

  const duplicated: ChapterVersion = {
    id: id(),

    chapterId:
      chapter.id,

    parentVersionId:
      source.id,

    label:
      `${source.label} · variante`,

    content:
      source.content,

    createdAt:
      timestamp,

    deviceId:
      getDeviceId(),

     updatedAt: timestamp,
    ...createSyncMetadata(),
  }

  chapterVersions.insert(
    duplicated,
  )

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
        ...createUpdateMetadata(
          currentChapter.revision,
          timestamp,
        ),
      },
    },
  )

  touchStory(
    chapter,
    timestamp,
  )

  return duplicated
}

/**
 * Elimina un snapshot manteniendo consistente
 * la cadena de versiones.
 *
 * Si existen hijos:
 *
 * hijo → versión eliminada → padre
 *
 * pasa a:
 *
 * hijo → padre
 */
export function deleteChapterVersion(
  chapter: Chapter,
  version: ChapterVersion,
) {
  const timestamp = now()

  const currentVersion =
    chapterVersions.findOne(
      {
        id: version.id,
      },
      {
        reactive: false,
      },
    ) ?? version

  const currentChapter =
    chapters.findOne(
      {
        id: chapter.id,
      },
      {
        reactive: false,
      },
    ) ?? chapter

  const activeVersions =
    chapterVersions
      .find(
        {
          chapterId:
            chapter.id,
        },
        {
          reactive: false,

          sort: {
            createdAt: -1,
          },
        },
      )
      .fetch()
      .filter(
        isActive,
      )

  const remainingVersions =
    activeVersions.filter(
      (candidate) =>
        candidate.id !==
        version.id,
    )

  /**
   * Solo conservamos el padre original
   * si sigue existiendo y está activo.
   */
  const parentStillExists =
    version.parentVersionId
      ? remainingVersions.some(
          (candidate) =>
            candidate.id ===
            version.parentVersionId,
        )
      : false

  const replacementParentId =
    parentStillExists
      ? version.parentVersionId
      : null

  /**
   * Reparamos hijos individualmente.
   *
   * No usamos updateMany porque cada registro
   * tiene una revision independiente.
   */
  const children =
    activeVersions.filter(
      (candidate) =>
        candidate.parentVersionId ===
        version.id,
    )

  for (
    const child of children
  ) {
    chapterVersions.updateOne(
      {
        id: child.id,
      },
      {
        $set: {
          parentVersionId:
            replacementParentId,

          ...createUpdateMetadata(
            child.revision,
            timestamp,
          ),
        },
      },
    )
  }

  /**
   * Tombstone de la versión.
   */
  chapterVersions.updateOne(
    {
      id: version.id,
    },
    {
      $set: {
        ...createDeleteMetadata(
          currentVersion.revision,
          timestamp,
        ),
      },
    },
  )

  /**
   * Si era currentVersionId,
   * elegimos fallback.
   */
  if (
    currentChapter.currentVersionId ===
    version.id
  ) {
    const fallbackVersionId =
      replacementParentId ??
      remainingVersions[0]?.id ??
      null

    chapters.updateOne(
      {
        id: chapter.id,
      },
      {
        $set: {
          currentVersionId:
            fallbackVersionId,

          ...createUpdateMetadata(
            currentChapter.revision,
            timestamp,
          ),
        },
      },
    )
  } else {
    chapters.updateOne(
      {
        id: chapter.id,
      },
      {
        $set: {
          ...createUpdateMetadata(
            currentChapter.revision,
            timestamp,
          ),
        },
      },
    )
  }

  touchStory(
    chapter,
    timestamp,
  )
}