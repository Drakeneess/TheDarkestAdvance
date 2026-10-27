import {
  createHash,
  createHmac,
  randomUUID,
} from 'node:crypto'

import {
  Readable,
} from 'node:stream'

export const STORY_ASSET_MAX_BYTES =
  10 * 1024 * 1024

export const STORY_ASSET_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

export type StoryAssetContentType =
  typeof STORY_ASSET_CONTENT_TYPES[number]

const CONTENT_TYPE_EXTENSION:
  Record<
    StoryAssetContentType,
    string
  > = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

const EXTENSION_CONTENT_TYPE:
  Record<
    string,
    StoryAssetContentType
  > = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
}

const ASSET_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i

const PNG_SIGNATURE =
  Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ])

const STORY_ASSET_OBJECT_PREFIX =
  'stories/'

interface StoryAssetS3Config {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  urlStyle:
    | 'virtual-host'
    | 'path'
}

export interface StoryAssetRecord {
  assetId: string
  contentType: StoryAssetContentType
  size: number
}

export interface StoryAssetReadable {
  stream: Readable
  contentType: StoryAssetContentType
  size: number
}

function requiredEnvironmentValue(
  name: string,
) {
  const value =
    process.env[name]?.trim()

  if (!value) {
    throw new Error(
      'STORY_ASSET_STORAGE_NOT_CONFIGURED',
    )
  }

  return value
}

function getS3Config(): StoryAssetS3Config {
  const urlStyle =
    process.env
      .STORY_ASSET_S3_URL_STYLE
      ?.trim() === 'path'
      ? 'path'
      : 'virtual-host'

  return {
    endpoint:
      requiredEnvironmentValue(
        'STORY_ASSET_S3_ENDPOINT',
      ),
    bucket:
      requiredEnvironmentValue(
        'STORY_ASSET_S3_BUCKET',
      ),
    region:
      process.env
        .STORY_ASSET_S3_REGION
        ?.trim() || 'auto',
    accessKeyId:
      requiredEnvironmentValue(
        'STORY_ASSET_S3_ACCESS_KEY_ID',
      ),
    secretAccessKey:
      requiredEnvironmentValue(
        'STORY_ASSET_S3_SECRET_ACCESS_KEY',
      ),
    urlStyle,
  }
}

export function isStoryAssetContentType(
  value: string | undefined,
): value is StoryAssetContentType {
  return (
    typeof value === 'string' &&
    STORY_ASSET_CONTENT_TYPES.includes(
      value as StoryAssetContentType,
    )
  )
}

function hasPrefix(
  bytes: Buffer,
  prefix: Buffer,
) {
  return (
    bytes.length >=
      prefix.length &&
    bytes.subarray(
      0,
      prefix.length,
    ).equals(prefix)
  )
}

function hasValidImageSignature(
  bytes: Buffer,
  contentType: StoryAssetContentType,
) {
  switch (contentType) {
    case 'image/jpeg':
      return (
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
      )

    case 'image/png':
      return hasPrefix(
        bytes,
        PNG_SIGNATURE,
      )

    case 'image/webp':
      return (
        bytes.length >= 12 &&
        bytes.toString(
          'ascii',
          0,
          4,
        ) === 'RIFF' &&
        bytes.toString(
          'ascii',
          8,
          12,
        ) === 'WEBP'
      )

    case 'image/avif': {
      if (
        bytes.length < 16 ||
        bytes.toString(
          'ascii',
          4,
          8,
        ) !== 'ftyp'
      ) {
        return false
      }

      const brands =
        bytes
          .subarray(
            8,
            Math.min(
              bytes.length,
              40,
            ),
          )
          .toString('ascii')

      return (
        brands.includes('avif') ||
        brands.includes('avis')
      )
    }
  }
}

function getContentTypeFromAssetId(
  assetId: string,
) {
  const extension =
    assetId
      .split('.')
      .pop()
      ?.toLowerCase()

  if (!extension) {
    return null
  }

  return (
    EXTENSION_CONTENT_TYPE[
      extension
    ] ?? null
  )
}

function assertSafeAssetId(
  assetId: string,
) {
  if (!ASSET_ID_PATTERN.test(assetId)) {
    throw new Error(
      'INVALID_STORY_ASSET_ID',
    )
  }
}

function sha256Hex(
  value: string | Buffer,
) {
  return createHash('sha256')
    .update(value)
    .digest('hex')
}

function hmac(
  key: string | Buffer,
  value: string,
) {
  return createHmac(
    'sha256',
    key,
  )
    .update(value)
    .digest()
}

function encodePath(
  value: string,
) {
  return value
    .split('/')
    .map(
      (segment) =>
        encodeURIComponent(segment),
    )
    .join('/')
}

function buildObjectUrl(
  config: StoryAssetS3Config,
  assetId: string,
) {
  const key =
    `${STORY_ASSET_OBJECT_PREFIX}${assetId}`

  const endpoint =
    new URL(config.endpoint)

  const basePath =
    endpoint.pathname
      .replace(/\/+$/, '')

  if (
    config.urlStyle ===
      'virtual-host'
  ) {
    endpoint.hostname =
      `${config.bucket}.${endpoint.hostname}`

    endpoint.pathname =
      `${basePath}/${encodePath(key)}`
  } else {
    endpoint.pathname =
      `${basePath}/${encodeURIComponent(config.bucket)}/${encodePath(key)}`
  }

  endpoint.search = ''
  endpoint.hash = ''

  return endpoint
}

function formatAmzDate(
  date: Date,
) {
  return date
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, '')
}

function createSignedHeaders(
  config: StoryAssetS3Config,
  method: 'GET' | 'PUT',
  url: URL,
  payloadHash: string,
  date = new Date(),
) {
  const amzDate =
    formatAmzDate(date)

  const shortDate =
    amzDate.slice(0, 8)

  const canonicalHeaders =
    `host:${url.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`

  const signedHeaders =
    'host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    method,
    url.pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope =
    `${shortDate}/${config.region}/s3/aws4_request`

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const dateKey =
    hmac(
      `AWS4${config.secretAccessKey}`,
      shortDate,
    )

  const regionKey =
    hmac(
      dateKey,
      config.region,
    )

  const serviceKey =
    hmac(
      regionKey,
      's3',
    )

  const signingKey =
    hmac(
      serviceKey,
      'aws4_request',
    )

  const signature =
    createHmac(
      'sha256',
      signingKey,
    )
      .update(stringToSign)
      .digest('hex')

  return {
    Authorization:
      'AWS4-HMAC-SHA256 ' +
      `Credential=${config.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, ` +
      `Signature=${signature}`,
    'x-amz-content-sha256':
      payloadHash,
    'x-amz-date': amzDate,
  }
}

async function readS3Error(
  response: Response,
) {
  let details = ''

  try {
    details =
      (await response.text())
        .slice(0, 500)
  } catch {
    // Best effort only.
  }

  return (
    `${response.status}` +
    (details
      ? `: ${details}`
      : '')
  )
}

export async function storeStoryAsset(
  bytes: Buffer,
  contentType: StoryAssetContentType,
): Promise<StoryAssetRecord> {
  if (
    bytes.length === 0 ||
    bytes.length >
      STORY_ASSET_MAX_BYTES
  ) {
    throw new Error(
      'INVALID_STORY_ASSET_SIZE',
    )
  }

  if (
    !hasValidImageSignature(
      bytes,
      contentType,
    )
  ) {
    throw new Error(
      'INVALID_STORY_ASSET_CONTENT',
    )
  }

  const config =
    getS3Config()

  const extension =
    CONTENT_TYPE_EXTENSION[
      contentType
    ]

  const assetId =
    `${randomUUID()}.${extension}`

  const url =
    buildObjectUrl(
      config,
      assetId,
    )

  const payloadHash =
    sha256Hex(bytes)

  const requestBody =
    Uint8Array.from(bytes)

  const response =
    await fetch(
      url,
      {
        method: 'PUT',
        headers: {
          ...createSignedHeaders(
            config,
            'PUT',
            url,
            payloadHash,
          ),
          'Content-Type':
            contentType,
          'Content-Length':
            String(bytes.length),
        },
        body: requestBody,
      },
    )

  if (!response.ok) {
    throw new Error(
      'STORY_ASSET_STORAGE_WRITE_FAILED ' +
      await readS3Error(response),
    )
  }

  return {
    assetId,
    contentType,
    size: bytes.length,
  }
}

export async function openStoryAsset(
  assetId: string,
): Promise<StoryAssetReadable | null> {
  assertSafeAssetId(
    assetId,
  )

  const contentType =
    getContentTypeFromAssetId(
      assetId,
    )

  if (!contentType) {
    return null
  }

  const config =
    getS3Config()

  const url =
    buildObjectUrl(
      config,
      assetId,
    )

  const payloadHash =
    sha256Hex(Buffer.alloc(0))

  const response =
    await fetch(
      url,
      {
        method: 'GET',
        headers:
          createSignedHeaders(
            config,
            'GET',
            url,
            payloadHash,
          ),
      },
    )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(
      'STORY_ASSET_STORAGE_READ_FAILED ' +
      await readS3Error(response),
    )
  }

  const bytes =
    Buffer.from(
      await response.arrayBuffer(),
    )

  if (
    bytes.length === 0 ||
    bytes.length >
      STORY_ASSET_MAX_BYTES
  ) {
    throw new Error(
      'STORY_ASSET_STORAGE_INVALID_RESPONSE',
    )
  }

  const declaredLength =
    response.headers.get(
      'content-length',
    )

  if (declaredLength !== null) {
    const contentLength =
      Number(declaredLength)

    if (
      !Number.isSafeInteger(
        contentLength,
      ) ||
      contentLength !== bytes.length
    ) {
      throw new Error(
        'STORY_ASSET_STORAGE_INVALID_RESPONSE',
      )
    }
  }

  return {
    stream:
      Readable.from([
        bytes,
      ]),
    contentType,
    size: bytes.length,
  }
}
