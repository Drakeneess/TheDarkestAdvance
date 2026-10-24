import {
  createReadStream,
} from 'node:fs'

import {
  mkdir,
  stat,
  writeFile,
} from 'node:fs/promises'

import {
  resolve,
} from 'node:path'

import {
  randomUUID,
} from 'node:crypto'

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

export interface StoryAssetRecord {
  assetId: string
  contentType: StoryAssetContentType
  size: number
}

export interface StoryAssetReadable {
  stream: ReturnType<
    typeof createReadStream
  >
  contentType: StoryAssetContentType
  size: number
}

function getStorageDirectory() {
  const configured =
    process.env
      .STORY_ASSET_STORAGE_DIR
      ?.trim()

  return resolve(
    configured ||
      '.data/story-assets',
  )
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

  const extension =
    CONTENT_TYPE_EXTENSION[
      contentType
    ]

  const assetId =
    `${randomUUID()}.${extension}`

  const directory =
    getStorageDirectory()

  await mkdir(
    directory,
    {
      recursive: true,
    },
  )

  await writeFile(
    resolve(
      directory,
      assetId,
    ),
    bytes,
    {
      flag: 'wx',
    },
  )

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

  const path =
    resolve(
      getStorageDirectory(),
      assetId,
    )

  let metadata:
    Awaited<
      ReturnType<typeof stat>
    >

  try {
    metadata =
      await stat(path)
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error
        ? error.code
        : null

    if (code === 'ENOENT') {
      return null
    }

    throw error
  }

  if (!metadata.isFile()) {
    return null
  }

  return {
    stream:
      createReadStream(path),
    contentType,
    size: metadata.size,
  }
}
