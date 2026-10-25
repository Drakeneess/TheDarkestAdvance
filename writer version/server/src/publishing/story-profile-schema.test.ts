import assert from 'node:assert/strict'
import test from 'node:test'

import {
  publishableStorySchema,
} from './schemas'

const baseStory = {
  id: 'story-1',
  slug: 'story-one',
  title: 'Story One',
  description: 'Description',
  themeKey: 'codex',
}

test(
  'publishableStorySchema completa Story Profile para payloads antiguos',
  () => {
    const parsed =
      publishableStorySchema.parse(
        baseStory,
      )

    assert.deepEqual(
      parsed.profile,
      {
        subtitle: '',
        authorName: '',
        status: 'ongoing',
        language: 'es',
        genres: [],
        tags: [],
        contentRating: null,
      },
    )

    assert.deepEqual(
      parsed.assets,
      {
        coverImageUrl: null,
        heroImageUrl: null,
        logoImageUrl: null,
      },
    )

    assert.deepEqual(
      parsed.visuals,
      {
        accent: null,
        accentSoft: null,
        background: null,
        panel: null,
        displayFontKey: null,
        bodyFontKey: null,
        ornamentKey: null,
        textureKey: null,
        readerWidth: 'standard',
      },
    )
  },
)

test(
  'publishableStorySchema conserva Story Profile explícito',
  () => {
    const parsed =
      publishableStorySchema.parse({
        ...baseStory,
        profile: {
          subtitle: 'A subtitle',
          authorName: 'Author',
          status: 'hiatus',
          language: 'en',
          genres: [
            'Fantasy',
          ],
          tags: [
            'Psychological',
          ],
          contentRating: '16+',
        },
        assets: {
          coverImageUrl:
            'https://example.com/cover.png',
          heroImageUrl: null,
          logoImageUrl: null,
        },
        visuals: {
          accent: '#55d6ff',
          readerWidth: 'wide',
        },
      })

    assert.equal(
      parsed.profile.status,
      'hiatus',
    )

    assert.deepEqual(
      parsed.profile.genres,
      ['Fantasy'],
    )

    assert.equal(
      parsed.assets.coverImageUrl,
      'https://example.com/cover.png',
    )

    assert.equal(
      parsed.visuals.accent,
      '#55d6ff',
    )

    assert.equal(
      parsed.visuals.readerWidth,
      'wide',
    )

    assert.equal(
      parsed.visuals.panel,
      null,
    )
  },
)
