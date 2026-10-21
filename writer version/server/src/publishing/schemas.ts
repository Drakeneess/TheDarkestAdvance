import { z } from 'zod'

export const publishableStorySchema =
  z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string(),
    description: z.string(),
    themeKey: z.string().min(1),
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
