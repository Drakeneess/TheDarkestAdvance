import { z } from 'zod'

export const syncEntityTypeSchema =
  z.enum([
    'story',
    'chapter',
    'chapterVersion',
  ])

const syncMetadataSchema = {
  revision:
    z.number().int().positive(),

  deletedAt:
    z.string().datetime().nullable(),
}

const storySchema =
  z.object({
    id: z.string().min(1),

    title:
      z.string(),

    description:
      z.string(),

    createdAt:
      z.string().datetime(),

    updatedAt:
      z.string().datetime(),

    ...syncMetadataSchema,
  }).passthrough()

const chapterSchema =
  z.object({
    id: z.string().min(1),

    storyId:
      z.string().min(1),

    title:
      z.string(),

    order:
      z.number(),

    currentVersionId:
      z.string().nullable(),

    draftContent:
      z.string().optional(),

    draftUpdatedAt:
      z
        .string()
        .datetime()
        .nullable()
        .optional(),

    createdAt:
      z.string().datetime(),

    updatedAt:
      z.string().datetime(),

    ...syncMetadataSchema,
  }).passthrough()

const chapterVersionSchema =
  z.object({
    id: z.string().min(1),

    chapterId:
      z.string().min(1),

    parentVersionId:
      z.string().nullable(),

    label:
      z.string(),

    content:
      z.string(),

    createdAt:
      z.string().datetime(),

    updatedAt:
      z.string().datetime(),

    deviceId:
      z.string().min(1),

    ...syncMetadataSchema,
  }).passthrough()

const serverVersionSchema =
  z
    .string()
    .regex(/^\d+$/)

export const syncMutationSchema =
  z.discriminatedUnion(
    'entityType',
    [
      z.object({
        mutationId:
          z.string().min(1),

        entityType:
          z.literal('story'),

        entityId:
          z.string().min(1),

        clientRevision:
          z.number().int().positive(),

        baseServerVersion:
          serverVersionSchema.nullable(),

        payload:
          storySchema,
      }),

      z.object({
        mutationId:
          z.string().min(1),

        entityType:
          z.literal('chapter'),

        entityId:
          z.string().min(1),

        clientRevision:
          z.number().int().positive(),

        baseServerVersion:
          serverVersionSchema.nullable(),

        payload:
          chapterSchema,
      }),

      z.object({
        mutationId:
          z.string().min(1),

        entityType:
          z.literal(
            'chapterVersion',
          ),

        entityId:
          z.string().min(1),

        clientRevision:
          z.number().int().positive(),

        baseServerVersion:
          serverVersionSchema.nullable(),

        payload:
          chapterVersionSchema,
      }),
    ],
  )

export const syncExchangeRequestSchema =
  z.object({
    protocolVersion:
      z.literal(1),

    workspaceId:
      z.string().min(1),

    deviceId:
      z.string().min(1),

    cursor:
      z.string().nullable(),

    mutations:
      z.array(
        syncMutationSchema,
      ),

    maxChanges:
      z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional(),
  })

export type SyncMutationInput =
  z.infer<
    typeof syncMutationSchema
  >

export type SyncExchangeRequestInput =
  z.infer<
    typeof syncExchangeRequestSchema
  >
