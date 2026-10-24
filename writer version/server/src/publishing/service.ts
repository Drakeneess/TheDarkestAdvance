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
  publishableChapterSchema,
  publishableStorySchema,
  publishableVersionSchema,
} from './schemas'

export type PublishChapterVersionInput = {
  workspaceId: string
  storyId: string
  chapterId: string
  sourceVersionId: string
  actorUserId?: string | null
}

export async function publishChapterVersion({
  workspaceId,
  storyId,
  chapterId,
  sourceVersionId,
  actorUserId = null,
}: PublishChapterVersionInput) {
  return db.$transaction(
    async (tx) => {
      const [
        storyRecord,
        chapterRecord,
        versionRecord,
      ] = await Promise.all([
        tx.syncEntity.findUnique({
          where: {
            workspaceId_entityType_entityId: {
              workspaceId,
              entityType: 'story',
              entityId: storyId,
            },
          },
        }),
        tx.syncEntity.findUnique({
          where: {
            workspaceId_entityType_entityId: {
              workspaceId,
              entityType: 'chapter',
              entityId: chapterId,
            },
          },
        }),
        tx.syncEntity.findUnique({
          where: {
            workspaceId_entityType_entityId: {
              workspaceId,
              entityType:
                'chapterVersion',
              entityId:
                sourceVersionId,
            },
          },
        }),
      ])

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

      const storyParsed =
        publishableStorySchema.safeParse(
          storyRecord.payload,
        )

      if (!storyParsed.success) {
        throw new PublishingError(
          'STORY_INVALID',
          'La historia no contiene metadata publicable válida.',
        )
      }

      if (!chapterRecord) {
        throw new PublishingError(
          'CHAPTER_NOT_FOUND',
          'El capítulo sincronizado no existe.',
        )
      }

      if (chapterRecord.deletedAt) {
        throw new PublishingError(
          'CHAPTER_DELETED',
          'No se puede publicar un capítulo eliminado.',
        )
      }

      const chapterParsed =
        publishableChapterSchema.safeParse(
          chapterRecord.payload,
        )

      if (!chapterParsed.success) {
        throw new PublishingError(
          'CHAPTER_INVALID',
          'El capítulo no contiene metadata publicable válida.',
        )
      }

      if (
        chapterParsed.data.storyId !==
        storyId
      ) {
        throw new PublishingError(
          'CHAPTER_STORY_MISMATCH',
          'El capítulo no pertenece a la historia solicitada.',
        )
      }

      if (!versionRecord) {
        throw new PublishingError(
          'VERSION_NOT_FOUND',
          'La versión sincronizada no existe.',
        )
      }

      if (versionRecord.deletedAt) {
        throw new PublishingError(
          'VERSION_DELETED',
          'No se puede publicar una versión eliminada.',
        )
      }

      const versionParsed =
        publishableVersionSchema.safeParse(
          versionRecord.payload,
        )

      if (!versionParsed.success) {
        throw new PublishingError(
          'VERSION_INVALID',
          'La versión no contiene un snapshot publicable válido.',
        )
      }

      if (
        versionParsed.data.chapterId !==
        chapterId
      ) {
        throw new PublishingError(
          'VERSION_CHAPTER_MISMATCH',
          'La versión no pertenece al capítulo solicitado.',
        )
      }

      const story = storyParsed.data
      const chapter = chapterParsed.data
      const version = versionParsed.data

      const storySlugOwner =
        await tx.publishedStory.findUnique({
          where: {
            slug: story.slug,
          },
        })

      if (
        storySlugOwner &&
        (
          storySlugOwner.workspaceId !==
            workspaceId ||
          storySlugOwner.storyId !==
            storyId
        )
      ) {
        throw new PublishingError(
          'STORY_SLUG_CONFLICT',
          'El slug público de la historia ya está en uso.',
        )
      }

      const chapterSlugOwner =
        await tx.publishedChapter.findUnique({
          where: {
            workspaceId_storyId_slug: {
              workspaceId,
              storyId,
              slug: chapter.slug,
            },
          },
        })

      if (
        chapterSlugOwner &&
        chapterSlugOwner.chapterId !==
          chapterId
      ) {
        throw new PublishingError(
          'CHAPTER_SLUG_CONFLICT',
          'El slug público del capítulo ya está en uso dentro de la historia.',
        )
      }

      const profile =
        story.profile as Prisma.InputJsonValue

      const assets =
        story.assets as Prisma.InputJsonValue

      const visuals =
        story.visuals as Prisma.InputJsonValue

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
            themeKey:
              story.themeKey,
            profile,
            assets,
            visuals,
          },
          update: {
            slug: story.slug,
            title: story.title,
            description:
              story.description,
            themeKey:
              story.themeKey,
            profile,
            assets,
            visuals,
          },
        })

      const publishedChapter =
        await tx.publishedChapter.upsert({
          where: {
            workspaceId_storyId_chapterId: {
              workspaceId,
              storyId,
              chapterId,
            },
          },
          create: {
            workspaceId,
            storyId,
            chapterId,
            sourceVersionId,
            slug: chapter.slug,
            title: chapter.title,
            order: chapter.order,
            content: version.content,
          },
          update: {
            sourceVersionId,
            slug: chapter.slug,
            title: chapter.title,
            order: chapter.order,
            content: version.content,
          },
        })

      await tx.publicationAuditEvent.create({
        data: {
          workspaceId,
          action: 'chapter.publish',
          actorUserId,
          storyId,
          chapterId,
          sourceVersionId,
        },
      })

      return {
        story: publishedStory,
        chapter: publishedChapter,
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
