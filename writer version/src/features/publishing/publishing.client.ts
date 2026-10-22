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

interface ChapterCommand {
  workspaceId: string
  storyId: string
  chapterId: string
}

interface PublishChapterCommand
  extends ChapterCommand {
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

export interface ChapterPublicationStatus {
  published: boolean

  chapter: {
    sourceVersionId: string
    publishedAt: string
    updatedAt: string
  } | null
}

export interface UnpublishChapterResult {
  unpublished: boolean
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

async function publishingRequest<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const authToken =
    getWriterSessionToken()

  if (!authToken) {
    throw new WriterSessionError(
      'MISSING_SESSION',
      'No hay una sesión autenticada para gestionar la publicación.',
    )
  }

  const response =
    await fetch(
      `${getSyncApiUrl()}${path}`,
      {
        ...init,

        headers: {
          'Authorization':
            `Bearer ${authToken}`,

          ...init.headers,
        },
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
        : `${fallbackMessage} (${response.status}).`

    throw new PublishingApiError(
      code,
      message,
      response.status,
    )
  }

  return body as T
}

export function publishChapterCommand(
  command:
    PublishChapterCommand,
): Promise<PublishChapterResult> {
  return publishingRequest(
    '/api/publishing/chapters/publish',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body:
        JSON.stringify(
          command,
        ),
    },
    'La publicación falló',
  )
}

export function getChapterPublicationStatusCommand(
  command:
    ChapterCommand,
  signal?: AbortSignal,
): Promise<ChapterPublicationStatus> {
  const params =
    new URLSearchParams({
      workspaceId:
        command.workspaceId,

      storyId:
        command.storyId,

      chapterId:
        command.chapterId,
    })

  return publishingRequest(
    `/api/publishing/chapters/status?${params.toString()}`,
    {
      method: 'GET',
      signal,
    },
    'No se pudo consultar el estado de publicación',
  )
}

export function unpublishChapterCommand(
  command:
    ChapterCommand,
): Promise<UnpublishChapterResult> {
  return publishingRequest(
    '/api/publishing/chapters/unpublish',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body:
        JSON.stringify(
          command,
        ),
    },
    'No se pudo despublicar el capítulo',
  )
}
