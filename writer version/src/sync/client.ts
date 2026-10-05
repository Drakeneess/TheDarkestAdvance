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
  const response =
    await fetch(
      `${getSyncApiUrl()}/api/sync/exchange`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            request,
          ),
      },
    )

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