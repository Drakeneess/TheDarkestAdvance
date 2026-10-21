const WRITER_AUTH_TOKEN_KEY =
  'tda.writer.auth-token'

export class WriterSessionError extends Error {
  constructor(
    public readonly code:
      | 'MISSING_SESSION'
      | 'SESSION_REJECTED',
    message: string,
  ) {
    super(message)

    this.name =
      'WriterSessionError'
  }
}

export function getWriterSessionToken() {
  return sessionStorage.getItem(
    WRITER_AUTH_TOKEN_KEY,
  )
}

export function setWriterSessionToken(
  token: string,
) {
  const normalized =
    token.trim()

  if (!normalized) {
    clearWriterSessionToken()
    return
  }

  sessionStorage.setItem(
    WRITER_AUTH_TOKEN_KEY,
    normalized,
  )
}

export function clearWriterSessionToken() {
  sessionStorage.removeItem(
    WRITER_AUTH_TOKEN_KEY,
  )
}
