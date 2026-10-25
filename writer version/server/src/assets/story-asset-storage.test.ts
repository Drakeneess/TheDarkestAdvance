import assert from 'node:assert/strict'
import test from 'node:test'

import {
  Readable,
} from 'node:stream'

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
  stream: Readable,
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
  'story asset storage keeps versioned immutable objects',
  async (t) => {
    const previous = {
      endpoint:
        process.env.STORY_ASSET_S3_ENDPOINT,
      bucket:
        process.env.STORY_ASSET_S3_BUCKET,
      region:
        process.env.STORY_ASSET_S3_REGION,
      accessKeyId:
        process.env.STORY_ASSET_S3_ACCESS_KEY_ID,
      secretAccessKey:
        process.env.STORY_ASSET_S3_SECRET_ACCESS_KEY,
      urlStyle:
        process.env.STORY_ASSET_S3_URL_STYLE,
    }

    process.env.STORY_ASSET_S3_ENDPOINT =
      'https://storage.example.test'
    process.env.STORY_ASSET_S3_BUCKET =
      'test-bucket'
    process.env.STORY_ASSET_S3_REGION =
      'auto'
    process.env.STORY_ASSET_S3_ACCESS_KEY_ID =
      'test-access-key'
    process.env.STORY_ASSET_S3_SECRET_ACCESS_KEY =
      'test-secret-key'
    process.env.STORY_ASSET_S3_URL_STYLE =
      'path'

    const objects =
      new Map<string, {
        bytes: Buffer
        contentType: string
      }>()

    const originalFetch =
      globalThis.fetch

    globalThis.fetch =
      async (
        input,
        init,
      ) => {
        const url =
          new URL(
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url,
          )

        const method =
          init?.method ?? 'GET'

        const authorization =
          new Headers(
            init?.headers,
          ).get('authorization')

        assert.match(
          authorization ?? '',
          /^AWS4-HMAC-SHA256 /,
        )

        if (method === 'PUT') {
          const bytes =
            Buffer.from(
              init?.body as Buffer,
            )

          objects.set(
            url.pathname,
            {
              bytes,
              contentType:
                new Headers(
                  init?.headers,
                ).get(
                  'content-type',
                ) ??
                'application/octet-stream',
            },
          )

          return new Response(
            null,
            {
              status: 200,
            },
          )
        }

        const object =
          objects.get(
            url.pathname,
          )

        if (!object) {
          return new Response(
            null,
            {
              status: 404,
            },
          )
        }

        return new Response(
          object.bytes,
          {
            status: 200,
            headers: {
              'content-length':
                String(
                  object.bytes.length,
                ),
              'content-type':
                object.contentType,
            },
          },
        )
      }

    t.after(() => {
      globalThis.fetch =
        originalFetch

      for (
        const [key, value]
          of Object.entries(previous)
      ) {
        const envName = {
          endpoint:
            'STORY_ASSET_S3_ENDPOINT',
          bucket:
            'STORY_ASSET_S3_BUCKET',
          region:
            'STORY_ASSET_S3_REGION',
          accessKeyId:
            'STORY_ASSET_S3_ACCESS_KEY_ID',
          secretAccessKey:
            'STORY_ASSET_S3_SECRET_ACCESS_KEY',
          urlStyle:
            'STORY_ASSET_S3_URL_STYLE',
        }[key]!

        if (value === undefined) {
          delete process.env[envName]
        } else {
          process.env[envName] =
            value
        }
      }
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
