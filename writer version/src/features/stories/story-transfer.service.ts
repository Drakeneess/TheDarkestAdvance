import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../../domain/models'

import {
  createSyncMetadata,
  isActive,
} from '../../domain/sync-metadata'

interface StoryTransferFile {
  format: 'writer-story'
  version:
    | 1
    | 2

  exportedAt: string

  story: Story

  chapters: Chapter[]

  versions: ChapterVersion[]
}

function id() {
  return crypto.randomUUID()
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === 'object' &&
    value !== null
  )
}

function parseTransferFile(
  value: unknown,
): StoryTransferFile {
  if (!isRecord(value)) {
    throw new Error(
      'El archivo no contiene un objeto válido.',
    )
  }

  if (
    value.format !==
    'writer-story'
  ) {
    throw new Error(
      'El archivo no pertenece a Writer.',
    )
  }

  if (
    value.version !== 1 &&
    value.version !== 2
  ) {
    throw new Error(
      'Versión de archivo no soportada.',
    )
  }

  if (
    !isRecord(value.story) ||
    !Array.isArray(
      value.chapters,
    ) ||
    !Array.isArray(
      value.versions,
    )
  ) {
    throw new Error(
      'La estructura del archivo está incompleta.',
    )
  }

  return value as unknown as StoryTransferFile
}

function sanitizeFilename(
  value: string,
) {
  return value
    .trim()
    .replace(
      // eslint-disable-next-line no-control-regex
      /[<>:"/\\|?*\u0000-\u001F]/g,
      '-',
    )
    .replace(/\s+/g, ' ')
    .slice(0, 100)
}

export function buildStoryExport(
  story: Story,
): StoryTransferFile {
  const storyChapters =
    chapters
      .find(
        {
          storyId: story.id,
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

  const versions:
    ChapterVersion[] = []

  for (
    const chapter
      of storyChapters
  ) {
    const chapterHistory =
      chapterVersions
        .find(
          {
            chapterId:
              chapter.id,
          },
          {
            reactive: false,

            sort: {
              createdAt: 1,
            },
          },
        )
        .fetch()
        .filter(
          isActive,
        )

    versions.push(
      ...chapterHistory,
    )
  }

  return {
    format:
      'writer-story',

    version: 2,

    exportedAt:
      new Date().toISOString(),

    story,

    chapters:
      storyChapters,

    versions,
  }
}

export function exportStoryFile(
  story: Story,
) {
  const data =
    buildStoryExport(
      story,
    )

  const json =
    JSON.stringify(
      data,
      null,
      2,
    )

  const blob =
    new Blob(
      [json],
      {
        type:
          'application/json',
      },
    )

  const url =
    URL.createObjectURL(
      blob,
    )

  const anchor =
    document.createElement(
      'a',
    )

  const safeTitle =
    sanitizeFilename(
      story.title,
    ) || 'story'

  anchor.href = url

  anchor.download =
    `${safeTitle}.writer.json`

  document.body.appendChild(
    anchor,
  )

  anchor.click()

  anchor.remove()

  URL.revokeObjectURL(url)
}

export async function importStoryFile(
  file: File,
): Promise<Story> {
  const text =
    await file.text()

  let raw: unknown

  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error(
      'El archivo no contiene JSON válido.',
    )
  }

  const source =
    parseTransferFile(raw)

  if (
    !isActive(
      source.story,
    )
  ) {
    throw new Error(
      'No se puede importar una historia eliminada.',
    )
  }

  const sourceChapters =
    source.chapters.filter(
      isActive,
    )

  const sourceVersions =
    source.versions.filter(
      isActive,
    )

  const timestamp =
    new Date().toISOString()

  /**
   * IDs antiguos → IDs nuevos.
   */
  const chapterIdMap =
    new Map<
      string,
      string
    >()

  const versionIdMap =
    new Map<
      string,
      string
    >()

  for (
    const chapter
      of sourceChapters
  ) {
    chapterIdMap.set(
      chapter.id,
      id(),
    )
  }

  for (
    const version
      of sourceVersions
  ) {
    versionIdMap.set(
      version.id,
      id(),
    )
  }

  const importedStory:
    Story = {
    ...source.story,

    id: id(),

    updatedAt:
      timestamp,

    ...createSyncMetadata(),
  }

  stories.insert(
    importedStory,
  )

  /**
   * Primero insertamos los capítulos.
   */
  for (
    const sourceChapter
      of sourceChapters
  ) {
    const newChapterId =
      chapterIdMap.get(
        sourceChapter.id,
      )

    if (!newChapterId) {
      continue
    }

    const mappedCurrentVersionId =
      sourceChapter.currentVersionId
        ? (
            versionIdMap.get(
              sourceChapter.currentVersionId,
            ) ?? null
          )
        : null

    const importedChapter:
      Chapter = {
      ...sourceChapter,

      id:
        newChapterId,

      storyId:
        importedStory.id,

      currentVersionId:
        mappedCurrentVersionId,

      ...createSyncMetadata(),
    }

    chapters.insert(
      importedChapter,
    )
  }

  /**
   * Después reconstruimos snapshots
   * y relaciones parentVersionId.
   */
  for (
    const sourceVersion
      of sourceVersions
  ) {
    const newVersionId =
      versionIdMap.get(
        sourceVersion.id,
      )

    const newChapterId =
      chapterIdMap.get(
        sourceVersion.chapterId,
      )

    if (
      !newVersionId ||
      !newChapterId
    ) {
      continue
    }

    const mappedParentId =
      sourceVersion.parentVersionId
        ? (
            versionIdMap.get(
              sourceVersion.parentVersionId,
            ) ?? null
          )
        : null

    const importedVersion:
      ChapterVersion = {
      ...sourceVersion,

      id:
        newVersionId,

      chapterId:
        newChapterId,

      parentVersionId:
        mappedParentId,

      updatedAt:
        sourceVersion.updatedAt ??
        sourceVersion.createdAt,

      ...createSyncMetadata(),
    }

    chapterVersions.insert(
      importedVersion,
    )
  }

  return importedStory
}