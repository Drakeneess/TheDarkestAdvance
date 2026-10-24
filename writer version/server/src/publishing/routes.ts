import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerAsyncHookHandler,
} from 'fastify'

import { z } from 'zod'

import {
  canAccessWorkspace,
} from '../sync/authorize-workspace'

import {
  publishStory,
  unpublishChapter,
  unpublishStory,
} from './commands'

import {
  PublishingError,
} from './errors'

import {
  publishChapterVersion,
} from './service'

import {
  getChapterPublicationStatus,
  getStoryPublicationStatus,
} from './status'

const storyCommandSchema =
  z.object({
    workspaceId: z.string().min(1),
    storyId: z.string().min(1),
  })

const chapterCommandSchema =
  storyCommandSchema.extend({
    chapterId: z.string().min(1),
  })

const publishChapterSchema =
  chapterCommandSchema.extend({
    sourceVersionId:
      z.string().min(1),
  })

type PublishingRoutesOptions = {
  authenticateWriter:
    preHandlerAsyncHookHandler
}

async function authorizeWorkspace(
  request: FastifyRequest,
  reply: FastifyReply,
  workspaceId: string,
) {
  const principal =
    request.authPrincipal

  if (!principal) {
    reply.status(401).send({
      error:
        'AUTHENTICATION_REQUIRED',
    })

    return false
  }

  const authorized =
    await canAccessWorkspace({
      workspaceId,
      userId: principal.userId,
    })

  if (!authorized) {
    reply.status(403).send({
      error: 'WORKSPACE_FORBIDDEN',
    })

    return false
  }

  return true
}

function sendPublishingError(
  error: unknown,
  reply: FastifyReply,
) {
  if (!(error instanceof PublishingError)) {
    throw error
  }

  const statusCode =
    error.code.endsWith(
      '_NOT_FOUND',
    )
      ? 404
      : 409

  return reply
    .status(statusCode)
    .send({
      error: error.code,
      message: error.message,
    })
}

export async function publishingRoutes(
  app: FastifyInstance,
  options: PublishingRoutesOptions,
) {
  app.get(
    '/api/publishing/stories/status',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (request, reply) => {
      const parsed =
        storyCommandSchema.safeParse(
          request.query,
        )

      if (!parsed.success) {
        return reply.status(400).send({
          error:
            'INVALID_PUBLISHING_REQUEST',
          details:
            parsed.error.flatten(),
        })
      }

      if (
        !await authorizeWorkspace(
          request,
          reply,
          parsed.data.workspaceId,
        )
      ) {
        return
      }

      return getStoryPublicationStatus(
        parsed.data,
      )
    },
  )

  app.post(
    '/api/publishing/stories/publish',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (request, reply) => {
      const parsed =
        storyCommandSchema.safeParse(
          request.body,
        )

      if (!parsed.success) {
        return reply.status(400).send({
          error:
            'INVALID_PUBLISHING_REQUEST',
          details:
            parsed.error.flatten(),
        })
      }

      if (
        !await authorizeWorkspace(
          request,
          reply,
          parsed.data.workspaceId,
        )
      ) {
        return
      }

      try {
        const story =
          await publishStory({
            ...parsed.data,
            actorUserId:
              request.authPrincipal
                ?.userId ?? null,
          })

        return { story }
      } catch (error) {
        return sendPublishingError(
          error,
          reply,
        )
      }
    },
  )

  app.post(
    '/api/publishing/stories/unpublish',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (request, reply) => {
      const parsed =
        storyCommandSchema.safeParse(
          request.body,
        )

      if (!parsed.success) {
        return reply.status(400).send({
          error:
            'INVALID_PUBLISHING_REQUEST',
          details:
            parsed.error.flatten(),
        })
      }

      if (
        !await authorizeWorkspace(
          request,
          reply,
          parsed.data.workspaceId,
        )
      ) {
        return
      }

      return unpublishStory({
        ...parsed.data,
        actorUserId:
          request.authPrincipal
            ?.userId ?? null,
      })
    },
  )

  app.get(
    '/api/publishing/chapters/status',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (request, reply) => {
      const parsed =
        chapterCommandSchema.safeParse(
          request.query,
        )

      if (!parsed.success) {
        return reply.status(400).send({
          error:
            'INVALID_PUBLISHING_REQUEST',
          details:
            parsed.error.flatten(),
        })
      }

      if (
        !await authorizeWorkspace(
          request,
          reply,
          parsed.data.workspaceId,
        )
      ) {
        return
      }

      return getChapterPublicationStatus(
        parsed.data,
      )
    },
  )

  app.post(
    '/api/publishing/chapters/publish',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (request, reply) => {
      const parsed =
        publishChapterSchema.safeParse(
          request.body,
        )

      if (!parsed.success) {
        return reply.status(400).send({
          error:
            'INVALID_PUBLISHING_REQUEST',
          details:
            parsed.error.flatten(),
        })
      }

      if (
        !await authorizeWorkspace(
          request,
          reply,
          parsed.data.workspaceId,
        )
      ) {
        return
      }

      try {
        return await publishChapterVersion({
          ...parsed.data,
          actorUserId:
            request.authPrincipal
              ?.userId ?? null,
        })
      } catch (error) {
        return sendPublishingError(
          error,
          reply,
        )
      }
    },
  )

  app.post(
    '/api/publishing/chapters/unpublish',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (request, reply) => {
      const parsed =
        chapterCommandSchema.safeParse(
          request.body,
        )

      if (!parsed.success) {
        return reply.status(400).send({
          error:
            'INVALID_PUBLISHING_REQUEST',
          details:
            parsed.error.flatten(),
        })
      }

      if (
        !await authorizeWorkspace(
          request,
          reply,
          parsed.data.workspaceId,
        )
      ) {
        return
      }

      return unpublishChapter({
        ...parsed.data,
        actorUserId:
          request.authPrincipal
            ?.userId ?? null,
      })
    },
  )
}
