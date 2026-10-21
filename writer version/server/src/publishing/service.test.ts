import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PublishingError,
} from './errors'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const WORKSPACE_ID =
  'publishing-service-test'

const STORY_ID = 'story-1'
const CHAPTER_ID = 'chapter-1'
const VERSION_ID = 'version-1'

function now() {
  return new Date().toISOString()
}

if (!TEST_DATABASE_URL) {
  test(
    'publishing service integration',
    {
      skip:
        'TEST_DATABASE_URL no está configurada',
    },
    () => {},
  )
} else {
  process.env.DATABASE_URL =
    TEST_DATABASE_URL

  const {
    db,
  } = await import('../db')

  const {
    publishChapterVersion,
  } = await import('./service')

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

    await db.syncEntity.deleteMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
    })
  }

  async function seedActiveSource() {
    const timestamp = now()

    await db.syncEntity.createMany({
      data: [
        {
          workspaceId: WORKSPACE_ID,
          entityType: 'story',
          entityId: STORY_ID,
          serverVersion: 1n,
          payload: {
            id: STORY_ID,
            slug: 'public-story',
            title: 'Public Story',
            description: 'Description',
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
          serverVersion: 2n,
          payload: {
            id: CHAPTER_ID,
            storyId: STORY_ID,
            slug: 'chapter-one',
            title: 'Chapter One',
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
          serverVersion: 3n,
          payload: {
            id: VERSION_ID,
            chapterId: CHAPTER_ID,
            parentVersionId: null,
            label: 'Published',
            content:
              '# Immutable snapshot',
            createdAt: timestamp,
            updatedAt: timestamp,
            deviceId: 'test-device',
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
      ],
    })
  }

  test(
    'publishing service integration',
    async (t) => {
      await clearWorkspace()
      await seedActiveSource()

      t.after(async () => {
        await clearWorkspace()
        await db.$disconnect()
      })

      await t.test(
        'copia el snapshot y repetir no duplica proyecciones',
        async () => {
          const input = {
            workspaceId: WORKSPACE_ID,
            storyId: STORY_ID,
            chapterId: CHAPTER_ID,
            sourceVersionId:
              VERSION_ID,
          }

          const first =
            await publishChapterVersion(
              input,
            )

          const second =
            await publishChapterVersion(
              input,
            )

          assert.equal(
            first.chapter.content,
            '# Immutable snapshot',
          )

          assert.equal(
            second.chapter.sourceVersionId,
            VERSION_ID,
          )

          const [
            storyCount,
            chapterCount,
          ] = await Promise.all([
            db.publishedStory.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
              },
            }),
            db.publishedChapter.count({
              where: {
                workspaceId:
                  WORKSPACE_ID,
              },
            }),
          ])

          assert.equal(storyCount, 1)
          assert.equal(chapterCount, 1)
        },
      )

      await t.test(
        'la proyección no cambia cuando cambia la fuente sin republicar',
        async () => {
          const record =
            await db.syncEntity.findUniqueOrThrow({
              where: {
                workspaceId_entityType_entityId: {
                  workspaceId:
                    WORKSPACE_ID,
                  entityType:
                    'chapterVersion',
                  entityId:
                    VERSION_ID,
                },
              },
            })

          await db.syncEntity.update({
            where: {
              workspaceId_entityType_entityId: {
                workspaceId:
                  WORKSPACE_ID,
                entityType:
                  'chapterVersion',
                entityId:
                  VERSION_ID,
              },
            },
            data: {
              payload: {
                ...(record.payload as Record<string, unknown>),
                content:
                  '# Changed private source',
              },
            },
          })

          const published =
            await db.publishedChapter.findUniqueOrThrow({
              where: {
                workspaceId_storyId_chapterId: {
                  workspaceId:
                    WORKSPACE_ID,
                  storyId: STORY_ID,
                  chapterId: CHAPTER_ID,
                },
              },
            })

          assert.equal(
            published.content,
            '# Immutable snapshot',
          )
        },
      )

      await t.test(
        'rechaza una versión de otro capítulo',
        async () => {
          const timestamp = now()

          await db.syncEntity.create({
            data: {
              workspaceId: WORKSPACE_ID,
              entityType:
                'chapterVersion',
              entityId:
                'wrong-version',
              serverVersion: 4n,
              payload: {
                id: 'wrong-version',
                chapterId:
                  'another-chapter',
                content: 'wrong',
                createdAt: timestamp,
                updatedAt: timestamp,
                revision: 1,
                deletedAt: null,
              },
              deletedAt: null,
            },
          })

          await assert.rejects(
            publishChapterVersion({
              workspaceId:
                WORKSPACE_ID,
              storyId: STORY_ID,
              chapterId: CHAPTER_ID,
              sourceVersionId:
                'wrong-version',
            }),
            (error: unknown) =>
              error instanceof
                PublishingError &&
              error.code ===
                'VERSION_CHAPTER_MISMATCH',
          )
        },
      )

      await t.test(
        'rechaza una versión eliminada',
        async () => {
          await db.syncEntity.update({
            where: {
              workspaceId_entityType_entityId: {
                workspaceId:
                  WORKSPACE_ID,
                entityType:
                  'chapterVersion',
                entityId:
                  VERSION_ID,
              },
            },
            data: {
              deletedAt:
                new Date(),
            },
          })

          await assert.rejects(
            publishChapterVersion({
              workspaceId:
                WORKSPACE_ID,
              storyId: STORY_ID,
              chapterId: CHAPTER_ID,
              sourceVersionId:
                VERSION_ID,
            }),
            (error: unknown) =>
              error instanceof
                PublishingError &&
              error.code ===
                'VERSION_DELETED',
          )
        },
      )
    },
  )
}
