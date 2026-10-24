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
