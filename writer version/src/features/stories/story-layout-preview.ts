import type {
  Story,
} from '../../domain/models'

import {
  isStoryHexColor,
} from '../../domain/story-profile'

const STATUS_LABELS = {
  ongoing: 'En publicación',
  completed: 'Completada',
  hiatus: 'En pausa',
} as const

export const STORY_LAYOUT_STARTER_HTML = `<main class="story-shell">
  <section class="hero">
    <p class="eyebrow">{{story.status}}</p>
    <h1>{{story.title}}</h1>
    <p class="subtitle">{{story.subtitle}}</p>
    <p class="description">{{story.description}}</p>
  </section>

  <section class="chapters-section">
    <div class="section-heading">
      <span>ARCHIVO</span>
      <h2>Capítulos</h2>
    </div>

    {{chapters}}
  </section>
</main>`

export const STORY_LAYOUT_STARTER_CSS = `:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  background: var(--story-background);
  color: #f5f7fb;
  font-family: system-ui, sans-serif;
}

.story-shell {
  min-height: 100vh;
}

.hero {
  min-height: 68vh;
  padding: clamp(2rem, 7vw, 7rem);
  display: grid;
  align-content: end;
  gap: 1rem;
  background:
    linear-gradient(180deg, transparent 10%, rgba(0, 0, 0, .9) 100%),
    var(--story-hero-image) center / cover no-repeat,
    var(--story-background);
}

.eyebrow {
  margin: 0;
  color: var(--story-accent);
  font: 700 .75rem/1.2 ui-monospace, monospace;
  letter-spacing: .18em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  max-width: 12ch;
  font-size: clamp(3rem, 10vw, 9rem);
  line-height: .88;
  letter-spacing: -.055em;
}

.subtitle {
  max-width: 46rem;
  color: var(--story-accent-soft);
  font-size: clamp(1.1rem, 2vw, 1.6rem);
}

.description {
  max-width: 48rem;
  color: rgba(245, 247, 251, .72);
  line-height: 1.7;
}

.chapters-section {
  padding: clamp(2rem, 7vw, 7rem);
  background: var(--story-panel);
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--story-accent) 35%, transparent);
}

.section-heading span {
  color: var(--story-accent);
  font: 700 .7rem/1 ui-monospace, monospace;
  letter-spacing: .2em;
}

.codex-chapters {
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
}

.codex-chapters a {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 1rem;
  padding: 1.1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  color: inherit;
  text-decoration: none;
}

.codex-chapters a:hover {
  color: var(--story-accent-soft);
}

.codex-chapter-number {
  color: var(--story-accent);
  font-family: ui-monospace, monospace;
}`

function escapeHtml(
  value: string,
) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeStyleText(
  value: string,
) {
  return value.replace(
    /<\/style/gi,
    '<\\/style',
  )
}

function cssUrl(
  value:
    | string
    | null
    | undefined,
) {
  const normalized =
    value?.trim()

  if (!normalized) {
    return 'none'
  }

  return `url(${JSON.stringify(normalized)})`
}

function previewChapters() {
  return `<ol class="codex-chapters">
  <li><a href="#chapter-1"><span class="codex-chapter-number">01</span><span>Primer capítulo</span></a></li>
  <li><a href="#chapter-2"><span class="codex-chapter-number">02</span><span>Segundo capítulo</span></a></li>
  <li><a href="#chapter-3"><span class="codex-chapter-number">03</span><span>Tercer capítulo</span></a></li>
</ol>`
}

function expandPreviewPlaceholders(
  story: Story,
  html: string,
) {
  const values:
    Record<string, string> = {
    '{{story.title}}':
      escapeHtml(story.title),
    '{{story.subtitle}}':
      escapeHtml(
        story.profile.subtitle,
      ),
    '{{story.description}}':
      escapeHtml(
        story.description,
      ),
    '{{story.author}}':
      escapeHtml(
        story.profile.authorName,
      ),
    '{{story.status}}':
      escapeHtml(
        STATUS_LABELS[
          story.profile.status
        ],
      ),
    '{{story.language}}':
      escapeHtml(
        story.profile.language,
      ),
    '{{story.contentRating}}':
      escapeHtml(
        story.profile.contentRating ??
          '',
      ),
    '{{story.slug}}':
      escapeHtml(story.slug),
    '{{story.coverUrl}}':
      escapeHtml(
        story.assets.coverImageUrl ??
          '',
      ),
    '{{story.heroUrl}}':
      escapeHtml(
        story.assets.heroImageUrl ??
          '',
      ),
    '{{story.logoUrl}}':
      escapeHtml(
        story.assets.logoImageUrl ??
          '',
      ),
    '{{story.genres}}':
      escapeHtml(
        story.profile.genres.join(', '),
      ),
    '{{story.tags}}':
      escapeHtml(
        story.profile.tags.join(', '),
      ),
  }

  let expanded = html

  for (
    const [placeholder, value]
      of Object.entries(values)
  ) {
    expanded =
      expanded.split(
        placeholder,
      ).join(value)
  }

  return expanded.replace(
    /{{chapters}}/g,
    previewChapters(),
  )
}

function storyColor(
  value:
    | string
    | null
    | undefined,
  fallback: string,
) {
  return isStoryHexColor(value)
    ? value.trim()
    : fallback
}

export function buildStoryLayoutPreviewDocument(
  story: Story,
  html: string,
  css: string,
) {
  const accent =
    storyColor(
      story.visuals.accent,
      '#91a8d0',
    )

  const accentSoft =
    storyColor(
      story.visuals.accentSoft,
      '#d3dced',
    )

  const background =
    storyColor(
      story.visuals.background,
      '#090a0e',
    )

  const panel =
    storyColor(
      story.visuals.panel,
      '#111319',
    )

  const variables = `:root {
  --story-accent: ${accent};
  --story-accent-soft: ${accentSoft};
  --story-background: ${background};
  --story-panel: ${panel};
  --story-cover-image: ${cssUrl(story.assets.coverImageUrl)};
  --story-hero-image: ${cssUrl(story.assets.heroImageUrl)};
  --story-logo-image: ${cssUrl(story.assets.logoImageUrl)};
}`

  const content =
    expandPreviewPlaceholders(
      story,
      html,
    )

  return `<!doctype html>
<html lang=${JSON.stringify(story.profile.language || 'es')}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; style-src 'unsafe-inline'; img-src https: http: data:; media-src https: http:; font-src https: http: data:;">
  <style>${safeStyleText(variables)}\n${safeStyleText(css)}</style>
</head>
<body>
${content}
</body>
</html>`
}
