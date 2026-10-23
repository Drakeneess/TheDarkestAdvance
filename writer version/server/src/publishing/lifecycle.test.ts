import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const WORKSPACE_ID =
  'publishing-lifecycle-e3'

const USER_ID =
  'publishing-lifecycle-user'

const TOKEN =
  'publishing-lifecycle-token-00000000000000000000'

const STORY_ID =
  'publishing-lifecycle-story'

const CHAPTER_ID =
  'publishing-lifecycle-chapter'

const VERSION_A_ID =
  'publishing-lifecycle-version-a'

const VERSION_B_ID =
  'publishing-lifecycle-version-b'

const STORY_SLUG =
  'publishing-lifecycle-e3-story'

const CHAPTER_SLUG =
  'publishing-lifecycle-e3-chapter'

function now() {
  return new Date().toISOString()
}

if (!TEST_DATABASE_URL) {
  test(
    'publishing lifecycle integration',
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
        workspaceId:
          WORKSPACE_ID,
      },
    })

    await db.publishedStory.deleteMany({
      where: {
        workspaceId:
          WORKSPACE_ID,
      },
    })

    await db.syncWorkspaceAccess.deleteMany({
      where: {
        workspaceId:
          WORKSPACE_ID,
      },
    })

    await db.syncEntity.deleteMany({
      where: {
        workspaceId:
          WORKSPACE_ID,
      },
    })
  }

  async function seedSource() {
    const timestamp = now()

    await db.syncEntity.createMany({
      data: [
        {
          workspaceId:
            WORKSPACE_ID,
          entityType: 'story',
          entityId: STORY_ID,
          serverVersion: 1n,
          payload: {
            id: STORY_ID,
            slug: STORY_SLUG,
            title:
              'Publishing Lifecycle Story',
            description:
              'E3 repeated transition fixture',
            themeKey: 'codex',
            createdAt: timestamp,
            updatedAt: timestamp,
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
        {
          workspaceId:
            WORKSPACE_ID,
          entityType: 'chapter',
          entityId: CHAPTER_ID,
          serverVersion: 2n,
          payload: {
            id: CHAPTER_ID,
            storyId: STORY_ID,
            slug: CHAPTER_SLUG,
            title:
              'Publishing Lifecycle Chapter',
            order: 1,
            currentVersionId:
              VERSION_A_ID,
            createdAt: timestamp,
            updatedAt: timestamp,
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
        {
          workspaceId:
            WORKSPACE_ID,
          entityType:
            'chapterVersion',
          entityId:
            VERSION_A_ID,
          serverVersion: 3n,
          payload: {
            id: VERSION_A_ID,
            chapterId: CHAPTER_ID,
            parentVersionId: null,
            label: 'Version A',
            content:
              '# Lifecycle version A',
            createdAt: timestamp,
            updatedAt: timestamp,
            deviceId:
              'publishing-lifecycle-device',
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
        {
          workspaceId:
            WORKSPACE_ID,
          entityType:
            'chapterVersion',
          entityId:
            VERSION_B_ID,
          serverVersion: 4n,
          payload: {
            id: VERSION_B_ID,
            chapterId: CHAPTER_ID,
            parentVersionId:
              VERSION_A_ID,
            label: 'Version B',
            content:
              '# Lifecycle version B',
            createdAt: timestamp,
            updatedAt: timestamp,
            deviceId:
              'publishing-lifecycle-device',
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
      ],
    })

    await db.syncWorkspaceAccess.create({
      data: {
        workspaceId:
          WORKSPACE_ID,
        userId:
          USER_ID,
      },
    })
  }

  test(
    'publishing lifecycle integration',
    async (t) => {
      await clearWorkspace()
      await seedSource()

      const app =
        await createApp()

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

      const publicChapterUrl =
        `/api/public/stories/${STORY_SLUG}` +
        `/chapters/${CHAPTER_SLUG}`

      async function readPrivateStatus() {
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

        return response.json() as {
          published: boolean
          chapter: {
            sourceVersionId: string
            publishedAt: string
            updatedAt: string
          } | null
        }
      }

      async function publishVersion(
        sourceVersionId: string,
      ) {
        const response =
          await app.inject({
            method: 'POST',
            url:
              '/api/publishing/chapters/publish',
            headers: authHeaders,
            payload: {
              workspaceId:
                WORKSPACE_ID,
              storyId:
                STORY_ID,
              chapterId:
                CHAPTER_ID,
              sourceVersionId,
            },
          })

        assert.equal(
          response.statusCode,
          200,
        )
      }

      async function readPublicChapter(
        expectedContent: string,
      ) {
        const response =
          await app.inject({
            method: 'GET',
            url: publicChapterUrl,
          })

        assert.equal(
          response.statusCode,
          200,
        )

        const body =
          response.json() as {
            chapter: {
              content: string
            }
          }

        assert.equal(
          body.chapter.content,
          expectedContent,
        )
      }

      await t.test(
        'parte de un estado privado y público no publicado',
        async () => {
          assert.deepEqual(
            await readPrivateStatus(),
            {
              published: false,
              chapter: null,
            },
          )

          const publicResponse =
            await app.inject({
              method: 'GET',
              url: publicChapterUrl,
            })

          assert.equal(
            publicResponse.statusCode,
            404,
          )
        },
      )

      await t.test(
        'publica versión A y alinea estado privado con proyección pública',
        async () => {
          await publishVersion(
            VERSION_A_ID,
          )

          const status =
            await readPrivateStatus()

          assert.equal(
            status.published,
            true,
          )

          assert.equal(
            status.chapter
              ?.sourceVersionId,
            VERSION_A_ID,
          )

          await readPublicChapter(
            '# Lifecycle version A',
          )
        },
      )

      await t.test(
        'reintentar la misma publicación es idempotente',
        async () => {
          await publishVersion(
            VERSION_A_ID,
          )

          const [
            storyCount,
            chapterCount,
          ] = await Promise.all([
            db.publishedStory.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                storyId:
                  STORY_ID,
              },
            }),
            db.publishedChapter.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                storyId:
                  STORY_ID,
                chapterId:
                  CHAPTER_ID,
              },
            }),
          ])

          assert.equal(
            storyCount,
            1,
          )

          assert.equal(
            chapterCount,
            1,
          )

          const status =
            await readPrivateStatus()

          assert.equal(
            status.chapter
              ?.sourceVersionId,
            VERSION_A_ID,
          )

          await readPublicChapter(
            '# Lifecycle version A',
          )
        },
      )

      await t.test(
        'republica una versión B sin duplicar la proyección',
        async () => {
          await publishVersion(
            VERSION_B_ID,
          )

          const status =
            await readPrivateStatus()

          assert.equal(
            status.published,
            true,
          )

          assert.equal(
            status.chapter
              ?.sourceVersionId,
            VERSION_B_ID,
          )

          assert.equal(
            await db.publishedChapter.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                storyId:
                  STORY_ID,
                chapterId:
                  CHAPTER_ID,
              },
            }),
            1,
          )

          await readPublicChapter(
            '# Lifecycle version B',
          )
        },
      )

      await t.test(
        'despublica y vuelve a publicar manteniendo ambos estados alineados',
        async () => {
          const unpublishResponse =
            await app.inject({
              method: 'POST',
              url:
                '/api/publishing/chapters/unpublish',
              headers: authHeaders,
              payload: {
                workspaceId:
                  WORKSPACE_ID,
                storyId:
                  STORY_ID,
                chapterId:
                  CHAPTER_ID,
              },
            })

          assert.equal(
            unpublishResponse.statusCode,
            200,
          )

          assert.deepEqual(
            unpublishResponse.json(),
            {
              unpublished: true,
            },
          )

          assert.deepEqual(
            await readPrivateStatus(),
            {
              published: false,
              chapter: null,
            },
          )

          const unpublishedPublic =
            await app.inject({
              method: 'GET',
              url: publicChapterUrl,
            })

          assert.equal(
            unpublishedPublic.statusCode,
            404,
          )

          await publishVersion(
            VERSION_B_ID,
          )

          const republishedStatus =
            await readPrivateStatus()

          assert.equal(
            republishedStatus.published,
            true,
          )

          assert.equal(
            republishedStatus.chapter
              ?.sourceVersionId,
            VERSION_B_ID,
          )

          await readPublicChapter(
            '# Lifecycle version B',
          )
        },
      )
    },
  )
}
