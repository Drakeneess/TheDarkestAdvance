import cors from '@fastify/cors'
import Fastify from 'fastify'

import {
  createWriterAuthenticator,
} from './auth'

import {
  getWriterCorsOrigins,
} from './cors'

import {
  db,
} from './db'

import {
  syncRoutes,
} from './sync/routes'

export async function createApp() {
  const app =
    Fastify({
      logger: true,
    })

  const authenticateWriter =
    createWriterAuthenticator()

  const corsOrigins =
    getWriterCorsOrigins()

  app.decorateRequest(
    'authPrincipal',
    null,
  )

  await app.register(
    cors,
    {
      origin:
        corsOrigins,

      methods: [
        'GET',
        'HEAD',
        'POST',
      ],

      allowedHeaders: [
        'Authorization',
        'Content-Type',
      ],
    },
  )

  app.get(
    '/health',
    async () => ({
      ok: true,
      service:
        'writer-sync',
    }),
  )

  app.get(
    '/health/db',
    async () => {
      const [
        entities,
        changes,
        mutations,
      ] =
        await Promise.all([
          db.syncEntity.count(),
          db.syncChange.count(),
          db.syncMutation.count(),
        ])

      return {
        ok: true,
        database: 'connected',
        counts: {
          entities,
          changes,
          mutations,
        },
      }
    },
  )

  app.addHook(
    'onClose',
    async () => {
      await db.$disconnect()
    },
  )

  await app.register(
    syncRoutes,
    {
      authenticateWriter,
    },
  )

  return app
}
