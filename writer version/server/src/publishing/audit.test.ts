import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const WORKSPACE_ID =
  'publishing-audit-test'

const USER_ID =
  'publishing-audit-user'

const TOKEN =
  'publishing-audit-token-00000000000000000000'

const STORY_ID =
  'publishing-audit-story'

const CHAPTER_ID =
  'publishing-audit-chapter'

const VERSION_ID =
  'publishing-audit-version'

function now() {
  return new Date().toISOString()
}

if (!TEST_DATABASE_URL) {
  test(
    'publication audit integration',
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
    await db.publicationAuditEvent.deleteMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
    })

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
          serverVersion: 100n,
          payload: {
            id: STORY_ID,
            slug:
              'publishing-audit-story',
            title:
              'Publishing Audit Story',
            description:
              'Audit trail fixture',
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
          serverVersion: 101n,
          payload: {
            id: CHAPTER_ID,
            storyId: STORY_ID,
            slug:
              'publishing-audit-chapter',
            title:
              'Publishing Audit Chapter',
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
          serverVersion: 102n,
          payload: {
            id: VERSION_ID,
            chapterId: CHAPTER_ID,
            parentVersionId: null,
            label: 'Audit snapshot',
            content:
              '# Audited content',
            createdAt: timestamp,
            updatedAt: timestamp,
            deviceId:
              'publishing-audit-device',
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
      ],
    })

    await db.syncWorkspaceAccess.create({
      data: {
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
      },
    })
  }

  test(
    'publication audit integration',
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

      await t.test(
        'registra actor y sourceVersionId al publicar y despublicar un capítulo',
        async () => {
          const publishResponse =
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
            publishResponse.statusCode,
            200,
          )

          const publishEvent =
            await db.publicationAuditEvent.findFirstOrThrow({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                action:
                  'chapter.publish',
              },
              orderBy: {
                id: 'desc',
              },
            })

          assert.equal(
            publishEvent.actorUserId,
            USER_ID,
          )

          assert.equal(
            publishEvent.storyId,
            STORY_ID,
          )

          assert.equal(
            publishEvent.chapterId,
            CHAPTER_ID,
          )

          assert.equal(
            publishEvent.sourceVersionId,
            VERSION_ID,
          )

          const unpublishResponse =
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

          assert.equal(
            unpublishResponse.statusCode,
            200,
          )

          const unpublishEvent =
            await db.publicationAuditEvent.findFirstOrThrow({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                action:
                  'chapter.unpublish',
              },
              orderBy: {
                id: 'desc',
              },
            })

          assert.equal(
            unpublishEvent.actorUserId,
            USER_ID,
          )

          assert.equal(
            unpublishEvent.sourceVersionId,
            VERSION_ID,
          )

          assert.equal(
            await db.publishedChapter.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                chapterId: CHAPTER_ID,
              },
            }),
            0,
          )
        },
      )

      await t.test(
        'audita publish/unpublish de historia y conserva versiones de capítulos eliminados por cascada',
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

          const unpublishResponse =
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

          assert.equal(
            unpublishResponse.statusCode,
            200,
          )

          const storyEvents =
            await db.publicationAuditEvent.findMany({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                action: {
                  in: [
                    'story.publish',
                    'story.unpublish',
                  ],
                },
              },
              orderBy: {
                id: 'asc',
              },
            })

          assert.deepEqual(
            storyEvents.map(
              (event) =>
                event.action,
            ),
            [
              'story.publish',
              'story.unpublish',
            ],
          )

          assert.equal(
            storyEvents.every(
              (event) =>
                event.actorUserId ===
                USER_ID,
            ),
            true,
          )

          const cascadedChapterEvent =
            await db.publicationAuditEvent.findFirstOrThrow({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                action:
                  'chapter.unpublish',
                chapterId:
                  CHAPTER_ID,
                sourceVersionId:
                  VERSION_ID,
              },
              orderBy: {
                id: 'desc',
              },
            })

          assert.equal(
            cascadedChapterEvent.actorUserId,
            USER_ID,
          )

          assert.equal(
            await db.publishedStory.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
                storyId: STORY_ID,
              },
            }),
            0,
          )
        },
      )
    },
  )
}
