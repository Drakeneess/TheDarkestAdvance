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
  'publishable story keeps profile and layout fields backward compatible',
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

    assert.deepEqual(
      result.data.layout,
      {
        mode: 'preset',
        html: '',
        css: '',
      },
    )
  },
)

test(
  'custom layout rejects active HTML payloads',
  () => {
    const payloads = [
      '<script>alert(1)</script>',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">bad</a>',
      '<iframe src="https://example.com"></iframe>',
    ]

    for (const html of payloads) {
      const result =
        publishableStorySchema.safeParse({
          ...storyPayload(),
          layout: {
            mode: 'custom',
            html,
            css: '',
          },
        })

      assert.equal(
        result.success,
        false,
        `se aceptó HTML activo: ${html}`,
      )
    }
  },
)

test(
  'custom layout rejects active CSS payloads',
  () => {
    const payloads = [
      '@import url("https://example.com/a.css");',
      '.x { background: url("javascript:alert(1)"); }',
      '.x { behavior: expression(alert(1)); }',
      '.x { -moz-binding: url("https://example.com/x.xml#x"); }',
    ]

    for (const css of payloads) {
      const result =
        publishableStorySchema.safeParse({
          ...storyPayload(),
          layout: {
            mode: 'custom',
            html: '<main>safe</main>',
            css,
          },
        })

      assert.equal(
        result.success,
        false,
        `se aceptó CSS activo: ${css}`,
      )
    }
  },
)

test(
  'custom layout permits global selectors because Codex isolates them in the sandbox',
  () => {
    const result =
      publishableStorySchema.safeParse({
        ...storyPayload(),
        layout: {
          mode: 'custom',
          html:
            '<main class="story-shell">{{story.title}}</main>',
          css:
            ':root, html, body, * { box-sizing: border-box; } body { margin: 0; }',
        },
      })

    assert.equal(
      result.success,
      true,
    )
  },
)

test(
  'empty custom layout stays publishable so Codex can fall back to preset',
  () => {
    const result =
      publishableStorySchema.safeParse({
        ...storyPayload(),
        layout: {
          mode: 'custom',
          html: '   ',
          css: 'body { margin: 0; }',
        },
      })

    assert.equal(
      result.success,
      true,
    )
  },
)
