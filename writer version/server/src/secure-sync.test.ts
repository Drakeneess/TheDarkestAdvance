import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const TEST_USER_ID =
  'secure-sync-test-user'

const TEST_TOKEN =
  'secure-sync-test-token-00000000000000000000'

const TEST_WORKSPACE_ID =
  'secure-sync-test-workspace'

const ALLOWED_ORIGIN =
  'http://localhost:5173'

function exchangeBody(
  deviceId: string,
  mutations: unknown[] = [],
) {
  return {
    protocolVersion: 1,
    workspaceId:
      TEST_WORKSPACE_ID,
    deviceId,
    cursor: null,
    mutations,
    maxChanges: 100,
  }
}

function storyMutation(
  suffix: string,
) {
  const now =
    new Date().toISOString()

  const entityId =
    `story-${suffix}`

  return {
    mutationId:
      `mutation-${suffix}`,
    entityType: 'story',
    entityId,
    clientRevision: 1,
    baseServerVersion: null,
    payload: {
      id: entityId,
      title:
        `Story ${suffix}`,
      description:
        `Secure sync test ${suffix}`,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      deletedAt: null,
    },
  }
}

if (!TEST_DATABASE_URL) {
  test(
    'secure sync access integration',
    {
      skip:
        'TEST_DATABASE_URL no está configurada',
    },
    () => {},
  )
} else {
  process.env.DATABASE_URL =
    TEST_DATABASE_URL

  process.env.WRITER_AUTH_TOKENS =
    JSON.stringify({
      [TEST_USER_ID]:
        TEST_TOKEN,
    })

  process.env.WRITER_CORS_ORIGINS =
    ALLOWED_ORIGIN

  const {
    createApp,
  } = await import('./app')

  const {
    db,
  } = await import('./db')

  test(
    'secure sync access integration',
    async (t) => {
      await db.syncMutation.deleteMany({
        where: {
          workspaceId:
            TEST_WORKSPACE_ID,
        },
      })

      await db.syncChange.deleteMany({
        where: {
          workspaceId:
            TEST_WORKSPACE_ID,
        },
      })

      await db.syncEntity.deleteMany({
        where: {
          workspaceId:
            TEST_WORKSPACE_ID,
        },
      })

      await db.syncWorkspaceAccess.deleteMany({
        where: {
          workspaceId:
            TEST_WORKSPACE_ID,
        },
      })

      const app =
        await createApp()

      t.after(
        async () => {
          await app.close()
        },
      )

      await t.test(
        'rechaza acceso no autenticado',
        async () => {
          const response =
            await app.inject({
              method: 'POST',
              url:
                '/api/sync/exchange',
              payload:
                exchangeBody(
                  'device-anonymous',
                ),
            })

          assert.equal(
            response.statusCode,
            401,
          )

          assert.deepEqual(
            response.json(),
            {
              error:
                'AUTHENTICATION_REQUIRED',
            },
          )
        },
      )

      await t.test(
        'rechaza workspace sin grant antes de tocar sync',
        async () => {
          const response =
            await app.inject({
              method: 'POST',
              url:
                '/api/sync/exchange',
              headers: {
                authorization:
                  `Bearer ${TEST_TOKEN}`,
              },
              payload:
                exchangeBody(
                  'device-forbidden',
                ),
            })

          assert.equal(
            response.statusCode,
            403,
          )

          assert.deepEqual(
            response.json(),
            {
              error:
                'WORKSPACE_FORBIDDEN',
            },
          )

          const [
            entities,
            changes,
            mutations,
          ] =
            await Promise.all([
              db.syncEntity.count({
                where: {
                  workspaceId:
                    TEST_WORKSPACE_ID,
                },
              }),
              db.syncChange.count({
                where: {
                  workspaceId:
                    TEST_WORKSPACE_ID,
                },
              }),
              db.syncMutation.count({
                where: {
                  workspaceId:
                    TEST_WORKSPACE_ID,
                },
              }),
            ])

          assert.deepEqual(
            {
              entities,
              changes,
              mutations,
            },
            {
              entities: 0,
              changes: 0,
              mutations: 0,
            },
          )
        },
      )

      await t.test(
        'allowlist CORS refleja solo el origen autorizado',
        async () => {
          const allowed =
            await app.inject({
              method: 'OPTIONS',
              url:
                '/api/sync/exchange',
              headers: {
                origin:
                  ALLOWED_ORIGIN,
                'access-control-request-method':
                  'POST',
                'access-control-request-headers':
                  'authorization,content-type',
              },
            })

          assert.equal(
            allowed.statusCode,
            204,
          )

          assert.equal(
            allowed.headers[
              'access-control-allow-origin'
            ],
            ALLOWED_ORIGIN,
          )

          const denied =
            await app.inject({
              method: 'OPTIONS',
              url:
                '/api/sync/exchange',
              headers: {
                origin:
                  'https://unauthorized.example',
                'access-control-request-method':
                  'POST',
              },
            })

          assert.equal(
            denied.headers[
              'access-control-allow-origin'
            ],
            undefined,
          )
        },
      )

      await t.test(
        'workspace autorizado completa push y pull',
        async () => {
          await db.syncWorkspaceAccess.create({
            data: {
              workspaceId:
                TEST_WORKSPACE_ID,
              userId:
                TEST_USER_ID,
            },
          })

          const remoteMutation =
            storyMutation('remote')

          const remoteResponse =
            await app.inject({
              method: 'POST',
              url:
                '/api/sync/exchange',
              headers: {
                authorization:
                  `Bearer ${TEST_TOKEN}`,
              },
              payload: {
                ...exchangeBody(
                  'device-remote',
                ),
                mutations: [
                  remoteMutation,
                ],
              },
            })

          assert.equal(
            remoteResponse.statusCode,
            200,
          )

          const remoteJson =
            remoteResponse.json() as {
              acknowledgements:
                Array<{
                  status: string
                }>
              changes: unknown[]
            }

          assert.equal(
            remoteJson
              .acknowledgements[0]
              ?.status,
            'applied',
          )

          assert.equal(
            remoteJson.changes.length,
            0,
          )

          const localMutation =
            storyMutation('local')

          const localResponse =
            await app.inject({
              method: 'POST',
              url:
                '/api/sync/exchange',
              headers: {
                authorization:
                  `Bearer ${TEST_TOKEN}`,
              },
              payload: {
                ...exchangeBody(
                  'device-local',
                ),
                mutations: [
                  localMutation,
                ],
              },
            })

          assert.equal(
            localResponse.statusCode,
            200,
          )

          const localJson =
            localResponse.json() as {
              acknowledgements:
                Array<{
                  status: string
                  entityId: string
                }>
              changes:
                Array<{
                  entityId: string
                  sourceDeviceId: string
                }>
            }

          assert.equal(
            localJson
              .acknowledgements[0]
              ?.status,
            'applied',
          )

          assert.equal(
            localJson
              .acknowledgements[0]
              ?.entityId,
            localMutation.entityId,
          )

          assert.equal(
            localJson.changes.length,
            1,
          )

          assert.equal(
            localJson
              .changes[0]
              ?.entityId,
            remoteMutation.entityId,
          )

          assert.equal(
            localJson
              .changes[0]
              ?.sourceDeviceId,
            'device-remote',
          )
        },
      )
    },
  )
}
