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
  resolveSyncConflict,
  SyncConflictResolutionError,
} from '../../sync/conflict-resolution'

import type {
  SyncConflictResolutionStrategy,
} from '../../sync/conflict-resolution'

import {
  getChapterPublicationStatusCommand,
  unpublishChapterCommand,
} from './publishing.client'

import {
  publishChapterVersionFromWriter,
  PublishingPreflightError,
} from './publishing.service'

import type {
  PublishingConflictTarget,
} from './publishing.service'

export interface PublicationFeedback {
  kind:
    | 'success'
    | 'error'
    | 'conflict'

  message: string

  conflictTarget?:
    PublishingConflictTarget
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
    resolvingConflict,
    setResolvingConflict,
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
      unpublishing ||
      resolvingConflict
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

      if (
        error instanceof
          PublishingPreflightError &&
        error.code ===
          'SYNC_CONFLICT' &&
        error.conflictTarget
      ) {
        setFeedback({
          kind: 'conflict',
          message:
            error.message,
          conflictTarget:
            error.conflictTarget,
        })

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

  async function resolvePublicationConflict(
    strategy:
      SyncConflictResolutionStrategy,
  ) {
    const target =
      feedback?.kind ===
        'conflict'
        ? feedback.conflictTarget
        : undefined

    if (
      !target ||
      resolvingConflict ||
      publishingVersionId ||
      unpublishing
    ) {
      return
    }

    if (
      strategy ===
        'use-server' &&
      !target.hasServerRecord
    ) {
      return
    }

    const targetKey =
      activeSelectionRef.current

    setResolvingConflict(true)

    try {
      await resolveSyncConflict({
        entityType:
          target.entityType,
        entityId:
          target.entityId,
        strategy,
      })

      if (
        activeSelectionRef.current !==
          targetKey
      ) {
        return
      }

      setFeedback({
        kind: 'success',
        message:
          strategy === 'keep-local'
            ? `${target.label} quedó resincronizada conservando la versión local. Ya puedes intentar publicar otra vez.`
            : `${target.label} quedó actualizada con la versión del servidor. Revisa el contenido y vuelve a publicar cuando corresponda.`,
      })
    } catch (error) {
      if (
        activeSelectionRef.current !==
          targetKey
      ) {
        return
      }

      if (
        error instanceof
          SyncConflictResolutionError &&
        error.code ===
          'SYNC_CONFLICT'
      ) {
        setFeedback({
          kind: 'conflict',
          message:
            error.message,
          conflictTarget:
            target,
        })

        return
      }

      setFeedback({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo resolver el conflicto de sincronización.',
      })
    } finally {
      setResolvingConflict(false)
    }
  }

  async function unpublish() {
    if (
      !storyId ||
      !chapterId ||
      publishingVersionId ||
      unpublishing ||
      resolvingConflict ||
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
    resolvePublicationConflict,
    unpublish,

    publishingVersionId,
    publishedVersionId,

    statusLoading,
    unpublishing,
    resolvingConflict,

    feedback,
  }
}
