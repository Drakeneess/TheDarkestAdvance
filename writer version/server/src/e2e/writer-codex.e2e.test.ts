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
  'writer-codex-e1'

const USER_ID =
  process.env.E2E_WRITER_USER_ID ??
  'writer-codex-e1-user'

const TOKEN =
  process.env.E2E_WRITER_TOKEN ??
  'writer-codex-e1-token-000000000000000000000000'

const DEVICE_ID =
  'writer-codex-e1-device'

const STORY_ID =
  'writer-codex-e1-story'

const CHAPTER_ID =
  'writer-codex-e1-chapter'

const VERSION_ID =
  'writer-codex-e1-version-1'

const STORY_SLUG =
  'writer-codex-e1-story'

const CHAPTER_SLUG =
  'writer-codex-e1-chapter'

const PUBLISHED_MARKER =
  'E1 published marker'

const DRAFT_MARKER =
  'E1 draft marker must stay private'

const PUBLISHED_CONTENT =
  `# ${PUBLISHED_MARKER}\n\nContenido publicado por la prueba E1.`

function now() {
  return new Date().toISOString()
}

if (!TEST_DATABASE_URL) {
  test(
    'E1 Writer -> publicación -> Codex',
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

  async function syncMutations(
    mutations: unknown[],
  ) {
    const {
      response,
      payload,
    } = await writerJson(
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
            mutations,
          }),
      },
    )

    assert.equal(
      response.status,
      200,
      `sync falló: ${JSON.stringify(payload)}`,
    )

    return payload as {
      acknowledgements: Array<{
        mutationId: string
        entityType: string
        entityId: string
        status: string
        serverVersion?: string
      }>
    }
  }

  async function readPublicChapter() {
    return writerJson(
      `/api/public/stories/${STORY_SLUG}` +
        `/chapters/${CHAPTER_SLUG}`,
    )
  }

  async function readCodexChapter() {
    return fetch(
      `${CODEX_BASE_URL}` +
        `/stories/${STORY_SLUG}` +
        `/chapters/${CHAPTER_SLUG}`,
      {
        headers: {
          accept: 'text/html',
        },
      },
    )
  }

  test(
    'E1 Writer -> publicación -> Codex',
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

      const initialSync =
        await syncMutations([
          {
            mutationId:
              'e1-create-story',
            entityType: 'story',
            entityId: STORY_ID,
            clientRevision: 1,
            baseServerVersion: null,
            payload: {
              id: STORY_ID,
              slug: STORY_SLUG,
              title:
                'Writer Codex E1 Story',
              description:
                'Historia temporal para validar el circuito E2E.',
              themeKey: 'codex',
              createdAt: timestamp,
              updatedAt: timestamp,
              revision: 1,
              deletedAt: null,
            },
          },
          {
            mutationId:
              'e1-create-chapter',
            entityType: 'chapter',
            entityId: CHAPTER_ID,
            clientRevision: 1,
            baseServerVersion: null,
            payload: {
              id: CHAPTER_ID,
              storyId: STORY_ID,
              slug: CHAPTER_SLUG,
              title:
                'Writer Codex E1 Chapter',
              order: 1,
              currentVersionId:
                VERSION_ID,
              draftContent:
                PUBLISHED_CONTENT,
              draftUpdatedAt:
                timestamp,
              createdAt: timestamp,
              updatedAt: timestamp,
              revision: 1,
              deletedAt: null,
            },
          },
          {
            mutationId:
              'e1-create-snapshot',
            entityType:
              'chapterVersion',
            entityId:
              VERSION_ID,
            clientRevision: 1,
            baseServerVersion: null,
            payload: {
              id: VERSION_ID,
              chapterId: CHAPTER_ID,
              parentVersionId: null,
              label: 'E1 snapshot',
              content:
                PUBLISHED_CONTENT,
              createdAt: timestamp,
              updatedAt: timestamp,
              deviceId:
                DEVICE_ID,
              revision: 1,
              deletedAt: null,
            },
          },
        ])

      assert.equal(
        initialSync.acknowledgements.length,
        3,
      )

      for (
        const acknowledgement
        of initialSync.acknowledgements
      ) {
        assert.equal(
          acknowledgement.status,
          'applied',
          `${acknowledgement.mutationId} no se sincronizó`,
        )
      }

      const chapterAck =
        initialSync.acknowledgements.find(
          (acknowledgement) =>
            acknowledgement.entityType ===
              'chapter' &&
            acknowledgement.entityId ===
              CHAPTER_ID,
        )

      assert.ok(
        chapterAck?.serverVersion,
        'el capítulo sincronizado no devolvió serverVersion',
      )

      await t.test(
        'publica el snapshot y el Codex lo renderiza',
        async () => {
          const {
            response,
            payload,
          } = await writerJson(
            '/api/publishing/chapters/publish',
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
                  chapterId:
                    CHAPTER_ID,
                  sourceVersionId:
                    VERSION_ID,
                }),
            },
          )

          assert.equal(
            response.status,
            200,
            `publicación falló: ${JSON.stringify(payload)}`,
          )

          const publicResult =
            await readPublicChapter()

          assert.equal(
            publicResult.response.status,
            200,
          )

          const publicPayload =
            publicResult.payload as {
              chapter: {
                content: string
              }
            }

          assert.equal(
            publicPayload.chapter.content,
            PUBLISHED_CONTENT,
          )

          const codexResponse =
            await readCodexChapter()

          assert.equal(
            codexResponse.status,
            200,
          )

          const html =
            await codexResponse.text()

          assert.match(
            html,
            new RegExp(PUBLISHED_MARKER),
          )
        },
      )

      await t.test(
        'editar el draft no altera la publicación visible en Codex',
        async () => {
          const draftTimestamp =
            now()

          const draftSync =
            await syncMutations([
              {
                mutationId:
                  'e1-edit-draft',
                entityType:
                  'chapter',
                entityId:
                  CHAPTER_ID,
                clientRevision: 2,
                baseServerVersion:
                  chapterAck.serverVersion,
                payload: {
                  id: CHAPTER_ID,
                  storyId: STORY_ID,
                  slug: CHAPTER_SLUG,
                  title:
                    'Writer Codex E1 Chapter',
                  order: 1,
                  currentVersionId:
                    VERSION_ID,
                  draftContent:
                    `# ${DRAFT_MARKER}`,
                  draftUpdatedAt:
                    draftTimestamp,
                  createdAt: timestamp,
                  updatedAt:
                    draftTimestamp,
                  revision: 2,
                  deletedAt: null,
                },
              },
            ])

          assert.equal(
            draftSync.acknowledgements[0]
              ?.status,
            'applied',
          )

          const publicResult =
            await readPublicChapter()

          assert.equal(
            publicResult.response.status,
            200,
          )

          const publicPayload =
            publicResult.payload as {
              chapter: {
                content: string
              }
            }

          assert.equal(
            publicPayload.chapter.content,
            PUBLISHED_CONTENT,
          )

          const codexResponse =
            await readCodexChapter()

          assert.equal(
            codexResponse.status,
            200,
          )

          const html =
            await codexResponse.text()

          assert.match(
            html,
            new RegExp(PUBLISHED_MARKER),
          )

          assert.doesNotMatch(
            html,
            new RegExp(DRAFT_MARKER),
          )
        },
      )

      await t.test(
        'despublicar elimina el capítulo de la API pública y devuelve 404 en Codex',
        async () => {
          const {
            response,
            payload,
          } = await writerJson(
            '/api/publishing/chapters/unpublish',
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
                  chapterId:
                    CHAPTER_ID,
                }),
            },
          )

          assert.equal(
            response.status,
            200,
            `despublicación falló: ${JSON.stringify(payload)}`,
          )

          const publicResult =
            await readPublicChapter()

          assert.equal(
            publicResult.response.status,
            404,
          )

          const codexResponse =
            await readCodexChapter()

          assert.equal(
            codexResponse.status,
            404,
          )
        },
      )
    },
  )
}
