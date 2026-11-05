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

  const [savedLayout, setSavedLayout] = useState(initialLayout)
  const [codeTab, setCodeTab] = useState<'html' | 'css'>('html')
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop')
  const [helpOpen, setHelpOpen] = useState(false)
  const [publicationOpen, setPublicationOpen] = useState(false)

  const dirty =
    mode !== savedLayout.mode ||
    html !== savedLayout.html ||
    css !== savedLayout.css

  function closeEditor() {
    if (dirty && !window.confirm('Hay cambios de diseño sin guardar. ¿Salir y descartarlos?')) {
      return
    }
    onClose()
  }

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
        closeEditor()
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
  }, [onClose, dirty])

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

    setSavedLayout({ mode, html, css })
    setPublicationOpen(false)
    setSavedMessage(
      mode === 'custom'
        ? 'Diseño guardado localmente. Ya puedes publicarlo.'
        : 'Modo estándar guardado. Puedes publicar este cambio.',
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
          closeEditor()
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
              onClick={closeEditor}
            >
              ×
            </button>
          </div>
        </header>


        <nav className="story-layout-mode-bar" aria-label="Modo de presentación">
          <div className="story-layout-mode-group">
            <span className="story-layout-step">1 · Presentación</span>
            <div className="story-layout-mode-switch" role="group" aria-label="Modo de presentación">
              <button
                type="button"
                className={mode === 'preset' ? 'active' : ''}
                aria-pressed={mode === 'preset'}
                onClick={() => changeMode('preset')}
              >Estándar</button>
              <button
                type="button"
                className={mode === 'custom' ? 'active' : ''}
                aria-pressed={mode === 'custom'}
                onClick={() => changeMode('custom')}
              >HTML + CSS</button>
            </div>
          </div>
          <p>{mode === 'preset'
            ? 'El Codex usa el diseño de la ficha. Tu código se conserva para cuando lo necesites.'
            : 'Tu HTML y CSS controlan la página de la obra. Los capítulos mantienen su lector.'}</p>
        </nav>

        <main className="story-layout-workspace">
          <section className="story-layout-code-column" aria-label="Editor de código">
            <div className="story-layout-code-heading">
              <span className="story-layout-step">2 · Editar</span>
              <div className="story-layout-code-tabs" role="group" aria-label="Lenguaje del editor">
                <button
                  type="button"
                  className={codeTab === 'html' ? 'active' : ''}
                  aria-pressed={codeTab === 'html'}
                  onClick={() => { setCodeTab('html'); setHelpOpen(false) }}
                >HTML</button>
                <button
                  type="button"
                  className={codeTab === 'css' ? 'active' : ''}
                  aria-pressed={codeTab === 'css'}
                  onClick={() => { setCodeTab('css'); setHelpOpen(false) }}
                >CSS</button>
              </div>
              <button
                type="button"
                className="story-layout-help-trigger"
                aria-expanded={helpOpen}
                onClick={() => setHelpOpen(!helpOpen)}
              >{helpOpen ? 'Cerrar ayuda' : 'Ayuda y variables'}</button>
            </div>

            {mode === 'custom' ? (
              <div className="story-layout-editor-surface">
                <div className="story-layout-code-meta">
                  <span>{codeTab === 'html' ? 'Estructura de la página' : 'Estilos de la página'}</span>
                  <span>{(codeTab === 'html' ? html.length : css.length).toLocaleString()} / {(codeTab === 'html' ? STORY_LAYOUT_HTML_MAX_LENGTH : STORY_LAYOUT_CSS_MAX_LENGTH).toLocaleString()}</span>
                </div>
                <textarea
                  key={codeTab}
                  value={codeTab === 'html' ? html : css}
                  maxLength={codeTab === 'html' ? STORY_LAYOUT_HTML_MAX_LENGTH : STORY_LAYOUT_CSS_MAX_LENGTH}
                  spellCheck={false}
                  aria-label={codeTab === 'html' ? 'HTML personalizado' : 'CSS personalizado'}
                  placeholder={codeTab === 'html' ? '<main>...</main>' : '.hero { ... }'}
                  onChange={(event) => {
                    if (codeTab === 'html') setHtml(event.target.value)
                    else setCss(event.target.value)
                    markDirty()
                  }}
                />
              </div>
            ) : (
              <div className="story-layout-blank-state">
                <strong>Diseño estándar activo</strong>
                <p>La presentación de esta obra se controla desde Ficha → Identidad. Activa HTML + CSS para editar su diseño libremente.</p>
                <button type="button" onClick={() => changeMode('custom')}>Cambiar a HTML + CSS</button>
              </div>
            )}

            {helpOpen && (
              <aside className="story-layout-help-panel" aria-label="Referencia para personalización">
                <h3>Guía rápida</h3>
                <p>Escribe la estructura en HTML y sus estilos en CSS. Los datos de la historia se insertan automáticamente al publicar. No se permite JavaScript.</p>
                <h4>Datos de la obra</h4>
                <div className="story-layout-placeholder-list">
                  {PLACEHOLDERS.map((placeholder) => <code key={placeholder}>{placeholder}</code>)}
                </div>
                <p><code>{'{{chapters}}'}</code> genera la lista de capítulos; coloca ese marcador donde quieras mostrarla.</p>
                <h4>Variables CSS</h4>
                <div className="story-layout-variable-list">
                  <code>--story-accent</code><code>--story-accent-soft</code>
                  <code>--story-background</code><code>--story-panel</code>
                  <code>--story-text</code><code>--story-muted</code>
                  <code>--story-display-font</code><code>--story-body-font</code>
                  <code>--story-cover-image</code><code>--story-hero-image</code><code>--story-logo-image</code>
                </div>
                <p>Los valores de texto se escapan. Los scripts, eventos inline, iframes, formularios y CSS @import se rechazan al publicar.</p>
              </aside>
            )}
          </section>

          <section className="story-layout-preview-column" aria-label="Vista previa del diseño">
            <div className="story-layout-preview-heading">
              <span className="story-layout-step">3 · Vista previa</span>
              {mode === 'custom' && (
                <div className="story-layout-preview-sizes" role="group" aria-label="Tamaño de vista previa">
                  <button type="button" aria-pressed={previewWidth === 'desktop'} className={previewWidth === 'desktop' ? 'active' : ''} onClick={() => setPreviewWidth('desktop')}>Escritorio</button>
                  <button type="button" aria-pressed={previewWidth === 'mobile'} className={previewWidth === 'mobile' ? 'active' : ''} onClick={() => setPreviewWidth('mobile')}>Móvil</button>
                </div>
              )}
            </div>

            {mode === 'custom' ? (
              html.trim() ? (
                <div className="story-layout-preview-canvas">
                  <iframe
                    className={['story-layout-preview-frame', previewWidth].join(' ')}
                    title={'Vista previa de ' + story.title}
                    sandbox="allow-same-origin"
                    srcDoc={previewDocument}
                  />
                </div>
              ) : (
                <div className="story-layout-blank-state">
                  <strong>Tu vista previa aparecerá aquí</strong>
                  <p>Escribe HTML o usa la plantilla inicial para empezar. Después modifica el CSS para personalizarlo.</p>
                  <button type="button" onClick={useStarterTemplate}>Usar plantilla inicial</button>
                </div>
              )
            ) : (
              <div className="story-layout-blank-state">
                <strong>Presentación estándar</strong>
                <p>El Codex utilizará el tema <b>{story.themeKey}</b>. La vista previa personalizada estará disponible al activar HTML + CSS.</p>
              </div>
            )}
          </section>
        </main>

        <footer className="story-layout-footer">
          <div className="story-layout-save-state" aria-live="polite">
            <span className="story-layout-step">4 · Guardar borrador</span>
            <strong className={dirty ? 'unsaved' : 'saved'}>
              {dirty ? 'Hay cambios sin guardar' : (savedMessage ?? 'Sin cambios pendientes')}
            </strong>
            <small>Guardar actualiza Writer. Publicar actualiza el Codex.</small>
          </div>
          <div className="story-layout-footer-actions">
            <div className="story-layout-publish-wrap">
              <button
                type="button"
                className="story-layout-publication-trigger"
                aria-expanded={publicationOpen}
                disabled={dirty}
                title={dirty ? 'Guarda el diseño antes de publicar' : 'Abrir controles de publicación'}
                onClick={() => setPublicationOpen(!publicationOpen)}
              >5 · Publicar {publicationOpen ? '▴' : '▾'}</button>
              {publicationOpen && (
                <div className="story-layout-publication-panel">
                  <p>Tu diseño ya está guardado. Pulsa «Publicar cambios» para actualizar la página pública.</p>
                  <StoryPublicationControls story={story} />
                </div>
              )}
            </div>
            <button
              type="button"
              className="story-layout-save-button"
              disabled={!dirty}
              onClick={saveLayout}
            >Guardar diseño</button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
