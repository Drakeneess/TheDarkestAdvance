import {
  useEffect,
  useRef,
  useState,
} from 'react'

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
  getStoryPublicationStatusCommand,
  unpublishStoryCommand,
} from './publishing.client'

import {
  PublishingPreflightError,
} from './publishing.service'

import type {
  PublishingConflictTarget,
} from './publishing.service'

import {
  publishStoryFromWriter,
} from './story-publishing.service'

export interface StoryPublicationFeedback {
  kind:
    | 'success'
    | 'error'
    | 'conflict'

  message: string

  conflictTarget?:
    PublishingConflictTarget
}

interface UseStoryPublishingInput {
  storyId:
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

export function useStoryPublishing({
  storyId,
}: UseStoryPublishingInput) {
  const [
    publishing,
    setPublishing,
  ] = useState(false)

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
    published,
    setPublished,
  ] = useState(false)

  const [
    publishedSlug,
    setPublishedSlug,
  ] = useState<string | null>(
    null,
  )

  const [
    publishedUpdatedAt,
    setPublishedUpdatedAt,
  ] = useState<string | null>(
    null,
  )

  const [
    feedback,
    setFeedback,
  ] = useState<
    StoryPublicationFeedback
    | null
  >(null)

  const activeStoryRef =
    useRef<string | null>(
      storyId,
    )

  activeStoryRef.current =
    storyId

  useEffect(
    () => {
      setPublished(false)
      setPublishedSlug(null)
      setPublishedUpdatedAt(null)
      setFeedback(null)

      if (!storyId) {
        setStatusLoading(false)
        return
      }

      const controller =
        new AbortController()

      const targetStoryId =
        storyId

      setStatusLoading(true)

      void getStoryPublicationStatusCommand(
        {
          workspaceId:
            getWorkspaceId(),

          storyId:
            targetStoryId,
        },
        controller.signal,
      )
        .then((status) => {
          if (
            activeStoryRef.current !==
              targetStoryId
          ) {
            return
          }

          setPublished(
            status.published,
          )

          setPublishedSlug(
            status.story?.slug ?? null,
          )

          setPublishedUpdatedAt(
            status.story?.updatedAt ??
              null,
          )
        })
        .catch((error) => {
          if (
            isAbortError(error) ||
            activeStoryRef.current !==
              targetStoryId
          ) {
            return
          }

          setFeedback({
            kind: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'No se pudo consultar el estado de publicación de la historia.',
          })
        })
        .finally(() => {
          if (
            activeStoryRef.current ===
              targetStoryId
          ) {
            setStatusLoading(false)
          }
        })

      return () => {
        controller.abort()
      }
    },
    [storyId],
  )

  async function publish() {
    if (
      !storyId ||
      publishing ||
      unpublishing ||
      resolvingConflict
    ) {
      return
    }

    const targetStoryId =
      storyId

    setPublishing(true)
    setFeedback(null)

    try {
      const result =
        await publishStoryFromWriter(
          targetStoryId,
        )

      if (
        activeStoryRef.current !==
          targetStoryId
      ) {
        return
      }

      setPublished(true)
      setPublishedSlug(
        result.story.slug,
      )
      setPublishedUpdatedAt(
        result.story.updatedAt,
      )

      setFeedback({
        kind: 'success',
        message:
          'Los datos públicos de la historia quedaron actualizados.',
      })
    } catch (error) {
      if (
        activeStoryRef.current !==
          targetStoryId
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
          message: error.message,
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
            : 'No se pudo publicar la historia.',
      })
    } finally {
      setPublishing(false)
    }
  }

  async function resolvePublicationConflict(
    strategy:
      SyncConflictResolutionStrategy,
  ) {
    const target =
      feedback?.kind === 'conflict'
        ? feedback.conflictTarget
        : undefined

    if (
      !target ||
      resolvingConflict ||
      publishing ||
      unpublishing
    ) {
      return
    }

    if (
      strategy === 'use-server' &&
      !target.hasServerRecord
    ) {
      return
    }

    const targetStoryId =
      activeStoryRef.current

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
        activeStoryRef.current !==
          targetStoryId
      ) {
        return
      }

      setFeedback({
        kind: 'success',
        message:
          strategy === 'keep-local'
            ? 'La historia quedó resincronizada conservando la versión local. Ya puedes publicar otra vez.'
            : 'La historia quedó actualizada con la versión del servidor. Revisa sus datos antes de publicar.',
      })
    } catch (error) {
      if (
        activeStoryRef.current !==
          targetStoryId
      ) {
        return
      }

      if (
        error instanceof
          SyncConflictResolutionError &&
        error.code === 'SYNC_CONFLICT'
      ) {
        setFeedback({
          kind: 'conflict',
          message: error.message,
          conflictTarget: target,
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
      publishing ||
      unpublishing ||
      resolvingConflict ||
      !published
    ) {
      return
    }

    const targetStoryId =
      storyId

    setUnpublishing(true)
    setFeedback(null)

    try {
      const result =
        await unpublishStoryCommand({
          workspaceId:
            getWorkspaceId(),

          storyId:
            targetStoryId,
        })

      if (
        activeStoryRef.current !==
          targetStoryId
      ) {
        return
      }

      setPublished(false)
      setPublishedSlug(null)
      setPublishedUpdatedAt(null)

      setFeedback({
        kind: 'success',
        message:
          result.unpublished
            ? 'La historia y sus capítulos quedaron despublicados.'
            : 'La historia ya no estaba publicada.',
      })
    } catch (error) {
      if (
        activeStoryRef.current !==
          targetStoryId
      ) {
        return
      }

      setFeedback({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo despublicar la historia.',
      })
    } finally {
      setUnpublishing(false)
    }
  }

  return {
    publish,
    unpublish,
    resolvePublicationConflict,

    published,
    publishedSlug,
    publishedUpdatedAt,

    statusLoading,
    publishing,
    unpublishing,
    resolvingConflict,

    feedback,
  }
}
