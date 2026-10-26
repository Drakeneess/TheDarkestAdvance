import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL

const WRITER_BASE_URL =
  process.env.E2E_WRITER_BASE_URL ??
  'http://127.0.0.1:3101'

const CODEX_BASE_URL =
  process.env.E2E_CODEX_BASE_URL ??
  'http://127.0.0.1:3100'

const WORKSPACE_ID =
  'writer-codex-h4'

const USER_ID =
  process.env.E2E_WRITER_USER_ID ??
  'writer-codex-e1-user'

const TOKEN =
  process.env.E2E_WRITER_TOKEN ??
  'writer-codex-e1-token-000000000000000000000000'

const DEVICE_ID =
  'writer-codex-h4-device'

const STORY_ID =
  'writer-codex-h4-story'

const STORY_SLUG =
  'writer-codex-h4-story'

const LAYOUT_MARKER =
  'h4-custom-layout-marker'

function now() {
  return new Date().toISOString()
}

if (!TEST_DATABASE_URL) {
  test(
    'H4 custom layout Writer -> publicación -> API -> Codex',
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

  async function clearWorkspace() {
    await db.publicationAuditEvent.deleteMany({
      where: {
        workspaceId:
          WORKSPACE_ID,
      },
    })

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

    await db.syncMutation.deleteMany({
      where: {
        workspaceId:
          WORKSPACE_ID,
      },
    })

    await db.syncChange.deleteMany({
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

    await db.syncWorkspaceAccess.deleteMany({
      where: {
        workspaceId:
          WORKSPACE_ID,
      },
    })
  }

  function authHeaders() {
    return {
      authorization:
        `Bearer ${TOKEN}`,
      'content-type':
        'application/json',
    }
  }

  async function writerJson(
    path: string,
    init: RequestInit = {},
  ) {
    const response =
      await fetch(
        `${WRITER_BASE_URL}${path}`,
        init,
      )

    let payload: unknown = null

    try {
      payload =
        await response.json()
    } catch {
      payload = null
    }

    return {
      response,
      payload,
    }
  }

  test(
    'H4 custom layout Writer -> publicación -> API -> Codex',
    async (t) => {
      await clearWorkspace()

      await db.syncWorkspaceAccess.create({
        data: {
          workspaceId:
            WORKSPACE_ID,
          userId:
            USER_ID,
        },
      })

      t.after(async () => {
        await clearWorkspace()
        await db.$disconnect()
      })

      const timestamp =
        now()

      const layoutHtml =
        `<main data-e2e-layout="${LAYOUT_MARKER}">` +
        '<h1>{{story.title}}</h1>' +
        '<p>{{story.description}}</p>' +
        '<section>{{chapters}}</section>' +
        '</main>'

      const layoutCss =
        ':root, html, body, * { box-sizing: border-box; } ' +
        'body { margin: 0; background: var(--story-background); } ' +
        '[data-e2e-layout] { color: var(--story-text); }'

      const syncResult =
        await writerJson(
          '/api/sync/exchange',
          {
            method: 'POST',
            headers:
              authHeaders(),
            body:
              JSON.stringify({
                protocolVersion: 1,
                workspaceId:
                  WORKSPACE_ID,
                deviceId:
                  DEVICE_ID,
                cursor: null,
                mutations: [
                  {
                    mutationId:
                      'h4-create-story',
                    entityType: 'story',
                    entityId: STORY_ID,
                    clientRevision: 1,
                    baseServerVersion: null,
                    payload: {
                      id: STORY_ID,
                      slug: STORY_SLUG,
                      title:
                        'Custom Layout H4 Story',
                      description:
                        'Historia temporal para validar Custom Story Layout de extremo a extremo.',
                      themeKey: 'codex',
                      profile: {
                        subtitle:
                          'Sandboxed custom layout',
                        authorName:
                          'Drakeneess',
                        status: 'ongoing',
                        language: 'es',
                        genres: [
                          'Testing',
                        ],
                        tags: [
                          'H4',
                        ],
                        contentRating: null,
                      },
                      assets: {
                        coverImageUrl: null,
                        heroImageUrl: null,
                        logoImageUrl: null,
                      },
                      visuals: {
                        accent: '#c7a76c',
                        accentSoft: '#e8d7b0',
                        background: '#090a0e',
                        panel: '#111319',
                        displayFontKey: 'serif',
                        bodyFontKey: 'sans',
                        ornamentKey: 'section',
                        textureKey: 'none',
                        readerWidth: 'standard',
                      },
                      layout: {
                        mode: 'custom',
                        html: layoutHtml,
                        css: layoutCss,
                      },
                      createdAt: timestamp,
                      updatedAt: timestamp,
                      revision: 1,
                      deletedAt: null,
                    },
                  },
                ],
              }),
          },
        )

      assert.equal(
        syncResult.response.status,
        200,
        `sync falló: ${JSON.stringify(syncResult.payload)}`,
      )

      const syncPayload =
        syncResult.payload as {
          acknowledgements: Array<{
            status: string
          }>
        }

      assert.equal(
        syncPayload.acknowledgements[0]
          ?.status,
        'applied',
      )

      const publishResult =
        await writerJson(
          '/api/publishing/stories/publish',
          {
            method: 'POST',
            headers:
              authHeaders(),
            body:
              JSON.stringify({
                workspaceId:
                  WORKSPACE_ID,
                storyId:
                  STORY_ID,
              }),
          },
        )

      assert.equal(
        publishResult.response.status,
        200,
        `publicación falló: ${JSON.stringify(publishResult.payload)}`,
      )

      const publicResult =
        await writerJson(
          `/api/public/stories/${STORY_SLUG}`,
        )

      assert.equal(
        publicResult.response.status,
        200,
      )

      const publicPayload =
        publicResult.payload as {
          story: {
            layout: {
              mode: string
              html: string
              css: string
            }
          }
        }

      assert.equal(
        publicPayload.story.layout.mode,
        'custom',
      )

      assert.match(
        publicPayload.story.layout.html,
        new RegExp(LAYOUT_MARKER),
      )

      assert.match(
        publicPayload.story.layout.css,
        /:root, html, body, \*/,
      )

      const codexResponse =
        await fetch(
          `${CODEX_BASE_URL}/stories/${STORY_SLUG}`,
          {
            headers: {
              accept: 'text/html',
            },
          },
        )

      assert.equal(
        codexResponse.status,
        200,
      )

      const codexHtml =
        await codexResponse.text()

      assert.match(
        codexHtml,
        new RegExp(LAYOUT_MARKER),
      )

      assert.match(
        codexHtml,
        /sandbox="allow-same-origin allow-top-navigation-by-user-activation"/,
      )

      assert.doesNotMatch(
        codexHtml,
        /allow-scripts/,
      )
    },
  )
}
