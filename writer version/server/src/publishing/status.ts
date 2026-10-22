import {
  db,
} from '../db'

export interface ChapterPublicationStatusInput {
  workspaceId: string
  storyId: string
  chapterId: string
}

export async function getChapterPublicationStatus({
  workspaceId,
  storyId,
  chapterId,
}: ChapterPublicationStatusInput) {
  const chapter =
    await db.publishedChapter.findUnique({
      where: {
        workspaceId_storyId_chapterId: {
          workspaceId,
          storyId,
          chapterId,
        },
      },
      select: {
        sourceVersionId: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

  if (!chapter) {
    return {
      published: false as const,
      chapter: null,
    }
  }

  return {
    published: true as const,

    chapter: {
      sourceVersionId:
        chapter.sourceVersionId,

      publishedAt:
        chapter.publishedAt
          .toISOString(),

      updatedAt:
        chapter.updatedAt
          .toISOString(),
    },
  }
}
