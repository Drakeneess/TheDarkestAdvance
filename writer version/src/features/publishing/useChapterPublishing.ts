import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  ChapterVersion,
} from '../../domain/models'

import {
  getWorkspaceId,
} from '../../sync/config'

import {
  getChapterPublicationStatusCommand,
  unpublishChapterCommand,
} from './publishing.client'

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

function isAbortError(
  error: unknown,
) {
  return (
    error instanceof DOMException &&
    error.name === 'AbortError'
  )
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
    unpublishing,
    setUnpublishing,
  ] = useState(false)

  const [
    statusLoading,
    setStatusLoading,
  ] = useState(false)

  const [
    publishedVersionId,
    setPublishedVersionId,
  ] = useState<string | null>(
    null,
  )

  const [
    feedback,
    setFeedback,
  ] = useState<
    PublicationFeedback
    | null
  >(null)

  const selectionKey =
    storyId && chapterId
      ? `${storyId}:${chapterId}`
      : null

  const activeSelectionRef =
    useRef<string | null>(
      selectionKey,
    )

  activeSelectionRef.current =
    selectionKey

  useEffect(
    () => {
      setPublishedVersionId(
        null,
      )

      setFeedback(null)

      if (
        !storyId ||
        !chapterId
      ) {
        setStatusLoading(false)
        return
      }

      const controller =
        new AbortController()

      const targetKey =
        `${storyId}:${chapterId}`

      setStatusLoading(true)

      void getChapterPublicationStatusCommand(
        {
          workspaceId:
            getWorkspaceId(),

          storyId,
          chapterId,
        },
        controller.signal,
      )
        .then((status) => {
          if (
            activeSelectionRef
              .current !==
              targetKey
          ) {
            return
          }

          setPublishedVersionId(
            status.chapter
              ?.sourceVersionId ??
              null,
          )
        })
        .catch((error) => {
          if (
            isAbortError(error) ||
            activeSelectionRef
              .current !==
              targetKey
          ) {
            return
          }

          setFeedback({
            kind: 'error',

            message:
              error instanceof Error
                ? error.message
                : 'No se pudo consultar el estado de publicación.',
          })
        })
        .finally(() => {
          if (
            activeSelectionRef
              .current ===
              targetKey
          ) {
            setStatusLoading(
              false,
            )
          }
        })

      return () => {
        controller.abort()
      }
    },
    [
      storyId,
      chapterId,
    ],
  )

  async function publishVersion(
    version: ChapterVersion,
  ) {
    if (
      !storyId ||
      !chapterId ||
      publishingVersionId ||
      unpublishing
    ) {
      return
    }

    const targetKey =
      `${storyId}:${chapterId}`

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

      if (
        activeSelectionRef.current !==
          targetKey
      ) {
        return
      }

      setPublishedVersionId(
        result.chapter
          .sourceVersionId,
      )

      setFeedback({
        kind: 'success',

        message:
          `“${version.label}” quedó publicada.`,
      })
    } catch (error) {
      if (
        activeSelectionRef.current !==
          targetKey
      ) {
        return
      }

      setFeedback({
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

  async function unpublish() {
    if (
      !storyId ||
      !chapterId ||
      publishingVersionId ||
      unpublishing ||
      !publishedVersionId
    ) {
      return
    }

    const targetKey =
      `${storyId}:${chapterId}`

    setUnpublishing(true)
    setFeedback(null)

    try {
      const result =
        await unpublishChapterCommand({
          workspaceId:
            getWorkspaceId(),

          storyId,
          chapterId,
        })

      if (
        activeSelectionRef.current !==
          targetKey
      ) {
        return
      }

      setPublishedVersionId(
        null,
      )

      setFeedback({
        kind: 'success',

        message:
          result.unpublished
            ? 'El capítulo quedó despublicado.'
            : 'El capítulo ya no estaba publicado.',
      })
    } catch (error) {
      if (
        activeSelectionRef.current !==
          targetKey
      ) {
        return
      }

      setFeedback({
        kind: 'error',

        message:
          error instanceof Error
            ? error.message
            : 'No se pudo despublicar el capítulo.',
      })
    } finally {
      setUnpublishing(false)
    }
  }

  return {
    publishVersion,
    unpublish,

    publishingVersionId,
    publishedVersionId,

    statusLoading,
    unpublishing,

    feedback,
  }
}
