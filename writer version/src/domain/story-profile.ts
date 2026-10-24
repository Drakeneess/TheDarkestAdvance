export type StoryStatus =
  | 'ongoing'
  | 'completed'
  | 'hiatus'

export type StoryReaderWidth =
  | 'narrow'
  | 'standard'
  | 'wide'

export interface StoryProfile {
  subtitle: string
  authorName: string
  status: StoryStatus
  language: string
  genres: string[]
  tags: string[]
  contentRating: string | null
}

export interface StoryAssets {
  coverImageUrl: string | null
  heroImageUrl: string | null
  logoImageUrl: string | null
}

/**
 * Overrides editoriales seguros.
 *
 * Este contrato no acepta CSS arbitrario.
 * El Codex decide cómo resolver estas claves
 * y valores dentro de sus presets visuales.
 */
export interface StoryVisuals {
  accent: string | null
  accentSoft: string | null
  background: string | null
  panel: string | null
  displayFontKey: string | null
  bodyFontKey: string | null
  ornamentKey: string | null
  textureKey: string | null
  readerWidth: StoryReaderWidth
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  )
}

function normalizeText(
  value: unknown,
) {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function normalizeOptionalText(
  value: unknown,
) {
  const normalized =
    normalizeText(value)

  return normalized.length > 0
    ? normalized
    : null
}

function normalizeStringList(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === 'string',
        )
        .map(
          (item) => item.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function normalizeStoryStatus(
  value: unknown,
): StoryStatus {
  switch (value) {
    case 'completed':
    case 'hiatus':
    case 'ongoing':
      return value

    default:
      return 'ongoing'
  }
}

function normalizeReaderWidth(
  value: unknown,
): StoryReaderWidth {
  switch (value) {
    case 'narrow':
    case 'wide':
    case 'standard':
      return value

    default:
      return 'standard'
  }
}

export function createDefaultStoryProfile(): StoryProfile {
  return {
    subtitle: '',
    authorName: '',
    status: 'ongoing',
    language: 'es',
    genres: [],
    tags: [],
    contentRating: null,
  }
}

export function createDefaultStoryAssets(): StoryAssets {
  return {
    coverImageUrl: null,
    heroImageUrl: null,
    logoImageUrl: null,
  }
}

export function createDefaultStoryVisuals(): StoryVisuals {
  return {
    accent: null,
    accentSoft: null,
    background: null,
    panel: null,
    displayFontKey: null,
    bodyFontKey: null,
    ornamentKey: null,
    textureKey: null,
    readerWidth: 'standard',
  }
}

export function normalizeStoryProfile(
  value: unknown,
): StoryProfile {
  if (!isRecord(value)) {
    return createDefaultStoryProfile()
  }

  return {
    subtitle:
      normalizeText(
        value.subtitle,
      ),

    authorName:
      normalizeText(
        value.authorName,
      ),

    status:
      normalizeStoryStatus(
        value.status,
      ),

    language:
      normalizeText(
        value.language,
      ) || 'es',

    genres:
      normalizeStringList(
        value.genres,
      ),

    tags:
      normalizeStringList(
        value.tags,
      ),

    contentRating:
      normalizeOptionalText(
        value.contentRating,
      ),
  }
}

export function normalizeStoryAssets(
  value: unknown,
): StoryAssets {
  if (!isRecord(value)) {
    return createDefaultStoryAssets()
  }

  return {
    coverImageUrl:
      normalizeOptionalText(
        value.coverImageUrl,
      ),

    heroImageUrl:
      normalizeOptionalText(
        value.heroImageUrl,
      ),

    logoImageUrl:
      normalizeOptionalText(
        value.logoImageUrl,
      ),
  }
}

export function normalizeStoryVisuals(
  value: unknown,
): StoryVisuals {
  if (!isRecord(value)) {
    return createDefaultStoryVisuals()
  }

  return {
    accent:
      normalizeOptionalText(
        value.accent,
      ),

    accentSoft:
      normalizeOptionalText(
        value.accentSoft,
      ),

    background:
      normalizeOptionalText(
        value.background,
      ),

    panel:
      normalizeOptionalText(
        value.panel,
      ),

    displayFontKey:
      normalizeOptionalText(
        value.displayFontKey,
      ),

    bodyFontKey:
      normalizeOptionalText(
        value.bodyFontKey,
      ),

    ornamentKey:
      normalizeOptionalText(
        value.ornamentKey,
      ),

    textureKey:
      normalizeOptionalText(
        value.textureKey,
      ),

    readerWidth:
      normalizeReaderWidth(
        value.readerWidth,
      ),
  }
}
