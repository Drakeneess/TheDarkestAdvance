import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

import {
  getWriterAuthTokenForUser,
} from './auth'

const PASSWORD_HASH_PREFIX =
  'scrypt-v1'

const PASSWORD_HASH_BYTES =
  64

const SCRYPT_OPTIONS = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem:
    64 * 1024 * 1024,
} as const

export class WriterPasswordAuthConfigurationError
  extends Error {
  constructor(message: string) {
    super(message)

    this.name =
      'WriterPasswordAuthConfigurationError'
  }
}

type PasswordHashMap =
  Record<string, string>

function parsePasswordHashes(
  rawValue: string | undefined,
): PasswordHashMap | null {
  if (!rawValue) {
    return null
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(rawValue)
  } catch {
    throw new WriterPasswordAuthConfigurationError(
      'WRITER_AUTH_PASSWORD_HASHES debe ser un objeto JSON válido',
    )
  }

  if (
    typeof parsed !== 'object'
    || parsed === null
    || Array.isArray(parsed)
  ) {
    throw new WriterPasswordAuthConfigurationError(
      'WRITER_AUTH_PASSWORD_HASHES debe mapear userId a password hash',
    )
  }

  const entries =
    Object.entries(parsed)

  if (entries.length === 0) {
    throw new WriterPasswordAuthConfigurationError(
      'WRITER_AUTH_PASSWORD_HASHES debe contener al menos un usuario',
    )
  }

  const result:
    PasswordHashMap = {}

  for (
    const [
      userId,
      passwordHash,
    ] of entries
  ) {
    if (
      userId.trim().length === 0
      || typeof passwordHash !== 'string'
      || !isWriterPasswordHash(
        passwordHash,
      )
    ) {
      throw new WriterPasswordAuthConfigurationError(
        'Cada usuario de WRITER_AUTH_PASSWORD_HASHES requiere un userId y un hash scrypt-v1 válido',
      )
    }

    result[userId] =
      passwordHash
  }

  return result
}

function decodeWriterPasswordHash(
  encoded: string,
) {
  const [
    prefix,
    saltText,
    digestText,
  ] = encoded.split('$')

  if (
    prefix !==
      PASSWORD_HASH_PREFIX
    || !saltText
    || !digestText
  ) {
    return null
  }

  try {
    const salt =
      Buffer.from(
        saltText,
        'base64url',
      )

    const digest =
      Buffer.from(
        digestText,
        'base64url',
      )

    if (
      salt.length < 16
      || digest.length !==
        PASSWORD_HASH_BYTES
    ) {
      return null
    }

    return {
      salt,
      digest,
    }
  } catch {
    return null
  }
}

export function isWriterPasswordHash(
  value: string,
) {
  return Boolean(
    decodeWriterPasswordHash(
      value,
    ),
  )
}

export function hashWriterPassword(
  password: string,
) {
  if (password.length < 8) {
    throw new Error(
      'La contraseña del Writer debe tener al menos 8 caracteres',
    )
  }

  const salt =
    randomBytes(16)

  const digest =
    scryptSync(
      password,
      salt,
      PASSWORD_HASH_BYTES,
      SCRYPT_OPTIONS,
    )

  return [
    PASSWORD_HASH_PREFIX,
    salt.toString(
      'base64url',
    ),
    digest.toString(
      'base64url',
    ),
  ].join('$')
}

export function verifyWriterPassword(
  password: string,
  encodedHash: string,
) {
  const decoded =
    decodeWriterPasswordHash(
      encodedHash,
    )

  if (!decoded) {
    return false
  }

  const candidate =
    scryptSync(
      password,
      decoded.salt,
      PASSWORD_HASH_BYTES,
      SCRYPT_OPTIONS,
    )

  return timingSafeEqual(
    decoded.digest,
    candidate,
  )
}

export type WriterPasswordLoginResult = {
  userId: string
  token: string
}

export function createWriterPasswordLogin(
  rawPasswordHashes =
    process.env.WRITER_AUTH_PASSWORD_HASHES,
  rawTokens =
    process.env.WRITER_AUTH_TOKENS,
) {
  const passwordHashes =
    parsePasswordHashes(
      rawPasswordHashes,
    )

  return function loginWriter(
    userId: string,
    password: string,
  ):
    WriterPasswordLoginResult
    | null {
    if (!passwordHashes) {
      throw new WriterPasswordAuthConfigurationError(
        'El inicio de sesión con contraseña no está configurado',
      )
    }

    const passwordHash =
      passwordHashes[userId]

    if (
      !passwordHash
      || !verifyWriterPassword(
        password,
        passwordHash,
      )
    ) {
      return null
    }

    const token =
      getWriterAuthTokenForUser(
        userId,
        rawTokens,
      )

    if (!token) {
      throw new WriterPasswordAuthConfigurationError(
        `El usuario ${userId} no tiene token asociado en WRITER_AUTH_TOKENS`,
      )
    }

    return {
      userId,
      token,
    }
  }
}
