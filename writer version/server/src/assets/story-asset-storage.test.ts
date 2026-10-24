import assert from 'node:assert/strict'
import test from 'node:test'

import {
  mkdtemp,
  rm,
} from 'node:fs/promises'

import {
  tmpdir,
} from 'node:os'

import {
  join,
} from 'node:path'

import {
  openStoryAsset,
  storeStoryAsset,
} from './story-asset-storage'

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

function fakePng(
  marker: string,
) {
  return Buffer.concat([
    PNG_SIGNATURE,
    Buffer.from(
      marker,
      'utf8',
    ),
  ])
}

async function readStream(
  stream: NodeJS.ReadableStream,
) {
  const chunks: Buffer[] = []

  for await (
    const chunk
      of stream
  ) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk),
    )
  }

  return Buffer.concat(chunks)
}

test(
  'story asset storage keeps versioned immutable files',
  async (t) => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          'writer-story-assets-',
        ),
      )

    const previousDirectory =
      process.env
        .STORY_ASSET_STORAGE_DIR

    process.env
      .STORY_ASSET_STORAGE_DIR =
      directory

    t.after(async () => {
      if (
        previousDirectory ===
        undefined
      ) {
        delete process.env
          .STORY_ASSET_STORAGE_DIR
      } else {
        process.env
          .STORY_ASSET_STORAGE_DIR =
          previousDirectory
      }

      await rm(
        directory,
        {
          recursive: true,
          force: true,
        },
      )
    })

    const firstBytes =
      fakePng('first')

    const secondBytes =
      fakePng('second')

    const first =
      await storeStoryAsset(
        firstBytes,
        'image/png',
      )

    const second =
      await storeStoryAsset(
        secondBytes,
        'image/png',
      )

    assert.notEqual(
      first.assetId,
      second.assetId,
    )

    assert.match(
      first.assetId,
      /^[0-9a-f-]+\.png$/i,
    )

    const firstStored =
      await openStoryAsset(
        first.assetId,
      )

    const secondStored =
      await openStoryAsset(
        second.assetId,
      )

    assert.ok(firstStored)
    assert.ok(secondStored)

    assert.equal(
      firstStored.contentType,
      'image/png',
    )

    assert.deepEqual(
      await readStream(
        firstStored.stream,
      ),
      firstBytes,
    )

    assert.deepEqual(
      await readStream(
        secondStored.stream,
      ),
      secondBytes,
    )

    await assert.rejects(
      () =>
        storeStoryAsset(
          Buffer.from(
            'not-a-png',
          ),
          'image/png',
        ),
      /INVALID_STORY_ASSET_CONTENT/,
    )
  },
)
