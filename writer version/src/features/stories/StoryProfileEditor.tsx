import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import type {
  Story,
} from '../../domain/models'

import type {
  StoryStatus,
} from '../../domain/story-profile'

import {
  StoryPublicationControls,
} from '../publishing/StoryPublicationControls'

import {
  updateStoryEditorialProfile,
} from './stories.service'

interface StoryProfileEditorProps {
  story: Story
  onClose: () => void
}

function listToText(
  values: string[],
) {
  return values.join(', ')
}

function textToList(
  value: string,
) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map(
          (item) => item.trim(),
        )
        .filter(Boolean),
    ),
  )
}

export function StoryProfileEditor({
  story,
  onClose,
}: StoryProfileEditorProps) {
  const [title, setTitle] =
    useState(story.title)

  const [subtitle, setSubtitle] =
    useState(
      story.profile.subtitle,
    )

  const [description, setDescription] =
    useState(story.description)

  const [authorName, setAuthorName] =
    useState(
      story.profile.authorName,
    )

  const [status, setStatus] =
    useState<StoryStatus>(
      story.profile.status,
    )

  const [language, setLanguage] =
    useState(
      story.profile.language,
    )

  const [contentRating, setContentRating] =
    useState(
      story.profile.contentRating ?? '',
    )

  const [genresText, setGenresText] =
    useState(
      listToText(
        story.profile.genres,
      ),
    )

  const [tagsText, setTagsText] =
    useState(
      listToText(
        story.profile.tags,
      ),
    )

  const [savedMessage, setSavedMessage] =
    useState<string | null>(null)

  const genres =
    useMemo(
      () => textToList(genresText),
      [genresText],
    )

  const tags =
    useMemo(
      () => textToList(tagsText),
      [tagsText],
    )

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [onClose])

  function submit() {
    updateStoryEditorialProfile(
      story,
      {
        title,
        description,
        subtitle,
        authorName,
        status,
        language,
        genres,
        tags,
        contentRating:
          contentRating.trim() || null,
      },
    )

    setSavedMessage(
      'Ficha guardada localmente.',
    )
  }

  return createPortal(
    <div
      className="story-profile-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <section
        className="story-profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-profile-title"
      >
        <header className="story-profile-header">
          <div>
            <span>
              Historia
            </span>

            <h2 id="story-profile-title">
              {story.title}
            </h2>
          </div>

          <button
            type="button"
            className="story-profile-close"
            aria-label="Cerrar ficha"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="story-profile-tabs">
          <button
            type="button"
            className="active"
          >
            Ficha
          </button>

          <button
            type="button"
            disabled
            title="Disponible en la siguiente fase"
          >
            Identidad
          </button>
        </div>

        <div className="story-profile-content">
          <form
            className="story-profile-form"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <section className="story-profile-section">
              <div className="story-profile-section-heading">
                <span>01</span>
                <h3>Información</h3>
              </div>

              <label>
                <span>Título</span>
                <input
                  required
                  value={title}
                  onChange={(event) => {
                    setTitle(
                      event.target.value,
                    )
                    setSavedMessage(null)
                  }}
                />
              </label>

              <label>
                <span>Subtítulo</span>
                <input
                  value={subtitle}
                  placeholder="Opcional"
                  onChange={(event) => {
                    setSubtitle(
                      event.target.value,
                    )
                    setSavedMessage(null)
                  }}
                />
              </label>

              <label>
                <span>Autor visible</span>
                <input
                  value={authorName}
                  placeholder="Opcional"
                  onChange={(event) => {
                    setAuthorName(
                      event.target.value,
                    )
                    setSavedMessage(null)
                  }}
                />
              </label>
            </section>

            <section className="story-profile-section">
              <div className="story-profile-section-heading">
                <span>02</span>
                <h3>Sinopsis</h3>
              </div>

              <label>
                <span>Descripción pública</span>
                <textarea
                  rows={7}
                  value={description}
                  placeholder="Describe la obra sin convertir esto en la contraportada de una edición escolar."
                  onChange={(event) => {
                    setDescription(
                      event.target.value,
                    )
                    setSavedMessage(null)
                  }}
                />
              </label>
            </section>

            <section className="story-profile-section story-profile-grid-section">
              <div className="story-profile-section-heading">
                <span>03</span>
                <h3>Clasificación</h3>
              </div>

              <div className="story-profile-fields-grid">
                <label>
                  <span>Estado</span>
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(
                        event.target.value as StoryStatus,
                      )
                      setSavedMessage(null)
                    }}
                  >
                    <option value="ongoing">
                      En publicación
                    </option>
                    <option value="completed">
                      Completada
                    </option>
                    <option value="hiatus">
                      En pausa
                    </option>
                  </select>
                </label>

                <label>
                  <span>Idioma</span>
                  <input
                    value={language}
                    placeholder="es"
                    onChange={(event) => {
                      setLanguage(
                        event.target.value,
                      )
                      setSavedMessage(null)
                    }}
                  />
                </label>

                <label>
                  <span>Clasificación</span>
                  <input
                    value={contentRating}
                    placeholder="Ej. 16+"
                    onChange={(event) => {
                      setContentRating(
                        event.target.value,
                      )
                      setSavedMessage(null)
                    }}
                  />
                </label>
              </div>
            </section>

            <section className="story-profile-section">
              <div className="story-profile-section-heading">
                <span>04</span>
                <h3>Taxonomía</h3>
              </div>

              <label>
                <span>Géneros</span>
                <input
                  value={genresText}
                  placeholder="Fantasía urbana, psicológico"
                  onChange={(event) => {
                    setGenresText(
                      event.target.value,
                    )
                    setSavedMessage(null)
                  }}
                />
                <small>
                  Separados por comas.
                </small>
              </label>

              <label>
                <span>Etiquetas</span>
                <input
                  value={tagsText}
                  placeholder="TCC, magia, Filadelfia"
                  onChange={(event) => {
                    setTagsText(
                      event.target.value,
                    )
                    setSavedMessage(null)
                  }}
                />
                <small>
                  Separadas por comas.
                </small>
              </label>

              {(genres.length > 0 ||
                tags.length > 0) && (
                <div className="story-profile-chip-preview">
                  {genres.map(
                    (genre) => (
                      <span
                        key={`genre:${genre}`}
                        className="genre"
                      >
                        {genre}
                      </span>
                    ),
                  )}

                  {tags.map(
                    (tag) => (
                      <span
                        key={`tag:${tag}`}
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              )}
            </section>

            <footer className="story-profile-form-footer">
              <div>
                {savedMessage ??
                  'Los cambios se guardan en Writer. Publicarlos es una acción separada.'}
              </div>

              <button
                type="submit"
                className="story-profile-save"
              >
                Guardar ficha
              </button>
            </footer>
          </form>

          <aside className="story-profile-publication-column">
            <div className="story-profile-section-heading">
              <span>05</span>
              <h3>Publicación</h3>
            </div>

            <p>
              Publica la metadata actual de la obra sin crear ni modificar versiones de capítulos.
            </p>

            <StoryPublicationControls
              story={story}
            />
          </aside>
        </div>
      </section>
    </div>,
    document.body,
  )
}
