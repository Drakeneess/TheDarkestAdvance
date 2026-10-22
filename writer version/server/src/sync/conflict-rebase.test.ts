import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const TEST_USER_ID =
  'conflict-rebase-test-user'

const TEST_TOKEN =
  'conflict-rebase-test-token-0000000000000000'

const TEST_WORKSPACE_ID =
  'conflict-rebase-test-workspace'

const TEST_ENTITY_ID =
  'story-conflict-rebase'

const ALLOWED_ORIGIN =
  'http://localhost:5173'

function exchangeBody(
  deviceId: string,
  mutations: unknown[],
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

function storyPayload(
  title: string,
  revision: number,
) {
  const now =
    new Date().toISOString()

  return {
    id:
      TEST_ENTITY_ID,
    slug:
      'conflict-rebase',
    themeKey:
      'codex',
    title,
    description:
      'E4 conflict rebase integration test',
    createdAt: now,
    updatedAt: now,
    revision,
    deletedAt: null,
  }
}

function mutation(
  mutationId: string,
  title: string,
  revision: number,
  baseServerVersion:
    | string
    | null,
) {
  return {
    mutationId,
    entityType: 'story',
    entityId:
      TEST_ENTITY_ID,
    clientRevision:
      revision,
    baseServerVersion,
    payload:
      storyPayload(
        title,
        revision,
      ),
  }
}

if (!TEST_DATABASE_URL) {
  test(
    'sync conflict rebase integration',
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
  } = await import('../app')

  const {
    db,
  } = await import('../db')

  test(
    'sync conflict rebase integration',
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

      await db.syncWorkspaceAccess.create({
        data: {
          workspaceId:
            TEST_WORKSPACE_ID,
          userId:
            TEST_USER_ID,
        },
      })

      const app =
        await createApp()

      t.after(
        async () => {
          await app.close()
        },
      )

      const headers = {
        authorization:
          `Bearer ${TEST_TOKEN}`,
      }

      const initialResponse =
        await app.inject({
          method: 'POST',
          url:
            '/api/sync/exchange',
          headers,
          payload:
            exchangeBody(
              'device-local',
              [
                mutation(
                  'mutation-conflict-initial',
                  'Base local',
                  1,
                  null,
                ),
              ],
            ),
        })

      assert.equal(
        initialResponse.statusCode,
        200,
      )

      const initialAck =
        initialResponse.json()
          .acknowledgements[0] as {
            status: string
            serverVersion: string
          }

      assert.equal(
        initialAck.status,
        'applied',
      )

      const baseServerVersion =
        initialAck.serverVersion

      const remoteResponse =
        await app.inject({
          method: 'POST',
          url:
            '/api/sync/exchange',
          headers,
          payload:
            exchangeBody(
              'device-remote',
              [
                mutation(
                  'mutation-conflict-remote',
                  'Cambio remoto',
                  2,
                  baseServerVersion,
                ),
              ],
            ),
        })

      const remoteAck =
        remoteResponse.json()
          .acknowledgements[0] as {
            status: string
            serverVersion: string
          }

      assert.equal(
        remoteAck.status,
        'applied',
      )

      const remoteServerVersion =
        remoteAck.serverVersion

      const staleResponse =
        await app.inject({
          method: 'POST',
          url:
            '/api/sync/exchange',
          headers,
          payload:
            exchangeBody(
              'device-local',
              [
                mutation(
                  'mutation-conflict-stale',
                  'Cambio local',
                  2,
                  baseServerVersion,
                ),
              ],
            ),
        })

      const conflictAck =
        staleResponse.json()
          .acknowledgements[0] as {
            status: string
            serverRecord: {
              serverVersion: string
              payload: {
                title: string
              }
            }
          }

      assert.equal(
        conflictAck.status,
        'conflict',
      )

      assert.equal(
        conflictAck
          .serverRecord
          .serverVersion,
        remoteServerVersion,
      )

      assert.equal(
        conflictAck
          .serverRecord
          .payload
          .title,
        'Cambio remoto',
      )

      const rebasedResponse =
        await app.inject({
          method: 'POST',
          url:
            '/api/sync/exchange',
          headers,
          payload:
            exchangeBody(
              'device-local',
              [
                mutation(
                  'mutation-conflict-rebased',
                  'Cambio local',
                  2,
                  remoteServerVersion,
                ),
              ],
            ),
        })

      const rebasedAck =
        rebasedResponse.json()
          .acknowledgements[0] as {
            status: string
            serverVersion: string
          }

      assert.equal(
        rebasedAck.status,
        'applied',
      )

      assert.notEqual(
        rebasedAck.serverVersion,
        remoteServerVersion,
      )

      const persisted =
        await db.syncEntity.findUnique({
          where: {
            workspaceId_entityType_entityId: {
              workspaceId:
                TEST_WORKSPACE_ID,
              entityType:
                'story',
              entityId:
                TEST_ENTITY_ID,
            },
          },
        })

      const payload =
        persisted?.payload as
          | {
              title?: string
            }
          | null

      assert.equal(
        payload?.title,
        'Cambio local',
      )
    },
  )
}
