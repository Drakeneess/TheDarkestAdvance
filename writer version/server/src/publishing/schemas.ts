import { z } from 'zod'

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
