import type {
  FastifyInstance,
} from 'fastify'

import { z } from 'zod'

import {
  db,
} from '../db'

const storyParamsSchema =
  z.object({
    storySlug: z.string().min(1),
  })

const chapterParamsSchema =
  storyParamsSchema.extend({
    chapterSlug: z.string().min(1),
  })

const publicStorySelect = {
  slug: true,
  title: true,
  description: true,
  themeKey: true,
  profile: true,
  assets: true,
  visuals: true,
  layout: true,
  publishedAt: true,
  updatedAt: true,
} as const

const publicChapterSelect = {
  slug: true,
  title: true,
  order: true,
  content: true,
  publishedAt: true,
  updatedAt: true,
} as const

export async function publicRoutes(
  app: FastifyInstance,
) {
  app.get(
    '/api/public/stories',
    async () => {
      const records =
        await db.publishedStory.findMany({
          select: {
            ...publicStorySelect,
            _count: {
              select: {
                chapters: true,
              },
            },
          },
          orderBy: [
            { title: 'asc' },
            { slug: 'asc' },
          ],
        })

      const stories =
        records.map(
          ({
            _count,
            ...story
          }) => ({
            ...story,
            chapterCount:
              _count.chapters,
          }),
        )

      return { stories }
    },
  )

  app.get(
    '/api/public/stories/:storySlug',
    async (request, reply) => {
      const parsed =
        storyParamsSchema.safeParse(
          request.params,
        )

      if (!parsed.success) {
        return reply.status(404).send({
          error: 'PUBLIC_STORY_NOT_FOUND',
        })
      }

      const story =
        await db.publishedStory.findUnique({
          where: {
            slug:
              parsed.data.storySlug,
          },
          select: {
            ...publicStorySelect,
            chapters: {
              select: {
                slug: true,
                title: true,
                order: true,
                publishedAt: true,
                updatedAt: true,
              },
              orderBy: [
                { order: 'asc' },
                { slug: 'asc' },
              ],
            },
          },
        })

      if (!story) {
        return reply.status(404).send({
          error: 'PUBLIC_STORY_NOT_FOUND',
        })
      }

      return { story }
    },
  )

  app.get(
    '/api/public/stories/:storySlug/chapters/:chapterSlug',
    async (request, reply) => {
      const parsed =
        chapterParamsSchema.safeParse(
          request.params,
        )

      if (!parsed.success) {
        return reply.status(404).send({
          error:
            'PUBLIC_CHAPTER_NOT_FOUND',
        })
      }

      const story =
        await db.publishedStory.findUnique({
          where: {
            slug:
              parsed.data.storySlug,
          },
          select: {
            workspaceId: true,
            storyId: true,
            ...publicStorySelect,
          },
        })

      if (!story) {
        return reply.status(404).send({
          error: 'PUBLIC_STORY_NOT_FOUND',
        })
      }

      const chapter =
        await db.publishedChapter.findUnique({
          where: {
            workspaceId_storyId_slug: {
              workspaceId:
                story.workspaceId,
              storyId:
                story.storyId,
              slug:
                parsed.data.chapterSlug,
            },
          },
          select:
            publicChapterSelect,
        })

      if (!chapter) {
        return reply.status(404).send({
          error:
            'PUBLIC_CHAPTER_NOT_FOUND',
        })
      }

      const {
        workspaceId: _workspaceId,
        storyId: _storyId,
        ...publicStory
      } = story

      return {
        story: publicStory,
        chapter,
      }
    },
  )
}
