import {
  getSyncApiUrl,
} from '../sync/config'

import {
  setWriterSessionToken,
} from './session'

export type WriterLoginErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'LOGIN_FAILED'

export class WriterLoginError extends Error {
  constructor(
    public readonly code:
      WriterLoginErrorCode,
    message: string,
    public readonly status:
      number | null = null,
  ) {
    super(message)

    this.name =
      'WriterLoginError'
  }
}

type LoginResponse = {
  userId: string
  token: string
}

function isLoginResponse(
  value: unknown,
): value is LoginResponse {
  if (
    typeof value !== 'object'
    || value === null
  ) {
    return false
  }

  const record =
    value as Record<
      string,
      unknown
    >

  return (
    typeof record.userId ===
      'string'
    && typeof record.token ===
      'string'
    && record.token.length > 0
  )
}

export async function loginWriter(
  username: string,
  password: string,
) {
  let response: Response

  try {
    response =
      await fetch(
        `${getSyncApiUrl()}/api/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              username,
              password,
            }),
        },
      )
  } catch {
    throw new WriterLoginError(
      'NETWORK_ERROR',
      'No se pudo conectar con el servidor del Writer.',
    )
  }

  let body: unknown = null

  try {
    body =
      await response.json()
  } catch {
    body = null
  }

  if (
    response.status === 401
  ) {
    throw new WriterLoginError(
      'INVALID_CREDENTIALS',
      'Usuario o contraseña incorrectos.',
      response.status,
    )
  }

  if (
    response.status === 503
  ) {
    throw new WriterLoginError(
      'LOGIN_NOT_CONFIGURED',
      'El inicio de sesión todavía no está configurado en el servidor.',
      response.status,
    )
  }

  if (
    !response.ok
    || !isLoginResponse(
      body,
    )
  ) {
    throw new WriterLoginError(
      'LOGIN_FAILED',
      `No se pudo iniciar sesión (${response.status}).`,
      response.status,
    )
  }

  setWriterSessionToken(
    body.token,
  )

  return {
    userId:
      body.userId,
  }
}
