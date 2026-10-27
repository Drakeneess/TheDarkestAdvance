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
  StoryLayoutMode,
} from '../../domain/story-layout'

import {
  normalizeStoryCustomLayout,
  STORY_LAYOUT_CSS_MAX_LENGTH,
  STORY_LAYOUT_HTML_MAX_LENGTH,
} from '../../domain/story-layout'

import {
  StoryPublicationControls,
} from '../publishing/StoryPublicationControls'

import {
  updateStoryCustomLayout,
} from './stories.service'

import {
  buildStoryLayoutPreviewDocument,
  STORY_LAYOUT_STARTER_CSS,
  STORY_LAYOUT_STARTER_HTML,
} from './story-layout-preview'

interface StoryCustomLayoutEditorProps {
  story: Story
  onClose: () => void
}

const PLACEHOLDERS = [
  '{{story.title}}',
  '{{story.subtitle}}',
  '{{story.description}}',
  '{{story.author}}',
  '{{story.status}}',
  '{{story.language}}',
  '{{story.contentRating}}',
  '{{story.slug}}',
  '{{story.coverUrl}}',
  '{{story.heroUrl}}',
  '{{story.logoUrl}}',
  '{{story.genres}}',
  '{{story.tags}}',
  '{{chapters}}',
]

export function StoryCustomLayoutEditor({
  story,
  onClose,
}: StoryCustomLayoutEditorProps) {
  const initialLayout =
    useMemo(
      () =>
        normalizeStoryCustomLayout(
          story.layout,
        ),
      [story.layout],
    )

  const [
    mode,
    setMode,
  ] = useState<StoryLayoutMode>(
    initialLayout.mode,
  )

  const [
    html,
    setHtml,
  ] = useState(
    initialLayout.html,
  )

  const [
    css,
    setCss,
  ] = useState(
    initialLayout.css,
  )

  const [
    savedMessage,
    setSavedMessage,
  ] = useState<string | null>(null)

  const previewDocument =
    useMemo(
      () =>
        buildStoryLayoutPreviewDocument(
          story,
          html,
          css,
        ),
      [story, html, css],
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

  function markDirty() {
    setSavedMessage(null)
  }

  function changeMode(
    nextMode: StoryLayoutMode,
  ) {
    setMode(nextMode)
    markDirty()
  }

  function useStarterTemplate() {
    const hasContent =
      html.trim().length > 0 ||
      css.trim().length > 0

    if (
      hasContent &&
      !window.confirm(
        'Esto reemplazará el HTML y CSS actuales por la plantilla inicial. ¿Continuar?',
      )
    ) {
      return
    }

    setMode('custom')
    setHtml(
      STORY_LAYOUT_STARTER_HTML,
    )
    setCss(
      STORY_LAYOUT_STARTER_CSS,
    )
    markDirty()
  }

  function saveLayout() {
    updateStoryCustomLayout(
      story,
      {
        mode,
        html,
        css,
      },
    )

    setSavedMessage(
      mode === 'custom'
        ? 'Diseño personalizado guardado localmente.'
        : 'La historia volverá a usar la presentación estándar al publicar.',
    )
  }

  return createPortal(
    <div
      className="story-layout-overlay"
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
        className="story-layout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-layout-editor-title"
      >
        <header className="story-layout-header">
          <div>
            <span>
              Diseño avanzado
            </span>

            <h2 id="story-layout-editor-title">
              {story.title}
            </h2>
          </div>

          <div className="story-layout-header-actions">
            <button
              type="button"
              className="story-layout-template-button"
              onClick={
                useStarterTemplate
              }
            >
              Usar plantilla inicial
            </button>

            <button
              type="button"
              className="story-layout-close"
              aria-label="Cerrar editor de diseño"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className="story-layout-mode-bar">
          <div
            className="story-layout-mode-switch"
            role="group"
            aria-label="Modo de presentación"
          >
            <button
              type="button"
              className={
                mode === 'preset'
                  ? 'active'
                  : ''
              }
              aria-pressed={
                mode === 'preset'
              }
              onClick={() => {
                changeMode('preset')
              }}
            >
              Estándar
            </button>

            <button
              type="button"
              className={
                mode === 'custom'
                  ? 'active'
                  : ''
              }
              aria-pressed={
                mode === 'custom'
              }
              onClick={() => {
                changeMode('custom')
              }}
            >
              Custom HTML / CSS
            </button>
          </div>

          <p>
            Cambiar de modo no borra el código. El HTML/CSS solo reemplaza la presentación pública de la obra; el lector de capítulos sigue aislado.
          </p>
        </div>

        <div className="story-layout-workspace">
          <section className="story-layout-code-column">
            <div className="story-layout-code-panel">
              <div className="story-layout-code-heading">
                <div>
                  <span>HTML</span>
                  <small>
                    {html.length.toLocaleString()} / {STORY_LAYOUT_HTML_MAX_LENGTH.toLocaleString()}
                  </small>
                </div>
              </div>

              <textarea
                value={html}
                maxLength={
                  STORY_LAYOUT_HTML_MAX_LENGTH
                }
                spellCheck={false}
                aria-label="HTML personalizado"
                placeholder="<main>...</main>"
                onChange={(event) => {
                  setHtml(
                    event.target.value,
                  )
                  markDirty()
                }}
              />
            </div>

            <div className="story-layout-code-panel">
              <div className="story-layout-code-heading">
                <div>
                  <span>CSS</span>
                  <small>
                    {css.length.toLocaleString()} / {STORY_LAYOUT_CSS_MAX_LENGTH.toLocaleString()}
                  </small>
                </div>
              </div>

              <textarea
                value={css}
                maxLength={
                  STORY_LAYOUT_CSS_MAX_LENGTH
                }
                spellCheck={false}
                aria-label="CSS personalizado"
                placeholder=".hero { ... }"
                onChange={(event) => {
                  setCss(
                    event.target.value,
                  )
                  markDirty()
                }}
              />
            </div>
          </section>

          <section className="story-layout-preview-column">
            <div className="story-layout-preview-heading">
              <div>
                <span>Vista previa</span>
                <small>
                  iframe sandboxed · scripts bloqueados
                </small>
              </div>

              <span
                className={[
                  'story-layout-mode-badge',
                  mode,
                ].join(' ')}
              >
                {mode === 'custom'
                  ? 'CUSTOM'
                  : 'ESTÁNDAR'}
              </span>
            </div>

            {mode === 'custom' ? (
              <iframe
                className="story-layout-preview-frame"
                title={`Vista previa de ${story.title}`}
                sandbox="allow-same-origin"
                srcDoc={previewDocument}
              />
            ) : (
              <div className="story-layout-preset-placeholder">
                <span>Preset activo</span>
                <strong>
                  {story.themeKey}
                </strong>
                <p>
                  Al publicar, Codex seguirá usando StoryPresentation y la identidad estructurada actual. Tu código personalizado se conserva como borrador para cuando vuelvas a Custom.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="story-layout-reference">
          <div>
            <span>Placeholders</span>
            <p>
              El Codex escapa los valores de texto. <code>{'{{chapters}}'}</code> es el único slot que genera markup controlado con enlaces a capítulos.
            </p>
          </div>

          <div className="story-layout-placeholder-list">
            {PLACEHOLDERS.map(
              (placeholder) => (
                <code key={placeholder}>
                  {placeholder}
                </code>
              ),
            )}
          </div>

          <div className="story-layout-variable-list">
            <span>Variables CSS</span>
            <code>--story-accent</code>
            <code>--story-accent-soft</code>
            <code>--story-background</code>
            <code>--story-panel</code>
            <code>--story-cover-image</code>
            <code>--story-hero-image</code>
            <code>--story-logo-image</code>
          </div>
        </section>

        <footer className="story-layout-footer">
          <div className="story-layout-save-state">
            <strong>
              {savedMessage ??
                'Los cambios son locales hasta guardar. Publicar sigue siendo una acción separada.'}
            </strong>
            <small>
              JavaScript, handlers inline, iframes, formularios, @import y URLs activas serán rechazados por Publishing.
            </small>
          </div>

          <div className="story-layout-footer-actions">
            <StoryPublicationControls
              story={story}
            />

            <button
              type="button"
              className="story-layout-save-button"
              onClick={saveLayout}
            >
              Guardar diseño
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
