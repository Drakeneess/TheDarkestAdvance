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
  actorUserId?: string | null
}

export type UnpublishStoryInput =
  PublishStoryInput

export type UnpublishChapterInput = {
  workspaceId: string
  storyId: string
  chapterId: string
  actorUserId?: string | null
}

export async function publishStory({
  workspaceId,
  storyId,
  actorUserId = null,
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

      const profile =
        story.profile as Prisma.InputJsonValue

      const assets =
        story.assets as Prisma.InputJsonValue

      const visuals =
        story.visuals as Prisma.InputJsonValue

      const layout =
        story.layout as Prisma.InputJsonValue

      const publishedStory =
        await tx.publishedStory.upsert({
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
            profile,
            assets,
            visuals,
            layout,
          },
          update: {
            slug: story.slug,
            title: story.title,
            description:
              story.description,
            themeKey: story.themeKey,
            profile,
            assets,
            visuals,
            layout,
          },
        })

      await tx.publicationAuditEvent.create({
        data: {
          workspaceId,
          action: 'story.publish',
          actorUserId,
          storyId,
        },
      })

      return publishedStory
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
  actorUserId = null,
}: UnpublishStoryInput) {
  return db.$transaction(
    async (tx) => {
      const publishedStory =
        await tx.publishedStory.findUnique({
          where: {
            workspaceId_storyId: {
              workspaceId,
              storyId,
            },
          },
          select: {
            storyId: true,
            chapters: {
              select: {
                chapterId: true,
                sourceVersionId: true,
              },
            },
          },
        })

      if (!publishedStory) {
        return {
          unpublished: false,
        }
      }

      await tx.publishedStory.delete({
        where: {
          workspaceId_storyId: {
            workspaceId,
            storyId,
          },
        },
      })

      await tx.publicationAuditEvent.create({
        data: {
          workspaceId,
          action: 'story.unpublish',
          actorUserId,
          storyId,
        },
      })

      if (
        publishedStory.chapters.length >
          0
      ) {
        await tx.publicationAuditEvent.createMany({
          data:
            publishedStory.chapters.map(
              (chapter) => ({
                workspaceId,
                action:
                  'chapter.unpublish',
                actorUserId,
                storyId,
                chapterId:
                  chapter.chapterId,
                sourceVersionId:
                  chapter.sourceVersionId,
              }),
            ),
        })
      }

      return {
        unpublished: true,
      }
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  )
}

export async function unpublishChapter({
  workspaceId,
  storyId,
  chapterId,
  actorUserId = null,
}: UnpublishChapterInput) {
  return db.$transaction(
    async (tx) => {
      const publishedChapter =
        await tx.publishedChapter.findUnique({
          where: {
            workspaceId_storyId_chapterId: {
              workspaceId,
              storyId,
              chapterId,
            },
          },
          select: {
            sourceVersionId: true,
          },
        })

      if (!publishedChapter) {
        return {
          unpublished: false,
        }
      }

      await tx.publishedChapter.delete({
        where: {
          workspaceId_storyId_chapterId: {
            workspaceId,
            storyId,
            chapterId,
          },
        },
      })

      await tx.publicationAuditEvent.create({
        data: {
          workspaceId,
          action: 'chapter.unpublish',
          actorUserId,
          storyId,
          chapterId,
          sourceVersionId:
            publishedChapter
              .sourceVersionId,
        },
      })

      return {
        unpublished: true,
      }
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  )
}
