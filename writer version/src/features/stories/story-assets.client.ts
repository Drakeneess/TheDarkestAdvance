import {
  clearWriterSessionToken,
  getWriterSessionToken,
  WriterSessionError,
} from '../../auth/session'

import {
  getWorkspaceId,
  getSyncApiUrl,
} from '../../sync/config'

export type StoryAssetKind =
  | 'cover'
  | 'hero'
  | 'logo'

export interface StoryAssetUploadResult {
  asset: {
    kind: StoryAssetKind
    url: string
    contentType: string
    size: number
  }
}

export class StoryAssetUploadError
  extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name =
      'StoryAssetUploadError'
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

export async function uploadStoryAsset(
  storyId: string,
  kind: StoryAssetKind,
  file: File,
): Promise<StoryAssetUploadResult> {
  const authToken =
    getWriterSessionToken()

  if (!authToken) {
    throw new WriterSessionError(
      'MISSING_SESSION',
      'Inicia una sesión del Writer antes de subir assets.',
    )
  }

  const workspaceId =
    getWorkspaceId()

  const params =
    new URLSearchParams({
      workspaceId,
    })

  const response =
    await fetch(
      `${getSyncApiUrl()}/api/assets/stories/${encodeURIComponent(storyId)}/${kind}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          Authorization:
            `Bearer ${authToken}`,
          'Content-Type':
            file.type ||
            'application/octet-stream',
        },
        body: file,
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
      typeof body.code === 'string'
        ? body.code
        : isRecord(body) &&
            typeof body.error === 'string'
          ? body.error
          : 'STORY_ASSET_UPLOAD_FAILED'

    const messages:
      Record<string, string> = {
      STORY_ASSET_TYPE_NOT_SUPPORTED:
        'El formato no está permitido. Usa JPEG, PNG, WebP o AVIF.',
      STORY_ASSET_CONTENT_MISMATCH:
        'El contenido del archivo no coincide con el formato declarado.',
      STORY_ASSET_TOO_LARGE:
        'El archivo supera el límite de 10 MiB.',
      STORY_ASSET_BODY_REQUIRED:
        'No se recibió un archivo válido.',
      STORY_NOT_FOUND:
        'La historia ya no está disponible para recibir assets.',
      WORKSPACE_FORBIDDEN:
        'Tu sesión no tiene acceso al workspace de esta historia.',
      FST_ERR_CTP_BODY_TOO_LARGE:
        'El archivo supera el límite de 10 MiB.',
      FST_ERR_CTP_INVALID_MEDIA_TYPE:
        'El formato no está permitido. Usa JPEG, PNG, WebP o AVIF.',
    }

    throw new StoryAssetUploadError(
      code,
      messages[code] ??
        `No se pudo subir el asset (${response.status}).`,
      response.status,
    )
  }

  if (
    !isRecord(body) ||
    !isRecord(body.asset) ||
    typeof body.asset.url !== 'string' ||
    typeof body.asset.kind !== 'string' ||
    typeof body.asset.contentType !== 'string' ||
    typeof body.asset.size !== 'number'
  ) {
    throw new StoryAssetUploadError(
      'INVALID_STORY_ASSET_RESPONSE',
      'El servidor devolvió una respuesta de asset inválida.',
      response.status,
    )
  }

  return body as unknown as
    StoryAssetUploadResult
}
