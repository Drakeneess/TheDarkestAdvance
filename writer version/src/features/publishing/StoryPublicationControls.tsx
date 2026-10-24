import type {
  Story,
} from '../../domain/models'

import {
  useStoryPublishing,
} from './useStoryPublishing'

interface StoryPublicationControlsProps {
  story: Story
}

function formatUpdatedAt(
  value: string | null,
) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleString()
}

export function StoryPublicationControls({
  story,
}: StoryPublicationControlsProps) {
  const publication =
    useStoryPublishing({
      storyId: story.id,
    })

  const busy =
    publication.statusLoading ||
    publication.publishing ||
    publication.unpublishing ||
    publication.resolvingConflict

  function handleUnpublish() {
    const accepted =
      window.confirm(
        `¿Despublicar “${story.title}”?\n\nLa historia y todos sus capítulos dejarán de estar disponibles en el Codex público. Los datos del Writer no se eliminan.`,
      )

    if (!accepted) {
      return
    }

    void publication.unpublish()
  }

  return (
    <section className="story-publication-card">
      <div className="story-publication-heading">
        <div>
          <span>
            Publicación
          </span>

          <strong>
            {publication.statusLoading
              ? 'Consultando…'
              : publication.published
                ? 'Publicado'
                : 'No publicado'}
          </strong>
        </div>

        {publication.published && (
          <span className="published-badge">
            Público
          </span>
        )}
      </div>

      {publication.published && (
        <div className="story-publication-meta">
          <div>
            <span>Slug</span>
            <strong>
              {publication.publishedSlug ??
                story.slug}
            </strong>
          </div>

          <div>
            <span>Actualizado</span>
            <strong>
              {formatUpdatedAt(
                publication.publishedUpdatedAt,
              )}
            </strong>
          </div>
        </div>
      )}

      <div className="story-publication-actions">
        <button
          type="button"
          className="story-publish-button"
          disabled={busy}
          onClick={() => {
            void publication.publish()
          }}
        >
          {publication.publishing
            ? 'Publicando…'
            : publication.published
              ? 'Publicar cambios'
              : 'Publicar historia'}
        </button>

        {publication.published && (
          <button
            type="button"
            className="story-unpublish-button"
            disabled={busy}
            onClick={
              handleUnpublish
            }
          >
            {publication.unpublishing
              ? 'Despublicando…'
              : 'Despublicar'}
          </button>
        )}
      </div>

      {publication.feedback && (
        <div
          className={[
            'publication-feedback',
            'story-publication-feedback',
            publication.feedback.kind,
          ].join(' ')}
        >
          <div>
            {publication.feedback.message}
          </div>

          {publication.feedback.kind ===
            'conflict' &&
          publication.feedback
            .conflictTarget && (
            <div className="publication-conflict-resolution">
              <p>
                Decide qué versión de la historia debe continuar antes de volver a publicar.
              </p>

              <div className="publication-conflict-actions">
                <button
                  type="button"
                  disabled={
                    publication.resolvingConflict
                  }
                  onClick={() => {
                    void publication.resolvePublicationConflict(
                      'keep-local',
                    )
                  }}
                >
                  Conservar local
                </button>

                <button
                  type="button"
                  disabled={
                    publication.resolvingConflict ||
                    !publication.feedback
                      ?.conflictTarget
                      ?.hasServerRecord
                  }
                  onClick={() => {
                    void publication.resolvePublicationConflict(
                      'use-server',
                    )
                  }}
                >
                  Usar servidor
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
