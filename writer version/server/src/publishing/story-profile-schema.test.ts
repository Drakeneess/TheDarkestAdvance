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

    assert.deepEqual(
      parsed.layout,
      {
        mode: 'preset',
        html: '',
        css: '',
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

test(
  'publishableStorySchema acepta HTML y CSS personalizados pasivos',
  () => {
    const parsed =
      publishableStorySchema.parse({
        ...baseStory,
        layout: {
          mode: 'custom',
          html:
            '<main><h1>{{story.title}}</h1><section>{{chapters}}</section></main>',
          css:
            '.hero { min-height: 70vh; background: var(--story-background); }',
        },
      })

    assert.equal(
      parsed.layout.mode,
      'custom',
    )

    assert.match(
      parsed.layout.html,
      /story\.title/,
    )
  },
)

for (
  const html
    of [
      '<script>alert(1)</script>',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">x</a>',
      '<iframe src="https://example.com"></iframe>',
    ]
) {
  test(
    `publishableStorySchema rechaza HTML activo: ${html.slice(0, 24)}`,
    () => {
      const parsed =
        publishableStorySchema.safeParse({
          ...baseStory,
          layout: {
            mode: 'custom',
            html,
            css: '',
          },
        })

      assert.equal(
        parsed.success,
        false,
      )
    },
  )
}

for (
  const css
    of [
      '@import url("https://evil.test/x.css");',
      '.x { background: url(javascript:alert(1)); }',
      '.x { width: expression(alert(1)); }',
    ]
) {
  test(
    `publishableStorySchema rechaza CSS activo: ${css.slice(0, 24)}`,
    () => {
      const parsed =
        publishableStorySchema.safeParse({
          ...baseStory,
          layout: {
            mode: 'custom',
            html: '<main>safe</main>',
            css,
          },
        })

      assert.equal(
        parsed.success,
        false,
      )
    },
  )
}
