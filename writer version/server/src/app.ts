import cors from '@fastify/cors'
import Fastify from 'fastify'

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

  await app.register(
    cors,
    {
      origin: true,
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
  )

  return app
}