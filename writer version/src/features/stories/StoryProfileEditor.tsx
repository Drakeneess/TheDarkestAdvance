import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  CSSProperties,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import type {
  Story,
} from '../../domain/models'

import type {
  StoryReaderWidth,
  StoryStatus,
} from '../../domain/story-profile'

import {
  StoryPublicationControls,
} from '../publishing/StoryPublicationControls'

import {
  updateStoryEditorialProfile,
  updateStoryVisualIdentity,
} from './stories.service'

interface StoryProfileEditorProps {
  story: Story
  onClose: () => void
}

type StoryEditorTab =
  | 'profile'
  | 'identity'

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

function optionalText(
  value: string,
) {
  const normalized =
    value.trim()

  return normalized || null
}

export function StoryProfileEditor({
  story,
  onClose,
}: StoryProfileEditorProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<StoryEditorTab>(
    'profile',
  )

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

  const [
    profileSavedMessage,
    setProfileSavedMessage,
  ] = useState<string | null>(null)

  const [themeKey, setThemeKey] =
    useState(story.themeKey)

  const [
    coverImageUrl,
    setCoverImageUrl,
  ] = useState(
    story.assets.coverImageUrl ?? '',
  )

  const [
    heroImageUrl,
    setHeroImageUrl,
  ] = useState(
    story.assets.heroImageUrl ?? '',
  )

  const [
    logoImageUrl,
    setLogoImageUrl,
  ] = useState(
    story.assets.logoImageUrl ?? '',
  )

  const [accent, setAccent] =
    useState(
      story.visuals.accent ?? '',
    )

  const [accentSoft, setAccentSoft] =
    useState(
      story.visuals.accentSoft ?? '',
    )

  const [background, setBackground] =
    useState(
      story.visuals.background ?? '',
    )

  const [panel, setPanel] =
    useState(
      story.visuals.panel ?? '',
    )

  const [
    displayFontKey,
    setDisplayFontKey,
  ] = useState(
    story.visuals.displayFontKey ?? '',
  )

  const [
    bodyFontKey,
    setBodyFontKey,
  ] = useState(
    story.visuals.bodyFontKey ?? '',
  )

  const [
    ornamentKey,
    setOrnamentKey,
  ] = useState(
    story.visuals.ornamentKey ?? '',
  )

  const [
    textureKey,
    setTextureKey,
  ] = useState(
    story.visuals.textureKey ?? '',
  )

  const [
    readerWidth,
    setReaderWidth,
  ] = useState<StoryReaderWidth>(
    story.visuals.readerWidth,
  )

  const [
    identitySavedMessage,
    setIdentitySavedMessage,
  ] = useState<string | null>(null)

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

  const identityPreviewStyle =
    useMemo<CSSProperties>(
      () => ({
        background:
          background.trim() ||
          '#0b0c10',
        borderColor:
          accent.trim() ||
          'rgba(123, 147, 190, 0.36)',
        color:
          accentSoft.trim() ||
          '#c6d1e5',
      }),
      [
        background,
        accent,
        accentSoft,
      ],
    )

  const identityPanelStyle =
    useMemo<CSSProperties>(
      () => ({
        background:
          panel.trim() ||
          '#111217',
        borderColor:
          accent.trim() ||
          'rgba(123, 147, 190, 0.28)',
      }),
      [panel, accent],
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

  function markProfileDirty() {
    setProfileSavedMessage(null)
  }

  function markIdentityDirty() {
    setIdentitySavedMessage(null)
  }

  function submitProfile() {
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

    setProfileSavedMessage(
      'Ficha guardada localmente.',
    )
  }

  function submitIdentity() {
    updateStoryVisualIdentity(
      story,
      {
        themeKey,
        assets: {
          coverImageUrl:
            optionalText(
              coverImageUrl,
            ),
          heroImageUrl:
            optionalText(
              heroImageUrl,
            ),
          logoImageUrl:
            optionalText(
              logoImageUrl,
            ),
        },
        visuals: {
          accent:
            optionalText(accent),
          accentSoft:
            optionalText(
              accentSoft,
            ),
          background:
            optionalText(
              background,
            ),
          panel:
            optionalText(panel),
          displayFontKey:
            optionalText(
              displayFontKey,
            ),
          bodyFontKey:
            optionalText(
              bodyFontKey,
            ),
          ornamentKey:
            optionalText(
              ornamentKey,
            ),
          textureKey:
            optionalText(
              textureKey,
            ),
          readerWidth,
        },
      },
    )

    setIdentitySavedMessage(
      'Identidad guardada localmente.',
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

        <div
          className="story-profile-tabs"
          role="tablist"
          aria-label="Editor de historia"
        >
          <button
            type="button"
            role="tab"
            aria-selected={
              activeTab === 'profile'
            }
            className={
              activeTab === 'profile'
                ? 'active'
                : ''
            }
            onClick={() => {
              setActiveTab('profile')
            }}
          >
            Ficha
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={
              activeTab === 'identity'
            }
            className={
              activeTab === 'identity'
                ? 'active'
                : ''
            }
            onClick={() => {
              setActiveTab('identity')
            }}
          >
            Identidad
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="story-profile-content">
            <form
              className="story-profile-form"
              onSubmit={(event) => {
                event.preventDefault()
                submitProfile()
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
                      markProfileDirty()
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
                      markProfileDirty()
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
                      markProfileDirty()
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
                      markProfileDirty()
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
                        markProfileDirty()
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
                        markProfileDirty()
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
                        markProfileDirty()
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
                      markProfileDirty()
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
                      markProfileDirty()
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
                  {profileSavedMessage ??
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
        ) : (
          <div className="story-profile-content story-identity-content">
            <form
              className="story-profile-form"
              onSubmit={(event) => {
                event.preventDefault()
                submitIdentity()
              }}
            >
              <section className="story-profile-section">
                <div className="story-profile-section-heading">
                  <span>01</span>
                  <h3>Base visual</h3>
                </div>

                <div className="story-profile-fields-grid story-identity-base-grid">
                  <label>
                    <span>Tema base</span>
                    <input
                      required
                      value={themeKey}
                      placeholder="codex"
                      onChange={(event) => {
                        setThemeKey(
                          event.target.value,
                        )
                        markIdentityDirty()
                      }}
                    />
                    <small>
                      Clave semántica registrada por el Codex.
                    </small>
                  </label>

                  <label>
                    <span>Ancho de lectura</span>
                    <select
                      value={readerWidth}
                      onChange={(event) => {
                        setReaderWidth(
                          event.target.value as StoryReaderWidth,
                        )
                        markIdentityDirty()
                      }}
                    >
                      <option value="narrow">
                        Estrecho
                      </option>
                      <option value="standard">
                        Estándar
                      </option>
                      <option value="wide">
                        Amplio
                      </option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="story-profile-section">
                <div className="story-profile-section-heading">
                  <span>02</span>
                  <h3>Recursos</h3>
                </div>

                <label>
                  <span>Portada</span>
                  <input
                    type="url"
                    value={coverImageUrl}
                    placeholder="https://…"
                    onChange={(event) => {
                      setCoverImageUrl(
                        event.target.value,
                      )
                      markIdentityDirty()
                    }}
                  />
                </label>

                <label>
                  <span>Hero</span>
                  <input
                    type="url"
                    value={heroImageUrl}
                    placeholder="https://…"
                    onChange={(event) => {
                      setHeroImageUrl(
                        event.target.value,
                      )
                      markIdentityDirty()
                    }}
                  />
                </label>

                <label>
                  <span>Logo de la obra</span>
                  <input
                    type="url"
                    value={logoImageUrl}
                    placeholder="https://…"
                    onChange={(event) => {
                      setLogoImageUrl(
                        event.target.value,
                      )
                      markIdentityDirty()
                    }}
                  />
                </label>

                <small>
                  F5 usa URLs públicas. La subida y gestión de archivos no forma parte de este contrato.
                </small>
              </section>

              <section className="story-profile-section">
                <div className="story-profile-section-heading">
                  <span>03</span>
                  <h3>Paleta</h3>
                </div>

                <div className="story-identity-color-grid">
                  <label>
                    <span>Acento</span>
                    <div className="story-identity-color-input">
                      <input
                        value={accent}
                        placeholder="Hereda del tema"
                        onChange={(event) => {
                          setAccent(
                            event.target.value,
                          )
                          markIdentityDirty()
                        }}
                      />
                      <i
                        aria-hidden="true"
                        style={{
                          background:
                            accent.trim() ||
                            'transparent',
                        }}
                      />
                    </div>
                  </label>

                  <label>
                    <span>Acento suave</span>
                    <div className="story-identity-color-input">
                      <input
                        value={accentSoft}
                        placeholder="Hereda del tema"
                        onChange={(event) => {
                          setAccentSoft(
                            event.target.value,
                          )
                          markIdentityDirty()
                        }}
                      />
                      <i
                        aria-hidden="true"
                        style={{
                          background:
                            accentSoft.trim() ||
                            'transparent',
                        }}
                      />
                    </div>
                  </label>

                  <label>
                    <span>Fondo</span>
                    <div className="story-identity-color-input">
                      <input
                        value={background}
                        placeholder="Hereda del tema"
                        onChange={(event) => {
                          setBackground(
                            event.target.value,
                          )
                          markIdentityDirty()
                        }}
                      />
                      <i
                        aria-hidden="true"
                        style={{
                          background:
                            background.trim() ||
                            'transparent',
                        }}
                      />
                    </div>
                  </label>

                  <label>
                    <span>Panel</span>
                    <div className="story-identity-color-input">
                      <input
                        value={panel}
                        placeholder="Hereda del tema"
                        onChange={(event) => {
                          setPanel(
                            event.target.value,
                          )
                          markIdentityDirty()
                        }}
                      />
                      <i
                        aria-hidden="true"
                        style={{
                          background:
                            panel.trim() ||
                            'transparent',
                        }}
                      />
                    </div>
                  </label>
                </div>

                <small>
                  Valores vacíos heredan del tema. Writer no almacena CSS arbitrario.
                </small>
              </section>

              <section className="story-profile-section">
                <div className="story-profile-section-heading">
                  <span>04</span>
                  <h3>Presets</h3>
                </div>

                <div className="story-profile-fields-grid story-identity-preset-grid">
                  <label>
                    <span>Fuente de títulos</span>
                    <input
                      value={displayFontKey}
                      placeholder="Hereda del tema"
                      onChange={(event) => {
                        setDisplayFontKey(
                          event.target.value,
                        )
                        markIdentityDirty()
                      }}
                    />
                  </label>

                  <label>
                    <span>Fuente de lectura</span>
                    <input
                      value={bodyFontKey}
                      placeholder="Hereda del tema"
                      onChange={(event) => {
                        setBodyFontKey(
                          event.target.value,
                        )
                        markIdentityDirty()
                      }}
                    />
                  </label>

                  <label>
                    <span>Ornamento</span>
                    <input
                      value={ornamentKey}
                      placeholder="Hereda del tema"
                      onChange={(event) => {
                        setOrnamentKey(
                          event.target.value,
                        )
                        markIdentityDirty()
                      }}
                    />
                  </label>

                  <label>
                    <span>Textura</span>
                    <input
                      value={textureKey}
                      placeholder="Hereda del tema"
                      onChange={(event) => {
                        setTextureKey(
                          event.target.value,
                        )
                        markIdentityDirty()
                      }}
                    />
                  </label>
                </div>

                <small>
                  Son claves, no nombres de clases. F6 será quien las resuelva en el Codex.
                </small>
              </section>

              <footer className="story-profile-form-footer">
                <div>
                  {identitySavedMessage ??
                    'La identidad se sincroniza como parte de Story y se publica con la metadata de la obra.'}
                </div>

                <button
                  type="submit"
                  className="story-profile-save"
                >
                  Guardar identidad
                </button>
              </footer>
            </form>

            <aside className="story-profile-preview-column">
              <div className="story-profile-section-heading">
                <span>05</span>
                <h3>Vista previa</h3>
              </div>

              <p>
                Aproximación local. El render final depende de los presets registrados por el Codex.
              </p>

              <div
                className="story-identity-preview"
                style={identityPreviewStyle}
              >
                {heroImageUrl.trim() && (
                  <img
                    className="story-identity-preview-hero"
                    src={heroImageUrl.trim()}
                    alt=""
                  />
                )}

                <div
                  className="story-identity-preview-panel"
                  style={identityPanelStyle}
                >
                  {logoImageUrl.trim() && (
                    <img
                      className="story-identity-preview-logo"
                      src={logoImageUrl.trim()}
                      alt=""
                    />
                  )}

                  {coverImageUrl.trim() && (
                    <img
                      className="story-identity-preview-cover"
                      src={coverImageUrl.trim()}
                      alt=""
                    />
                  )}

                  <div className="story-identity-preview-copy">
                    <small>
                      {themeKey.trim() ||
                        'sin tema'}
                    </small>

                    <strong>
                      {title.trim() ||
                        story.title}
                    </strong>

                    <span>
                      {subtitle.trim() ||
                        'Sin subtítulo'}
                    </span>
                  </div>
                </div>
              </div>

              <dl className="story-identity-preview-metadata">
                <div>
                  <dt>Lectura</dt>
                  <dd>{readerWidth}</dd>
                </div>
                <div>
                  <dt>Títulos</dt>
                  <dd>
                    {displayFontKey.trim() ||
                      'tema'}
                  </dd>
                </div>
                <div>
                  <dt>Cuerpo</dt>
                  <dd>
                    {bodyFontKey.trim() ||
                      'tema'}
                  </dd>
                </div>
                <div>
                  <dt>Ornamento</dt>
                  <dd>
                    {ornamentKey.trim() ||
                      'tema'}
                  </dd>
                </div>
                <div>
                  <dt>Textura</dt>
                  <dd>
                    {textureKey.trim() ||
                      'tema'}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
