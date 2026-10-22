import {
  useState,
} from 'react'

import type {
  ChapterVersion,
} from '../../domain/models'

import {
  publishChapterVersionFromWriter,
} from './publishing.service'

export interface PublicationFeedback {
  kind:
    | 'success'
    | 'error'

  message: string
}

interface UseChapterPublishingInput {
  storyId:
    | string
    | null

  chapterId:
    | string
    | null
}

export function useChapterPublishing({
  storyId,
  chapterId,
}: UseChapterPublishingInput) {
  const [
    publishingVersionId,
    setPublishingVersionId,
  ] = useState<string | null>(
    null,
  )

  const [
    publishedByChapter,
    setPublishedByChapter,
  ] = useState<
    Record<string, string>
  >({})

  const [
    feedback,
    setFeedback,
  ] = useState<
    (
      PublicationFeedback & {
        chapterId: string
      }
    )
    | null
  >(null)

  async function publishVersion(
    version: ChapterVersion,
  ) {
    if (
      !storyId ||
      !chapterId ||
      publishingVersionId
    ) {
      return
    }

    const targetChapterId =
      chapterId

    setPublishingVersionId(
      version.id,
    )

    setFeedback(null)

    try {
      const result =
        await publishChapterVersionFromWriter({
          storyId,
          chapterId:
            targetChapterId,
          sourceVersionId:
            version.id,
        })

      setPublishedByChapter(
        (current) => ({
          ...current,

          [targetChapterId]:
            result.chapter
              .sourceVersionId,
        }),
      )

      setFeedback({
        chapterId:
          targetChapterId,

        kind: 'success',

        message:
          `“${version.label}” quedó publicada.`,
      })
    } catch (error) {
      setFeedback({
        chapterId:
          targetChapterId,

        kind: 'error',

        message:
          error instanceof Error
            ? error.message
            : 'No se pudo publicar la versión seleccionada.',
      })
    } finally {
      setPublishingVersionId(
        null,
      )
    }
  }

  return {
    publishVersion,

    publishingVersionId,

    publishedVersionId:
      chapterId
        ? (
            publishedByChapter[
              chapterId
            ] ?? null
          )
        : null,

    feedback:
      feedback?.chapterId ===
        chapterId
        ? {
            kind:
              feedback.kind,

            message:
              feedback.message,
          }
        : null,
  }
}
