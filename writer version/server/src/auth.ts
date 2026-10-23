import {
  createHash,
  timingSafeEqual,
} from 'node:crypto'

import type {
  FastifyReply,
  FastifyRequest,
} from 'fastify'

export type WriterAuthPrincipal = {
  userId: string
}

declare module 'fastify' {
  interface FastifyRequest {
    authPrincipal:
      WriterAuthPrincipal | null
  }
}

type AuthTokenEntry = {
  userId: string
  token: string
  digest: Buffer
}

function digestToken(
  token: string,
) {
  return createHash('sha256')
    .update(token, 'utf8')
    .digest()
}

function parseAuthTokens(
  rawValue: string | undefined,
): AuthTokenEntry[] {
  if (!rawValue) {
    throw new Error(
      'WRITER_AUTH_TOKENS no está configurada',
    )
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(rawValue)
  } catch {
    throw new Error(
      'WRITER_AUTH_TOKENS debe ser un objeto JSON válido',
    )
  }

  if (
    typeof parsed !== 'object'
    || parsed === null
    || Array.isArray(parsed)
  ) {
    throw new Error(
      'WRITER_AUTH_TOKENS debe mapear userId a token',
    )
  }

  const entries =
    Object.entries(parsed)

  if (entries.length === 0) {
    throw new Error(
      'WRITER_AUTH_TOKENS debe contener al menos una credencial',
    )
  }

  return entries.map(
    ([userId, token]) => {
      if (
        userId.trim().length === 0
        || typeof token !== 'string'
        || token.length < 32
      ) {
        throw new Error(
          'Cada credencial de WRITER_AUTH_TOKENS requiere un userId y un token de al menos 32 caracteres',
        )
      }

      return {
        userId,
        token,
        digest:
          digestToken(token),
      }
    },
  )
}

function readBearerToken(
  authorization:
    string | undefined,
) {
  if (!authorization) {
    return null
  }

  const match =
    /^Bearer\s+(.+)$/i.exec(
      authorization,
    )

  const token =
    match?.[1]?.trim()

  return token || null
}

export function getWriterAuthTokenForUser(
  userId: string,
  rawTokens =
    process.env.WRITER_AUTH_TOKENS,
) {
  return (
    parseAuthTokens(rawTokens)
      .find(
        (entry) =>
          entry.userId === userId,
      )
      ?.token ?? null
  )
}

export function createWriterAuthenticator(
  rawTokens =
    process.env.WRITER_AUTH_TOKENS,
) {
  const credentials =
    parseAuthTokens(rawTokens)

  return async function authenticateWriter(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const token =
      readBearerToken(
        request.headers.authorization,
      )

    if (!token) {
      return reply
        .header(
          'WWW-Authenticate',
          'Bearer',
        )
        .status(401)
        .send({
          error:
            'AUTHENTICATION_REQUIRED',
        })
    }

    const tokenDigest =
      digestToken(token)

    const credential =
      credentials.find(
        ({ digest }) =>
          timingSafeEqual(
            digest,
            tokenDigest,
          ),
      )

    if (!credential) {
      return reply
        .header(
          'WWW-Authenticate',
          'Bearer',
        )
        .status(401)
        .send({
          error:
            'INVALID_CREDENTIALS',
        })
    }

    request.authPrincipal = {
      userId:
        credential.userId,
    }
  }
}
