const WRITER_AUTH_TOKEN_KEY =
  'tda.writer.auth-token'

const WRITER_SESSION_CHANGE_EVENT =
  'tda.writer.session-change'

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

function emitSessionChange() {
  window.dispatchEvent(
    new Event(
      WRITER_SESSION_CHANGE_EVENT,
    ),
  )
}

export function getWriterSessionToken() {
  const persistentToken =
    localStorage.getItem(
      WRITER_AUTH_TOKEN_KEY,
    )

  if (persistentToken) {
    return persistentToken
  }

  const legacyToken =
    sessionStorage.getItem(
      WRITER_AUTH_TOKEN_KEY,
    )

  if (!legacyToken) {
    return null
  }

  localStorage.setItem(
    WRITER_AUTH_TOKEN_KEY,
    legacyToken,
  )

  sessionStorage.removeItem(
    WRITER_AUTH_TOKEN_KEY,
  )

  return legacyToken
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

  localStorage.setItem(
    WRITER_AUTH_TOKEN_KEY,
    normalized,
  )

  sessionStorage.removeItem(
    WRITER_AUTH_TOKEN_KEY,
  )

  emitSessionChange()
}

export function clearWriterSessionToken() {
  localStorage.removeItem(
    WRITER_AUTH_TOKEN_KEY,
  )

  sessionStorage.removeItem(
    WRITER_AUTH_TOKEN_KEY,
  )

  emitSessionChange()
}

export function subscribeWriterSession(
  listener: () => void,
) {
  window.addEventListener(
    WRITER_SESSION_CHANGE_EVENT,
    listener,
  )

  return () => {
    window.removeEventListener(
      WRITER_SESSION_CHANGE_EVENT,
      listener,
    )
  }
}
