import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PublishingError,
} from './errors'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const WORKSPACE_ID =
  'publishing-slug-policy-test'

const STORY_ID =
  'slug-policy-story'

const CHAPTER_ID =
  'slug-policy-chapter'

const VERSION_ID =
  'slug-policy-version'

const STORY_SLUG =
  'e2-stable-story-slug'

const CHAPTER_SLUG =
  'e2-stable-chapter-slug'

function now() {
  return new Date().toISOString()
}

if (!TEST_DATABASE_URL) {
  test(
    'publishing slug policy integration',
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
            title: 'Stable Story',
            description:
              'Slug policy fixture',
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
            title: 'Stable Chapter',
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
          workspaceId:
            WORKSPACE_ID,
          entityType:
            'chapterVersion',
          entityId: VERSION_ID,
          serverVersion: 3n,
          payload: {
            id: VERSION_ID,
            chapterId: CHAPTER_ID,
            parentVersionId: null,
            label: 'Publishable',
            content:
              '# Stable content',
            createdAt: timestamp,
            updatedAt: timestamp,
            deviceId:
              'slug-policy-test-device',
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
      ],
    })
  }

  const publishInput = {
    workspaceId:
      WORKSPACE_ID,
    storyId:
      STORY_ID,
    chapterId:
      CHAPTER_ID,
    sourceVersionId:
      VERSION_ID,
  }

  test(
    'publishing slug policy integration',
    async (t) => {
      t.after(async () => {
        await clearWorkspace()
        await db.$disconnect()
      })

      await t.test(
        'rechaza un slug de historia ocupado por otra historia',
        async () => {
          await clearWorkspace()
          await seedSource()

          await db.publishedStory.create({
            data: {
              workspaceId:
                WORKSPACE_ID,
              storyId:
                'slug-owner-story',
              slug: STORY_SLUG,
              title: 'Slug Owner',
              description:
                'Existing public owner',
              themeKey: 'codex',
            },
          })

          await assert.rejects(
            publishChapterVersion(
              publishInput,
            ),
            (error: unknown) =>
              error instanceof
                PublishingError &&
              error.code ===
                'STORY_SLUG_CONFLICT' &&
              error.message ===
                'El slug público de la historia ya está en uso.',
          )
        },
      )

      await t.test(
        'rechaza un slug de capítulo ocupado dentro de la historia',
        async () => {
          await clearWorkspace()
          await seedSource()

          await publishChapterVersion(
            publishInput,
          )

          const chapterRecord =
            await db.syncEntity.findUniqueOrThrow({
              where: {
                workspaceId_entityType_entityId: {
                  workspaceId:
                    WORKSPACE_ID,
                  entityType:
                    'chapter',
                  entityId:
                    CHAPTER_ID,
                },
              },
            })

          const occupiedSlug =
            'e2-occupied-chapter-slug'

          await db.publishedChapter.create({
            data: {
              workspaceId:
                WORKSPACE_ID,
              storyId:
                STORY_ID,
              chapterId:
                'slug-owner-chapter',
              sourceVersionId:
                'slug-owner-version',
              slug: occupiedSlug,
              title: 'Slug Owner Chapter',
              order: 2,
              content:
                '# Existing published chapter',
            },
          })

          await db.syncEntity.update({
            where: {
              workspaceId_entityType_entityId: {
                workspaceId:
                  WORKSPACE_ID,
                entityType:
                  'chapter',
                entityId:
                  CHAPTER_ID,
              },
            },
            data: {
              payload: {
                ...(chapterRecord.payload as Record<string, unknown>),
                slug:
                  occupiedSlug,
              },
            },
          })

          await assert.rejects(
            publishChapterVersion(
              publishInput,
            ),
            (error: unknown) =>
              error instanceof
                PublishingError &&
              error.code ===
                'CHAPTER_SLUG_CONFLICT' &&
              error.message ===
                'El slug público del capítulo ya está en uso dentro de la historia.',
          )
        },
      )
    },
  )
}
