import {
  db,
} from '../db'

export interface StoryPublicationStatusInput {
  workspaceId: string
  storyId: string
}

export interface ChapterPublicationStatusInput
  extends StoryPublicationStatusInput {
  chapterId: string
}

export async function getStoryPublicationStatus({
  workspaceId,
  storyId,
}: StoryPublicationStatusInput) {
  const story =
    await db.publishedStory.findUnique({
      where: {
        workspaceId_storyId: {
          workspaceId,
          storyId,
        },
      },
      select: {
        slug: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

  if (!story) {
    return {
      published: false as const,
      story: null,
    }
  }

  return {
    published: true as const,

    story: {
      slug:
        story.slug,

      publishedAt:
        story.publishedAt
          .toISOString(),

      updatedAt:
        story.updatedAt
          .toISOString(),
    },
  }
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
