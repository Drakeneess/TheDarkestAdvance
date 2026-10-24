import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const WORKSPACE_ID =
  'public-routes-test'

const STORY_ID =
  'public-story-id'

if (!TEST_DATABASE_URL) {
  test(
    'public publishing API integration',
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
      'public-test-user':
        'public-test-token-000000000000000000000000',
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

    await db.syncEntity.deleteMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
    })
  }

  test(
    'public publishing API integration',
    async (t) => {
      await clearWorkspace()

      await db.publishedStory.create({
        data: {
          workspaceId: WORKSPACE_ID,
          storyId: STORY_ID,
          slug: 'public-routes-story',
          title: 'Public Routes Story',
          description:
            'Only published projection',
          themeKey: 'codex',
          profile: {
            subtitle:
              'Public subtitle',
            authorName:
              'Public Author',
            status: 'ongoing',
            language: 'es',
            genres: [
              'Fantasy',
            ],
            tags: [
              'Psychological',
            ],
            contentRating: '16+',
          },
          assets: {
            coverImageUrl:
              'https://example.com/cover.png',
            heroImageUrl: null,
            logoImageUrl: null,
          },
          visuals: {
            accent: '#55d6ff',
            accentSoft: null,
            background: null,
            panel: null,
            displayFontKey: null,
            bodyFontKey: null,
            ornamentKey: null,
            textureKey: null,
            readerWidth: 'wide',
          },
          chapters: {
            create: {
              chapterId:
                'public-chapter-id',
              sourceVersionId:
                'private-version-id',
              slug:
                'public-chapter',
              title:
                'Public Chapter',
              order: 1,
              content:
                '# Published content',
            },
          },
        },
      })

      await db.syncEntity.create({
        data: {
          workspaceId: WORKSPACE_ID,
          entityType: 'story',
          entityId:
            'draft-only-story',
          serverVersion: 50n,
          payload: {
            id: 'draft-only-story',
            title:
              'Never publish me',
            description: 'draft',
            createdAt:
              new Date().toISOString(),
            updatedAt:
              new Date().toISOString(),
            revision: 1,
            deletedAt: null,
          },
          deletedAt: null,
        },
      })

      const app = await createApp()

      t.after(async () => {
        await clearWorkspace()
        await app.close()
      })

      await t.test(
        'lista únicamente proyecciones publicadas',
        async () => {
          const response =
            await app.inject({
              method: 'GET',
              url: '/api/public/stories',
            })

          assert.equal(
            response.statusCode,
            200,
          )

          const body =
            response.json() as {
              stories:
                Array<Record<string, unknown>>
            }

          const publicStory =
            body.stories.find(
              (story) =>
                story.slug ===
                  'public-routes-story',
            )

          assert.ok(
            publicStory,
          )

          assert.equal(
            'workspaceId' in
              publicStory,
            false,
          )

          assert.equal(
            body.stories.some(
              (story) =>
                story.slug ===
                  'draft-only-story',
            ),
            false,
          )

          assert.equal(
            JSON.stringify(body).includes(
              'Never publish me',
            ),
            false,
          )

          const profile =
            publicStory.profile as
              Record<string, unknown>

          const assets =
            publicStory.assets as
              Record<string, unknown>

          const visuals =
            publicStory.visuals as
              Record<string, unknown>

          assert.equal(
            profile.subtitle,
            'Public subtitle',
          )

          assert.deepEqual(
            profile.genres,
            ['Fantasy'],
          )

          assert.equal(
            assets.coverImageUrl,
            'https://example.com/cover.png',
          )

          assert.equal(
            visuals.accent,
            '#55d6ff',
          )

          assert.equal(
            visuals.readerWidth,
            'wide',
          )
        },
      )

      await t.test(
        'obtiene historia y catálogo de capítulos sin contenido privado',
        async () => {
          const response =
            await app.inject({
              method: 'GET',
              url:
                '/api/public/stories/public-routes-story',
            })

          assert.equal(
            response.statusCode,
            200,
          )

          const body =
            response.json() as {
              story:
                Record<string, unknown> & {
                  chapters:
                    Array<Record<string, unknown>>
                }
            }

          assert.equal(
            body.story.chapters.length,
            1,
          )

          assert.equal(
            'content' in
              body.story.chapters[0]!,
            false,
          )

          assert.equal(
            'sourceVersionId' in
              body.story.chapters[0]!,
            false,
          )

          const profile =
            body.story.profile as
              Record<string, unknown>

          assert.equal(
            profile.authorName,
            'Public Author',
          )
        },
      )

      await t.test(
        'obtiene capítulo publicado sin IDs internos',
        async () => {
          const response =
            await app.inject({
              method: 'GET',
              url:
                '/api/public/stories/public-routes-story/chapters/public-chapter',
            })

          assert.equal(
            response.statusCode,
            200,
          )

          const body =
            response.json() as {
              story: Record<string, unknown>
              chapter: Record<string, unknown>
            }

          assert.equal(
            body.chapter.content,
            '# Published content',
          )

          assert.equal(
            'sourceVersionId' in
              body.chapter,
            false,
          )

          assert.equal(
            'workspaceId' in
              body.story,
            false,
          )

          assert.equal(
            'storyId' in body.story,
            false,
          )

          const visuals =
            body.story.visuals as
              Record<string, unknown>

          assert.equal(
            visuals.readerWidth,
            'wide',
          )
        },
      )

      await t.test(
        'contenido no publicado responde 404',
        async () => {
          const storyResponse =
            await app.inject({
              method: 'GET',
              url:
                '/api/public/stories/not-published',
            })

          assert.equal(
            storyResponse.statusCode,
            404,
          )

          const chapterResponse =
            await app.inject({
              method: 'GET',
              url:
                '/api/public/stories/public-routes-story/chapters/not-published',
            })

          assert.equal(
            chapterResponse.statusCode,
            404,
          )
        },
      )
    },
  )
}
