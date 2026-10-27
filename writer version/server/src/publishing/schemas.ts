import { z } from 'zod'

const STORY_LAYOUT_MAX_LENGTH =
  100_000

const unsafeHtmlPatterns = [
  /<\s*script\b/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*form\b/i,
  /<\s*input\b/i,
  /<\s*button\b/i,
  /<\s*textarea\b/i,
  /<\s*select\b/i,
  /<\s*link\b/i,
  /<\s*base\b/i,
  /<\s*meta\b/i,
  /<\s*style\b/i,
  /\son[a-z0-9_-]+\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
]

const unsafeCssPatterns = [
  /@import\b/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /expression\s*\(/i,
  /-moz-binding\s*:/i,
  /url\s*\(\s*['"]?\s*data\s*:\s*text\/html/i,
]

function containsUnsafeHtml(
  value: string,
) {
  return unsafeHtmlPatterns.some(
    (pattern) => pattern.test(value),
  )
}

function containsUnsafeCss(
  value: string,
) {
  return unsafeCssPatterns.some(
    (pattern) => pattern.test(value),
  )
}

const publicAssetUrlSchema =
  z.string().refine(
    (value) => {
      try {
        const url =
          new URL(value)

        return (
          url.protocol === 'http:' ||
          url.protocol === 'https:'
        )
      } catch {
        return false
      }
    },
    {
      message:
        'El asset debe usar una URL pública http/https válida.',
    },
  )

const storyProfileSchema =
  z.object({
    subtitle:
      z.string().default(''),

    authorName:
      z.string().default(''),

    status:
      z
        .enum([
          'ongoing',
          'completed',
          'hiatus',
        ])
        .default('ongoing'),

    language:
      z.string().min(1).default('es'),

    genres:
      z
        .array(z.string())
        .default([]),

    tags:
      z
        .array(z.string())
        .default([]),

    contentRating:
      z
        .string()
        .nullable()
        .default(null),
  })
  .default({
    subtitle: '',
    authorName: '',
    status: 'ongoing',
    language: 'es',
    genres: [],
    tags: [],
    contentRating: null,
  })

const storyAssetsSchema =
  z.object({
    coverImageUrl:
      publicAssetUrlSchema
        .nullable()
        .default(null),

    heroImageUrl:
      publicAssetUrlSchema
        .nullable()
        .default(null),

    logoImageUrl:
      publicAssetUrlSchema
        .nullable()
        .default(null),
  })
  .default({
    coverImageUrl: null,
    heroImageUrl: null,
    logoImageUrl: null,
  })

const storyVisualsSchema =
  z.object({
    accent:
      z
        .string()
        .nullable()
        .default(null),

    accentSoft:
      z
        .string()
        .nullable()
        .default(null),

    background:
      z
        .string()
        .nullable()
        .default(null),

    panel:
      z
        .string()
        .nullable()
        .default(null),

    displayFontKey:
      z
        .string()
        .nullable()
        .default(null),

    bodyFontKey:
      z
        .string()
        .nullable()
        .default(null),

    ornamentKey:
      z
        .string()
        .nullable()
        .default(null),

    textureKey:
      z
        .string()
        .nullable()
        .default(null),

    readerWidth:
      z
        .enum([
          'narrow',
          'standard',
          'wide',
        ])
        .default('standard'),
  })
  .default({
    accent: null,
    accentSoft: null,
    background: null,
    panel: null,
    displayFontKey: null,
    bodyFontKey: null,
    ornamentKey: null,
    textureKey: null,
    readerWidth: 'standard',
  })

export const storyLayoutSchema =
  z.object({
    mode:
      z
        .enum([
          'preset',
          'custom',
        ])
        .default('preset'),

    html:
      z
        .string()
        .max(STORY_LAYOUT_MAX_LENGTH)
        .default(''),

    css:
      z
        .string()
        .max(STORY_LAYOUT_MAX_LENGTH)
        .default(''),
  })
  .superRefine(
    (layout, context) => {
      if (layout.mode !== 'custom') {
        return
      }

      if (containsUnsafeHtml(layout.html)) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: ['html'],
          message:
            'El HTML personalizado contiene elementos activos o URLs no permitidas.',
        })
      }

      if (containsUnsafeCss(layout.css)) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: ['css'],
          message:
            'El CSS personalizado contiene construcciones no permitidas.',
        })
      }
    },
  )
  .default({
    mode: 'preset',
    html: '',
    css: '',
  })

export const publishableStorySchema =
  z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string(),
    description: z.string(),
    themeKey: z.string().min(1),
    profile: storyProfileSchema,
    assets: storyAssetsSchema,
    visuals: storyVisualsSchema,
    layout: storyLayoutSchema,
  }).passthrough()

export const publishableChapterSchema =
  z.object({
    id: z.string().min(1),
    storyId: z.string().min(1),
    slug: z.string().min(1),
    title: z.string(),
    order: z.number().int(),
  }).passthrough()

export const publishableVersionSchema =
  z.object({
    id: z.string().min(1),
    chapterId: z.string().min(1),
    content: z.string(),
  }).passthrough()
