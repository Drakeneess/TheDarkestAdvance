import {
  clearWriterSessionToken,
  getWriterSessionToken,
  WriterSessionError,
} from '../../auth/session'

import {
  getSyncApiUrl,
} from '../../sync/config'

export class PublishingApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)

    this.name =
      'PublishingApiError'
  }
}

interface PublishChapterCommand {
  workspaceId: string
  storyId: string
  chapterId: string
  sourceVersionId: string
}

export interface PublishChapterResult {
  story: {
    storyId: string
    slug: string
    title: string
    themeKey: string
  }

  chapter: {
    chapterId: string
    sourceVersionId: string
    slug: string
    title: string
    order: number
    content: string
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  )
}

async function readResponseBody(
  response: Response,
) {
  const text =
    await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function publishChapterCommand(
  command:
    PublishChapterCommand,
): Promise<PublishChapterResult> {
  const authToken =
    getWriterSessionToken()

  if (!authToken) {
    throw new WriterSessionError(
      'MISSING_SESSION',
      'No hay una sesión autenticada para publicar.',
    )
  }

  const response =
    await fetch(
      `${getSyncApiUrl()}/api/publishing/chapters/publish`,
      {
        method:
          'POST',

        headers: {
          'Authorization':
            `Bearer ${authToken}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            command,
          ),
      },
    )

  const body =
    await readResponseBody(
      response,
    )

  if (response.status === 401) {
    clearWriterSessionToken()

    throw new WriterSessionError(
      'SESSION_REJECTED',
      'La sesión del Writer expiró o dejó de ser válida.',
    )
  }

  if (!response.ok) {
    const code =
      isRecord(body) &&
      typeof body.error === 'string'
        ? body.error
        : 'PUBLISHING_REQUEST_FAILED'

    const message =
      isRecord(body) &&
      typeof body.message === 'string'
        ? body.message
        : `La publicación falló (${response.status}).`

    throw new PublishingApiError(
      code,
      message,
      response.status,
    )
  }

  return body as
    PublishChapterResult
}
