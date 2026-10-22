import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const WORKSPACE_ID =
  'publishing-routes-test'

const USER_ID =
  'publishing-routes-user'

const TOKEN =
  'publishing-routes-token-00000000000000000000'

const STORY_ID = 'story-routes'
const CHAPTER_ID = 'chapter-routes'
const VERSION_ID = 'version-routes'

function now() {
  return new Date().toISOString()
}

if (!TEST_DATABASE_URL) {
  test(
    'private publishing API integration',
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
      [USER_ID]: TOKEN,
    })

  process.env.WRITER_CORS_ORIGINS =
    'http://localhost:5173'

  const {
    db,
  } = await import('../db')

  const {
    createApp,
  } = await import('../app')

  async function clearWorkspace() {
    await db.publishedChapter.deleteMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
    })

    await db.publishedStory.deleteMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
    })

    await db.syncWorkspaceAccess.deleteMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
    })

    await db.syncEntity.deleteMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
    })
  }

  async function seedSource() {
    const timestamp = now()

    await db.syncEntity.createMany({
      data: [
        {
          workspaceId: WORKSPACE_ID,
          entityType: 'story',
          entityId: STORY_ID,
          serverVersion: 10n,
          payload: {
            id: STORY_ID,
            slug: 'routes-story',
            title: 'Routes Story',
            description: 'Public',
            themeKey: 'codex',
            createdAt: timestamp,
            updatedAt: timestamp,
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
        {
          workspaceId: WORKSPACE_ID,
          entityType: 'chapter',
          entityId: CHAPTER_ID,
          serverVersion: 11n,
          payload: {
            id: CHAPTER_ID,
            storyId: STORY_ID,
            slug: 'routes-chapter',
            title: 'Routes Chapter',
            order: 1,
            currentVersionId:
              VERSION_ID,
            createdAt: timestamp,
            updatedAt: timestamp,
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
        {
          workspaceId: WORKSPACE_ID,
          entityType:
            'chapterVersion',
          entityId: VERSION_ID,
          serverVersion: 12n,
          payload: {
            id: VERSION_ID,
            chapterId: CHAPTER_ID,
            parentVersionId: null,
            label: 'v1',
            content: '# Routes content',
            createdAt: timestamp,
            updatedAt: timestamp,
            deviceId: 'routes-device',
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
      ],
    })
  }

  test(
    'private publishing API integration',
    async (t) => {
      await clearWorkspace()
      await seedSource()

      const app = await createApp()

      t.after(async () => {
        await app.close()
        await clearWorkspace()
      })

      const authHeaders = {
        authorization:
          `Bearer ${TOKEN}`,
      }

      const statusUrl =
        '/api/publishing/chapters/status' +
        `?workspaceId=${WORKSPACE_ID}` +
        `&storyId=${STORY_ID}` +
        `&chapterId=${CHAPTER_ID}`

      await t.test(
        'exige autenticación',
        async () => {
          const response =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/stories/publish',
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
              },
            })

          assert.equal(
            response.statusCode,
            401,
          )

          const statusResponse =
            await app.inject({
              method: 'GET',
              url: statusUrl,
            })

          assert.equal(
            statusResponse.statusCode,
            401,
          )
        },
      )

      await t.test(
        'exige grant del workspace',
        async () => {
          const response =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/stories/publish',
              headers: authHeaders,
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
              },
            })

          assert.equal(
            response.statusCode,
            403,
          )

          const statusResponse =
            await app.inject({
              method: 'GET',
              url: statusUrl,
              headers: authHeaders,
            })

          assert.equal(
            statusResponse.statusCode,
            403,
          )
        },
      )

      await db.syncWorkspaceAccess.create({
        data: {
          workspaceId: WORKSPACE_ID,
          userId: USER_ID,
        },
      })

      await t.test(
        'informa estado no publicado',
        async () => {
          const response =
            await app.inject({
              method: 'GET',
              url: statusUrl,
              headers: authHeaders,
            })

          assert.equal(
            response.statusCode,
            200,
          )

          assert.deepEqual(
            response.json(),
            {
              published: false,
              chapter: null,
            },
          )
        },
      )

      await t.test(
        'publica historia y capítulo desde comandos editoriales',
        async () => {
          const storyResponse =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/stories/publish',
              headers: authHeaders,
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
              },
            })

          assert.equal(
            storyResponse.statusCode,
            200,
          )

          const chapterResponse =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/chapters/publish',
              headers: authHeaders,
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
                chapterId: CHAPTER_ID,
                sourceVersionId:
                  VERSION_ID,
              },
            })

          assert.equal(
            chapterResponse.statusCode,
            200,
          )

          const body =
            chapterResponse.json() as {
              chapter: {
                content: string
              }
            }

          assert.equal(
            body.chapter.content,
            '# Routes content',
          )

          const statusResponse =
            await app.inject({
              method: 'GET',
              url: statusUrl,
              headers: authHeaders,
            })

          const statusBody =
            statusResponse.json() as {
              published: boolean
              chapter: {
                sourceVersionId: string
                publishedAt: string
                updatedAt: string
              } | null
            }

          assert.equal(
            statusResponse.statusCode,
            200,
          )

          assert.equal(
            statusBody.published,
            true,
          )

          assert.equal(
            statusBody.chapter
              ?.sourceVersionId,
            VERSION_ID,
          )

          assert.equal(
            typeof statusBody.chapter
              ?.publishedAt,
            'string',
          )

          assert.equal(
            typeof statusBody.chapter
              ?.updatedAt,
            'string',
          )
        },
      )

      await t.test(
        'expone error explícito de versión inválida',
        async () => {
          const response =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/chapters/publish',
              headers: authHeaders,
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
                chapterId: CHAPTER_ID,
                sourceVersionId:
                  'missing-version',
              },
            })

          assert.equal(
            response.statusCode,
            404,
          )

          assert.equal(
            response.json().error,
            'VERSION_NOT_FOUND',
          )
        },
      )

      await t.test(
        'despublica capítulo e historia',
        async () => {
          const chapterResponse =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/chapters/unpublish',
              headers: authHeaders,
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
                chapterId: CHAPTER_ID,
              },
            })

          assert.deepEqual(
            chapterResponse.json(),
            { unpublished: true },
          )

          const unpublishedStatus =
            await app.inject({
              method: 'GET',
              url: statusUrl,
              headers: authHeaders,
            })

          assert.deepEqual(
            unpublishedStatus.json(),
            {
              published: false,
              chapter: null,
            },
          )

          await app.inject({
            method: 'POST',
            url:
              '/api/publishing/chapters/publish',
            headers: authHeaders,
            payload: {
              workspaceId:
                WORKSPACE_ID,
              storyId: STORY_ID,
              chapterId: CHAPTER_ID,
              sourceVersionId:
                VERSION_ID,
            },
          })

          const storyResponse =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/stories/unpublish',
              headers: authHeaders,
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
              },
            })

          assert.deepEqual(
            storyResponse.json(),
            { unpublished: true },
          )

          assert.equal(
            await db.publishedChapter.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
              },
            }),
            0,
          )
        },
      )
    },
  )
}
