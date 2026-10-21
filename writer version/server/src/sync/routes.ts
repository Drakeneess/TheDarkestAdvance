import type {
  FastifyInstance,
  preHandlerAsyncHookHandler,
} from 'fastify'

import {
  applyMutation,
} from './apply-mutation'

import {
  canAccessWorkspace,
} from './authorize-workspace'

import {
  pullChanges,
} from './pull-changes'

import {
  syncExchangeRequestSchema,
} from './schemas'

type SyncRoutesOptions = {
  authenticateWriter:
    preHandlerAsyncHookHandler
}

export async function syncRoutes(
  app: FastifyInstance,
  options: SyncRoutesOptions,
) {
  app.post(
    '/api/sync/exchange',
    {
      preHandler:
        options.authenticateWriter,
    },
    async (
      request,
      reply,
    ) => {
      const parsed =
        syncExchangeRequestSchema.safeParse(
          request.body,
        )

      if (!parsed.success) {
        return reply
          .status(400)
          .send({
            error:
              'INVALID_SYNC_REQUEST',

            details:
              parsed.error.flatten(),
          })
      }

      const principal =
        request.authPrincipal

      if (!principal) {
        return reply
          .status(401)
          .send({
            error:
              'AUTHENTICATION_REQUIRED',
          })
      }

      const input =
        parsed.data

      const isAuthorized =
        await canAccessWorkspace({
          workspaceId:
            input.workspaceId,

          userId:
            principal.userId,
        })

      if (!isAuthorized) {
        return reply
          .status(403)
          .send({
            error:
              'WORKSPACE_FORBIDDEN',
          })
      }

      const acknowledgements =
        []

      for (
        const mutation
        of input.mutations
      ) {
        const result =
          await applyMutation({
            workspaceId:
              input.workspaceId,

            deviceId:
              input.deviceId,

            mutation,
          })

        acknowledgements.push(
          result,
        )
      }

      const pull =
        await pullChanges({
          workspaceId:
            input.workspaceId,

          deviceId:
            input.deviceId,

          cursor:
            input.cursor,

          maxChanges:
            input.maxChanges,
        })

      return {
        protocolVersion: 1,

        acknowledgements,

        changes:
          pull.changes,

        nextCursor:
          pull.nextCursor,

        serverHead:
          pull.serverHead,

        hasMore:
          pull.hasMore,
      }
    },
  )
}
