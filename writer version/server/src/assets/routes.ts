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
  STORY_ASSET_CONTENT_TYPES,
  STORY_ASSET_MAX_BYTES,
  isStoryAssetContentType,
  openStoryAsset,
  storeStoryAsset,
} from './story-asset-storage'

const uploadParamsSchema =
  z.object({
    storyId:
      z.string().min(1),

    kind:
      z.enum([
        'cover',
        'hero',
        'logo',
      ]),
  })

const uploadQuerySchema =
  z.object({
    workspaceId:
      z.string().min(1),
  })

const publicAssetParamsSchema =
  z.object({
    assetId:
      z.string().min(1),
  })

type StoryAssetRoutesOptions = {
  authenticateWriter:
    preHandlerAsyncHookHandler
}

function readForwardedHeader(
  value:
    | string
    | string[]
    | undefined,
) {
  const raw =
    Array.isArray(value)
      ? value[0]
      : value

  return raw
    ?.split(',')[0]
    ?.trim() || null
}

function getPublicAssetBaseUrl(
  request: FastifyRequest,
) {
  const configured =
    process.env
      .STORY_ASSET_PUBLIC_BASE_URL
      ?.trim()

  if (configured) {
    return configured
      .replace(/\/+$/, '')
  }

  if (
    process.env.NODE_ENV ===
    'production'
  ) {
    return null
  }

  const forwardedProtocol =
    readForwardedHeader(
      request.headers[
        'x-forwarded-proto'
      ],
    )

  const protocol =
    forwardedProtocol === 'https' ||
    forwardedProtocol === 'http'
      ? forwardedProtocol
      : request.protocol

  const forwardedHost =
    readForwardedHeader(
      request.headers[
        'x-forwarded-host'
      ],
    )

  const host =
    forwardedHost ||
    request.headers.host

  if (!host) {
    return null
  }

  return (
    `${protocol}://${host}` +
    '/api/public/assets/stories'
  )
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
      userId:
        principal.userId,
    })

  if (!authorized) {
    reply.status(403).send({
      error:
        'WORKSPACE_FORBIDDEN',
    })

    return false
  }

  return true
}

function sendStorageError(
  error: unknown,
  reply: FastifyReply,
) {
  if (!(error instanceof Error)) {
    throw error
  }

  if (
    error.message ===
      'INVALID_STORY_ASSET_SIZE'
  ) {
    return reply
      .status(413)
      .send({
        error:
          'STORY_ASSET_TOO_LARGE',
      })
  }

  if (
    error.message ===
      'INVALID_STORY_ASSET_CONTENT'
  ) {
    return reply
      .status(415)
      .send({
        error:
          'STORY_ASSET_CONTENT_MISMATCH',
      })
  }

  throw error
}

export async function storyAssetRoutes(
  app: FastifyInstance,
  options: StoryAssetRoutesOptions,
) {
  app.addContentTypeParser(
    [
      ...STORY_ASSET_CONTENT_TYPES,
    ],
    {
      parseAs: 'buffer',
      bodyLimit:
        STORY_ASSET_MAX_BYTES,
    },
    (
      _request,
      body,
      done,
    ) => {
      done(
        null,
        body,
      )
    },
  )

  app.post(
    '/api/assets/stories/:storyId/:kind',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (request, reply) => {
      const params =
        uploadParamsSchema.safeParse(
          request.params,
        )

      const query =
        uploadQuerySchema.safeParse(
          request.query,
        )

      if (
        !params.success ||
        !query.success
      ) {
        return reply
          .status(400)
          .send({
            error:
              'INVALID_STORY_ASSET_REQUEST',
          })
      }

      if (
        !await authorizeWorkspace(
          request,
          reply,
          query.data.workspaceId,
        )
      ) {
        return
      }

      const rawContentType =
        request.headers[
          'content-type'
        ]
          ?.split(';')[0]
          ?.trim()

      if (
        !isStoryAssetContentType(
          rawContentType,
        )
      ) {
        return reply
          .status(415)
          .send({
            error:
              'STORY_ASSET_TYPE_NOT_SUPPORTED',
          })
      }

      if (!Buffer.isBuffer(request.body)) {
        return reply
          .status(400)
          .send({
            error:
              'STORY_ASSET_BODY_REQUIRED',
          })
      }

      let asset

      try {
        asset =
          await storeStoryAsset(
            request.body,
            rawContentType,
          )
      } catch (error) {
        return sendStorageError(
          error,
          reply,
        )
      }

      const baseUrl =
        getPublicAssetBaseUrl(
          request,
        )

      if (!baseUrl) {
        return reply
          .status(503)
          .send({
            error:
              'STORY_ASSET_PUBLIC_URL_NOT_CONFIGURED',
            message:
              'Configura STORY_ASSET_PUBLIC_BASE_URL antes de subir assets en producción.',
          })
      }

      return reply
        .status(201)
        .send({
          asset: {
            kind:
              params.data.kind,
            url:
              `${baseUrl}/${asset.assetId}`,
            contentType:
              asset.contentType,
            size:
              asset.size,
          },
        })
    },
  )

  app.get(
    '/api/public/assets/stories/:assetId',
    async (request, reply) => {
      const params =
        publicAssetParamsSchema.safeParse(
          request.params,
        )

      if (!params.success) {
        return reply
          .status(404)
          .send({
            error:
              'STORY_ASSET_NOT_FOUND',
          })
      }

      let asset

      try {
        asset =
          await openStoryAsset(
            params.data.assetId,
          )
      } catch (error) {
        if (
          error instanceof Error &&
          error.message ===
            'INVALID_STORY_ASSET_ID'
        ) {
          return reply
            .status(404)
            .send({
              error:
                'STORY_ASSET_NOT_FOUND',
            })
        }

        throw error
      }

      if (!asset) {
        return reply
          .status(404)
          .send({
            error:
              'STORY_ASSET_NOT_FOUND',
          })
      }

      return reply
        .header(
          'Cache-Control',
          'public, max-age=31536000, immutable',
        )
        .header(
          'X-Content-Type-Options',
          'nosniff',
        )
        .header(
          'Content-Length',
          String(asset.size),
        )
        .type(
          asset.contentType,
        )
        .send(
          asset.stream,
        )
    },
  )
}
