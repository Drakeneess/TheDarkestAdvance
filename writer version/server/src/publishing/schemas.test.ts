import assert from 'node:assert/strict'
import test from 'node:test'

import {
  publishableStorySchema,
} from './schemas'

function storyPayload() {
  return {
    id: 'story-1',
    slug: 'story-1',
    title: 'Story',
    description: 'Description',
    themeKey: 'codex',
  }
}

test(
  'publishable story accepts public http assets',
  () => {
    const result =
      publishableStorySchema.safeParse({
        ...storyPayload(),
        assets: {
          coverImageUrl:
            'https://cdn.example.com/cover.webp',
          heroImageUrl:
            'http://localhost:3000/hero.png',
          logoImageUrl: null,
        },
      })

    assert.equal(
      result.success,
      true,
    )
  },
)

test(
  'publishable story rejects non-http asset schemes',
  () => {
    const javascriptResult =
      publishableStorySchema.safeParse({
        ...storyPayload(),
        assets: {
          coverImageUrl:
            'javascript:alert(1)',
          heroImageUrl: null,
          logoImageUrl: null,
        },
      })

    const dataResult =
      publishableStorySchema.safeParse({
        ...storyPayload(),
        assets: {
          coverImageUrl:
            'data:image/png;base64,AAAA',
          heroImageUrl: null,
          logoImageUrl: null,
        },
      })

    assert.equal(
      javascriptResult.success,
      false,
    )

    assert.equal(
      dataResult.success,
      false,
    )
  },
)

test(
  'publishable story keeps profile fields backward compatible',
  () => {
    const result =
      publishableStorySchema.safeParse(
        storyPayload(),
      )

    assert.equal(
      result.success,
      true,
    )

    if (!result.success) {
      return
    }

    assert.deepEqual(
      result.data.assets,
      {
        coverImageUrl: null,
        heroImageUrl: null,
        logoImageUrl: null,
      },
    )

    assert.equal(
      result.data.visuals.readerWidth,
      'standard',
    )
  },
)
