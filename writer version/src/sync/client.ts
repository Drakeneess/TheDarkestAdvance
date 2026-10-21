import {
  clearWriterSessionToken,
  getWriterSessionToken,
  WriterSessionError,
} from '../auth/session'

import type {
  SyncExchangeRequest,
  SyncExchangeResponse,
} from './protocol'

import {
  getSyncApiUrl,
} from './config'

export async function exchangeSync(
  request:
    SyncExchangeRequest,
): Promise<SyncExchangeResponse> {
  const authToken =
    getWriterSessionToken()

  if (!authToken) {
    throw new WriterSessionError(
      'MISSING_SESSION',
      'No hay una sesión autenticada para sincronizar.',
    )
  }

  const response =
    await fetch(
      `${getSyncApiUrl()}/api/sync/exchange`,
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
            request,
          ),
      },
    )

  if (response.status === 401) {
    clearWriterSessionToken()

    throw new WriterSessionError(
      'SESSION_REJECTED',
      'La sesión del Writer expiró o dejó de ser válida.',
    )
  }

  if (!response.ok) {
    const body =
      await response.text()

    throw new Error(
      `Sync exchange falló (${response.status}): ${body}`,
    )
  }

  return await response.json() as
    SyncExchangeResponse
}
