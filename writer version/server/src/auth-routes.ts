import type {
  FastifyInstance,
} from 'fastify'
import {
  z,
} from 'zod'

import {
  createWriterPasswordLogin,
  WriterPasswordAuthConfigurationError,
} from './password-auth'

const loginBodySchema =
  z.object({
    username:
      z.string()
        .trim()
        .min(1)
        .max(100),

    password:
      z.string()
        .min(1)
        .max(1024),
  })
  .strict()

export async function authRoutes(
  app: FastifyInstance,
) {
  const loginWriter =
    createWriterPasswordLogin()

  app.post(
    '/api/auth/login',
    async (
      request,
      reply,
    ) => {
      const parsed =
        loginBodySchema.safeParse(
          request.body,
        )

      if (!parsed.success) {
        return reply
          .status(400)
          .send({
            error:
              'INVALID_LOGIN_REQUEST',
          })
      }

      try {
        const result =
          loginWriter(
            parsed.data.username,
            parsed.data.password,
          )

        if (!result) {
          return reply
            .header(
              'WWW-Authenticate',
              'Bearer',
            )
            .status(401)
            .send({
              error:
                'INVALID_CREDENTIALS',
            })
        }

        return {
          userId:
            result.userId,
          token:
            result.token,
        }
      } catch (error) {
        if (
          error instanceof
          WriterPasswordAuthConfigurationError
        ) {
          request.log.error(
            {
              err: error,
            },
            'Writer password login is not configured correctly',
          )

          return reply
            .status(503)
            .send({
              error:
                'LOGIN_NOT_CONFIGURED',
            })
        }

        throw error
      }
    },
  )
}
