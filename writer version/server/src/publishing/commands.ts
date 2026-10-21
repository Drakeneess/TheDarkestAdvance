import {
  Prisma,
} from '../../generated/prisma/client'

import {
  db,
} from '../db'

import {
  PublishingError,
} from './errors'

import {
  publishableStorySchema,
} from './schemas'

export type PublishStoryInput = {
  workspaceId: string
  storyId: string
}

export type UnpublishStoryInput =
  PublishStoryInput

export type UnpublishChapterInput = {
  workspaceId: string
  storyId: string
  chapterId: string
}

export async function publishStory({
  workspaceId,
  storyId,
}: PublishStoryInput) {
  return db.$transaction(
    async (tx) => {
      const storyRecord =
        await tx.syncEntity.findUnique({
          where: {
            workspaceId_entityType_entityId: {
              workspaceId,
              entityType: 'story',
              entityId: storyId,
            },
          },
        })

      if (!storyRecord) {
        throw new PublishingError(
          'STORY_NOT_FOUND',
          'La historia sincronizada no existe.',
        )
      }

      if (storyRecord.deletedAt) {
        throw new PublishingError(
          'STORY_DELETED',
          'No se puede publicar una historia eliminada.',
        )
      }

      const parsed =
        publishableStorySchema.safeParse(
          storyRecord.payload,
        )

      if (!parsed.success) {
        throw new PublishingError(
          'STORY_INVALID',
          'La historia no contiene metadata publicable válida.',
        )
      }

      const story = parsed.data

      const slugOwner =
        await tx.publishedStory.findUnique({
          where: {
            slug: story.slug,
          },
        })

      if (
        slugOwner &&
        (
          slugOwner.workspaceId !==
            workspaceId ||
          slugOwner.storyId !== storyId
        )
      ) {
        throw new PublishingError(
          'STORY_SLUG_CONFLICT',
          'El slug público de la historia ya está en uso.',
        )
      }

      return tx.publishedStory.upsert({
        where: {
          workspaceId_storyId: {
            workspaceId,
            storyId,
          },
        },
        create: {
          workspaceId,
          storyId,
          slug: story.slug,
          title: story.title,
          description:
            story.description,
          themeKey: story.themeKey,
        },
        update: {
          slug: story.slug,
          title: story.title,
          description:
            story.description,
          themeKey: story.themeKey,
        },
      })
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  )
}

export async function unpublishStory({
  workspaceId,
  storyId,
}: UnpublishStoryInput) {
  const result =
    await db.publishedStory.deleteMany({
      where: {
        workspaceId,
        storyId,
      },
    })

  return {
    unpublished:
      result.count > 0,
  }
}

export async function unpublishChapter({
  workspaceId,
  storyId,
  chapterId,
}: UnpublishChapterInput) {
  const result =
    await db.publishedChapter.deleteMany({
      where: {
        workspaceId,
        storyId,
        chapterId,
      },
    })

  return {
    unpublished:
      result.count > 0,
  }
}
