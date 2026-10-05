import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../../domain/models'

import type {
  DraftStatus,
} from '../writer/useWriterWorkspace'

import {
  CommandPalette,
} from './CommandPalette'

import type {
  CommandPaletteItem,
} from './CommandPalette'

import {
  EditorSearchPanel,
} from './EditorSearchPanel'

import {
  EditorToolbar,
} from './EditorToolbar'

import {
  MdxPreview,
} from './MdxPreview'

import {
  useEditorCommands,
} from './useEditorCommands'

import {
  useEditorSearch,
} from './useEditorSearch'

type EditorView =
  | 'edit'
  | 'preview'
  | 'split'

interface EditorPanelProps {
  story:
    | Story
    | null

  chapter:
    | Chapter
    | null

  selectedVersion:
    | ChapterVersion
    | null

  previousChapter:
    | Chapter
    | null

  nextChapter:
    | Chapter
    | null

  versionsOpen: boolean

  focusMode: boolean

  draft: string

  visibleContent: string

  wordCount: number

  draftStatus:
    DraftStatus

  onDraftChange:
    (
      value: string,
    ) => void

  onSaveVersion:
    () => void

  onRestoreVersion:
    () => void

  onReturnToDraft:
    () => void

  onPreviousChapter:
    () => void

  onNextChapter:
    () => void

  onToggleVersions:
    () => void

  onToggleFocusMode:
    () => void
}

export function EditorPanel({
  story,
  chapter,
  selectedVersion,

  previousChapter,
  nextChapter,

  versionsOpen,
  focusMode,

  draft,
  visibleContent,

  wordCount,
  draftStatus,

  onDraftChange,

  onSaveVersion,
  onRestoreVersion,
  onReturnToDraft,

  onPreviousChapter,
  onNextChapter,

  onToggleVersions,
  onToggleFocusMode,
}: EditorPanelProps) {
  const [
    view,
    setView,
  ] =
    useState<EditorView>(
      'edit',
    )

  const [
    commandPaletteOpen,
    setCommandPaletteOpen,
  ] = useState(false)

  const readOnly =
    Boolean(
      selectedVersion,
    )

  const editorContent =
    selectedVersion
      ? visibleContent
      : draft

  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null,
    )

  const searchInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const replaceInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const editor =
    useEditorCommands({
      content:
        draft,

      historyKey:
        chapter?.id ??
        'empty',

      readOnly,

      textareaRef,

      onChange:
        onDraftChange,
    })

  const search =
    useEditorSearch({
      content:
        editorContent,

      readOnly,

      textareaRef,
      searchInputRef,
      replaceInputRef,

      onApplyEdit:
        editor.applyEdit,
    })

  /* ==================================================
     COMMAND PALETTE SHORTCUT
     ================================================== */

  useEffect(() => {
    function handleCommandPaletteShortcut(
      event: KeyboardEvent,
    ) {
      const modifier =
        event.ctrlKey ||
        event.metaKey

      if (
        modifier &&
        event.shiftKey &&
        event.key.toLowerCase() ===
          'p'
      ) {
        event.preventDefault()

        setCommandPaletteOpen(
          true,
        )
      }
    }

    window.addEventListener(
      'keydown',
      handleCommandPaletteShortcut,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleCommandPaletteShortcut,
      )
    }
  }, [])

  /* ==================================================
     VIEW HELPERS
     ================================================== */

  function handleToggleFocusMode() {
    /**
     * Focus Mode trabaja únicamente
     * con la vista de edición.
     */
    if (!focusMode) {
      setView(
        'edit',
      )
    }

    onToggleFocusMode()
  }

  function handleShowEdit() {
    setView(
      'edit',
    )
  }

  function handleShowPreview() {
    if (focusMode) {
      onToggleFocusMode()
    }

    setView(
      'preview',
    )
  }

  function handleShowSplit() {
    if (focusMode) {
      onToggleFocusMode()
    }

    setView(
      'split',
    )
  }

  function handleShowVersions() {
    if (focusMode) {
      onToggleFocusMode()
    }

    if (!versionsOpen) {
      onToggleVersions()
    }
  }

  function handleMobileShowEdit() {
    search.close()

    handleShowEdit()
  }

  function handleMobileShowPreview() {
    search.close()

    handleShowPreview()
  }

  function handleMobileOpenSearch() {
    if (focusMode) {
      onToggleFocusMode()
    }

    if (view !== 'edit') {
      setView('edit')
    }

    search.openFind()
  }

  /* ==================================================
     KEYBOARD
     ================================================== */

  function handleEditorKeyDown(
    event:
      ReactKeyboardEvent<
        HTMLTextAreaElement
      >,
  ) {
    /**
     * Buscar / reemplazar tiene prioridad.
     */
    if (
      search.handleTextareaKeyDown(
        event,
      )
    ) {
      return
    }

    editor.handleKeyDown(
      event,
    )
  }

  /* ==================================================
     COMMAND PALETTE ITEMS
     ================================================== */

  const commandPaletteItems:
    CommandPaletteItem[] = [
      {
        id:
          'find',

        label:
          'Buscar en capítulo',

        description:
          'Buscar texto dentro del capítulo actual.',

        category:
          'Buscar',

        shortcut:
          'Ctrl+F',

        keywords: [
          'buscar',
          'find',
          'texto',
        ],

        action:
          search.openFind,
      },

      {
        id:
          'replace',

        label:
          'Buscar y reemplazar',

        description:
          'Buscar texto y sustituir coincidencias.',

        category:
          'Buscar',

        shortcut:
          'Ctrl+H',

        keywords: [
          'buscar',
          'reemplazar',
          'replace',
        ],

        action:
          search.openReplace,
      },

      {
        id:
          'dialogue',

        label:
          'Convertir en diálogo',

        description:
          'Añadir o quitar raya de diálogo a las líneas seleccionadas.',

        category:
          'Escritura',

        keywords: [
          'dialogo',
          'raya',
          'personaje',
        ],

        disabled:
          readOnly,

        action:
          editor.dialogue,
      },

      {
        id:
          'thought',

        label:
          'Pensamiento',

        description:
          'Aplicar formato de pensamiento al texto seleccionado.',

        category:
          'Escritura',

        shortcut:
          'Ctrl+I',

        keywords: [
          'pensamiento',
          'cursiva',
          'italic',
        ],

        disabled:
          readOnly,

        action:
          editor.thought,
      },

      {
        id:
          'bold',

        label:
          'Negrita',

        description:
          'Aplicar énfasis fuerte.',

        category:
          'Formato',

        shortcut:
          'Ctrl+B',

        keywords: [
          'bold',
          'negrita',
        ],

        disabled:
          readOnly,

        action:
          editor.bold,
      },

      {
        id:
          'italic',

        label:
          'Cursiva',

        description:
          'Aplicar cursiva al texto seleccionado.',

        category:
          'Formato',

        shortcut:
          'Ctrl+I',

        keywords: [
          'italic',
          'cursiva',
        ],

        disabled:
          readOnly,

        action:
          editor.italic,
      },

      {
        id:
          'strike',

        label:
          'Tachado',

        description:
          'Tachar el texto seleccionado.',

        category:
          'Formato',

        shortcut:
          'Ctrl+Shift+S',

        keywords: [
          'strike',
          'tachado',
        ],

        disabled:
          readOnly,

        action:
          editor.strike,
      },

      {
        id:
          'code',

        label:
          'Código',

        description:
          'Aplicar formato de código en línea.',

        category:
          'Formato',

        keywords: [
          'codigo',
          'code',
        ],

        disabled:
          readOnly,

        action:
          editor.code,
      },

      {
        id:
          'quote',

        label:
          'Cita',

        description:
          'Convertir las líneas seleccionadas en cita.',

        category:
          'Formato',

        keywords: [
          'cita',
          'quote',
        ],

        disabled:
          readOnly,

        action:
          editor.quote,
      },

      {
        id:
          'heading-1',

        label:
          'Título principal',

        category:
          'Formato',

        keywords: [
          'h1',
          'titulo',
          'heading',
        ],

        disabled:
          readOnly,

        action:
          editor.heading1,
      },

      {
        id:
          'heading-2',

        label:
          'Sección',

        category:
          'Formato',

        keywords: [
          'h2',
          'seccion',
          'heading',
        ],

        disabled:
          readOnly,

        action:
          editor.heading2,
      },

      {
        id:
          'heading-3',

        label:
          'Subsección',

        category:
          'Formato',

        keywords: [
          'h3',
          'subseccion',
          'heading',
        ],

        disabled:
          readOnly,

        action:
          editor.heading3,
      },

      {
        id:
          'bullet-list',

        label:
          'Lista con viñetas',

        category:
          'Formato',

        keywords: [
          'lista',
          'bullet',
          'viñetas',
        ],

        disabled:
          readOnly,

        action:
          editor.bulletList,
      },

      {
        id:
          'ordered-list',

        label:
          'Lista numerada',

        category:
          'Formato',

        keywords: [
          'lista',
          'numerada',
          'ordered',
        ],

        disabled:
          readOnly,

        action:
          editor.orderedList,
      },

      {
        id:
          'separator',

        label:
          'Insertar separador',

        category:
          'Formato',

        keywords: [
          'separador',
          'linea',
          'separator',
        ],

        disabled:
          readOnly,

        action:
          editor.separator,
      },

      {
        id:
          'link',

        label:
          'Insertar enlace',

        category:
          'Formato',

        keywords: [
          'link',
          'enlace',
          'url',
        ],

        disabled:
          readOnly,

        action:
          editor.link,
      },

      {
        id:
          'image',

        label:
          'Insertar imagen',

        category:
          'Formato',

        keywords: [
          'imagen',
          'image',
          'img',
        ],

        disabled:
          readOnly,

        action:
          editor.image,
      },

      {
        id:
          'clean',

        label:
          'Limpiar formato',

        description:
          'Eliminar formato MDX del texto seleccionado.',

        category:
          'Formato',

        keywords: [
          'limpiar',
          'clean',
          'formato',
        ],

        disabled:
          readOnly,

        action:
          editor.clean,
      },

      {
        id:
          'undo',

        label:
          'Deshacer',

        category:
          'Edición',

        shortcut:
          'Ctrl+Z',

        keywords: [
          'undo',
          'deshacer',
        ],

        disabled:
          readOnly,

        action:
          editor.undo,
      },

      {
        id:
          'redo',

        label:
          'Rehacer',

        category:
          'Edición',

        shortcut:
          'Ctrl+Shift+Z',

        keywords: [
          'redo',
          'rehacer',
        ],

        disabled:
          readOnly,

        action:
          editor.redo,
      },

      {
        id:
          'edit-view',

        label:
          'Mostrar editor',

        category:
          'Vista',

        keywords: [
          'editar',
          'editor',
        ],

        action:
          handleShowEdit,
      },

      {
        id:
          'preview-view',

        label:
          'Mostrar preview',

        description:
          'Renderizar el MDX del capítulo.',

        category:
          'Vista',

        keywords: [
          'preview',
          'mdx',
          'vista',
        ],

        action:
          handleShowPreview,
      },

      {
        id:
          'split-view',

        label:
          'Vista dividida',

        description:
          'Mostrar editor y preview simultáneamente.',

        category:
          'Vista',

        keywords: [
          'split',
          'dividido',
          'preview',
        ],

        action:
          handleShowSplit,
      },

      {
        id:
          'focus-mode',

        label:
          focusMode
            ? 'Salir de Focus Mode'
            : 'Entrar en Focus Mode',

        description:
          focusMode
            ? 'Restaurar la interfaz completa.'
            : 'Ocultar distracciones y dejar únicamente el área de escritura.',

        category:
          'Vista',

        keywords: [
          'focus',
          'concentracion',
          'distracciones',
        ],

        disabled:
          readOnly,

        action:
          handleToggleFocusMode,
      },

      {
        id:
          'versions',

        label:
          'Mostrar historial',

        description:
          'Abrir el panel de versiones del capítulo.',

        category:
          'Versionado',

        keywords: [
          'historial',
          'version',
          'snapshot',
        ],

        action:
          handleShowVersions,
      },

      {
        id:
          'save-version',

        label:
          'Guardar versión',

        description:
          'Crear un snapshot del borrador actual.',

        category:
          'Versionado',

        keywords: [
          'guardar',
          'snapshot',
          'version',
        ],

        disabled:
          readOnly,

        action:
          onSaveVersion,
      },

      {
        id:
          'previous-chapter',

        label:
          'Capítulo anterior',

        category:
          'Navegación',

        shortcut:
          'Alt+↑',

        keywords: [
          'anterior',
          'capitulo',
        ],

        disabled:
          !previousChapter,

        action:
          onPreviousChapter,
      },

      {
        id:
          'next-chapter',

        label:
          'Siguiente capítulo',

        category:
          'Navegación',

        shortcut:
          'Alt+↓',

        keywords: [
          'siguiente',
          'capitulo',
        ],

        disabled:
          !nextChapter,

        action:
          onNextChapter,
      },
    ]

  /**
   * Acciones específicas disponibles
   * al inspeccionar una versión histórica.
   */
  if (selectedVersion) {
    commandPaletteItems.push(
      {
        id:
          'return-draft',

        label:
          'Volver al borrador',

        description:
          'Abandonar la vista histórica y regresar al borrador actual.',

        category:
          'Versionado',

        keywords: [
          'borrador',
          'volver',
          'draft',
        ],

        action:
          onReturnToDraft,
      },

      {
        id:
          'restore-version',

        label:
          'Restaurar esta versión',

        description:
          `Restaurar ${selectedVersion.label} como borrador actual.`,

        category:
          'Versionado',

        keywords: [
          'restaurar',
          'version',
          'restore',
        ],

        action:
          onRestoreVersion,
      },
    )
  }

  /* ==================================================
     EMPTY STATE
     ================================================== */

  if (!chapter) {
    return (
      <section className="editor-panel">
        <div className="empty-state">
          <p className="eyebrow">
            EDITOR
          </p>

          <h2>
            Elige o crea un capítulo.
          </h2>

          <p>
            Usa Ctrl+K para buscar
            rápidamente una historia,
            capítulo o fragmento.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="editor-panel">
      {/* ==================================================
          NORMAL HEADER
          ================================================== */}

      {!focusMode && (
        <header className="editor-header">
          <div>
            <p className="eyebrow">
              {selectedVersion
                ? 'VERSIÓN HISTÓRICA'
                : story?.title ??
                  'CAPÍTULO'}
            </p>

            <h2>
              {chapter.title}
            </h2>

            {selectedVersion && (
              <p className="version-preview-label">
                {
                  selectedVersion.label
                }
              </p>
            )}
          </div>

          <div className="editor-actions">
            {selectedVersion ? (
              <>
                <button
                  className="secondary"
                  onClick={
                    onReturnToDraft
                  }
                >
                  Volver al borrador
                </button>

                <button
                  className="primary"
                  onClick={
                    onRestoreVersion
                  }
                >
                  Restaurar
                </button>
              </>
            ) : (
              <button
                className="primary"
                onClick={
                  onSaveVersion
                }
              >
                Guardar versión
              </button>
            )}
          </div>
        </header>
      )}

      {!focusMode &&
        selectedVersion && (
          <div
            className="mobile-version-banner"
            aria-label="Versión histórica"
          >
            <div className="mobile-version-banner-context">
              <span>
                VERSIÓN HISTÓRICA
              </span>

              <strong>
                {selectedVersion.label}
              </strong>
            </div>

            <div className="mobile-version-banner-actions">
              <button
                type="button"
                onClick={
                  onReturnToDraft
                }
              >
                Borrador
              </button>

              <button
                type="button"
                className="primary"
                onClick={
                  onRestoreVersion
                }
              >
                Restaurar
              </button>
            </div>
          </div>
        )}

      {/* ==================================================
          NORMAL WORKSPACE TOOLBAR
          ================================================== */}

      {!focusMode && (
        <div className="editor-toolbar">
          <div className="chapter-quick-navigation">
            <button
              type="button"
              disabled={
                !previousChapter
              }
              title="Capítulo anterior — Alt+↑"
              onClick={
                onPreviousChapter
              }
            >
              ↑
            </button>

            <span>
              {String(
                chapter.order,
              ).padStart(
                3,
                '0',
              )}
            </span>

            <button
              type="button"
              disabled={
                !nextChapter
              }
              title="Siguiente capítulo — Alt+↓"
              onClick={
                onNextChapter
              }
            >
              ↓
            </button>
          </div>

          <div className="editor-view-switcher">
            <button
              type="button"
              className={
                view === 'edit'
                  ? 'active'
                  : ''
              }
              onClick={
                handleShowEdit
              }
            >
              Editar
            </button>

            <button
              type="button"
              className={
                view === 'preview'
                  ? 'active'
                  : ''
              }
              onClick={
                handleShowPreview
              }
            >
              Preview
            </button>

            <button
              type="button"
              className={
                view === 'split'
                  ? 'active'
                  : ''
              }
              onClick={
                handleShowSplit
              }
            >
              Dividido
            </button>
          </div>

          <div className="editor-toolbar-actions">
            <button
              type="button"
              className="command-palette-toggle"
              title="Paleta de comandos — Ctrl+Shift+P"
              onClick={() =>
                setCommandPaletteOpen(
                  true,
                )
              }
            >
              Comandos
            </button>

            {!selectedVersion && (
              <button
                type="button"
                className="focus-toggle"
                title="Modo concentración"
                onClick={
                  handleToggleFocusMode
                }
              >
                Focus
              </button>
            )}

            <button
              type="button"
              className="editor-find-button"
              title="Buscar — Ctrl+F"
              onClick={
                search.openFind
              }
            >
              Buscar
            </button>

            <button
              type="button"
              className={[
                'versions-toggle',

                versionsOpen
                  ? 'active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={
                onToggleVersions
              }
            >
              Historial
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          FOCUS MODE HEADER
          ================================================== */}

      {focusMode && (
        <div className="focus-mode-bar">
          <div className="focus-mode-chapter">
            <span>
              {story?.title ??
                'Historia'}
            </span>

            <strong>
              {chapter.title}
            </strong>
          </div>

          <div className="focus-mode-meta">
            <span>
              {wordCount.toLocaleString()}{' '}
              palabras
            </span>

            <span
              className={
                draftStatus ===
                'pending'
                  ? 'save-status pending'
                  : 'save-status'
              }
            >
              {draftStatus ===
              'pending'
                ? 'Guardando…'
                : 'Guardado'}
            </span>

            <button
              type="button"
              title="Paleta de comandos — Ctrl+Shift+P"
              onClick={() =>
                setCommandPaletteOpen(
                  true,
                )
              }
            >
              Comandos
            </button>

            <button
              type="button"
              title="Salir del modo concentración — Esc"
              onClick={
                handleToggleFocusMode
              }
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          LOCAL SEARCH / REPLACE
          ================================================== */}

      {search.open && (
        <EditorSearchPanel
          mode={
            search.mode
          }

          searchTerm={
            search.searchTerm
          }

          replaceTerm={
            search.replaceTerm
          }

          currentMatchNumber={
            search.currentMatchNumber
          }

          matchCount={
            search.matches.length
          }

          caseSensitive={
            search.caseSensitive
          }

          readOnly={
            readOnly
          }

          searchInputRef={
            searchInputRef
          }

          replaceInputRef={
            replaceInputRef
          }

          onSearchChange={
            search.handleSearchTermChange
          }

          onReplaceChange={
            search.handleReplaceTermChange
          }

          onSearchKeyDown={
            search.handleSearchInputKeyDown
          }

          onReplaceKeyDown={
            search.handleReplaceInputKeyDown
          }

          onPrevious={
            search.previousMatch
          }

          onNext={
            search.nextMatch
          }

          onToggleCaseSensitive={
            search.toggleCaseSensitive
          }

          onShowReplace={
            search.showReplace
          }

          onReplaceCurrent={
            search.replaceCurrent
          }

          onReplaceAll={
            search.replaceAll
          }

          onClose={
            search.close
          }
        />
      )}

      {/* ==================================================
          FORMATTING / NARRATIVE TOOLBAR
          ================================================== */}

      {!focusMode &&
        !selectedVersion &&
        view !==
          'preview' && (
          <EditorToolbar
            onUndo={
              editor.undo
            }

            onRedo={
              editor.redo
            }

            onBold={
              editor.bold
            }

            onItalic={
              editor.italic
            }

            onStrike={
              editor.strike
            }

            onCode={
              editor.code
            }

            onDialogue={
              editor.dialogue
            }

            onThought={
              editor.thought
            }

            onHeading1={
              editor.heading1
            }

            onHeading2={
              editor.heading2
            }

            onHeading3={
              editor.heading3
            }

            onQuote={
              editor.quote
            }

            onBulletList={
              editor.bulletList
            }

            onOrderedList={
              editor.orderedList
            }

            onSeparator={
              editor.separator
            }

            onLink={
              editor.link
            }

            onImage={
              editor.image
            }

            onClean={
              editor.clean
            }
          />
        )}

      {/* ==================================================
          EDITOR / PREVIEW
          ================================================== */}

      <div
        className={[
          'editor-workspace',
          `mode-${view}`,
        ].join(' ')}
      >
        {view !==
          'preview' && (
          <textarea
            ref={
              textareaRef
            }

            className={
              selectedVersion
                ? 'editor readonly'
                : 'editor'
            }

            value={
              editorContent
            }

            onChange={(
              event,
            ) => {
              if (
                selectedVersion
              ) {
                return
              }

              editor.handleTextChange(
                event.target.value,
              )
            }}

            onKeyDown={
              handleEditorKeyDown
            }

            readOnly={
              readOnly
            }

            placeholder="Empieza a escribir…"

            spellCheck
          />
        )}

        {view !==
          'edit' && (
          <MdxPreview
            content={
              editorContent
            }
          />
        )}
      </div>

      {/* ==================================================
          NORMAL STATUSBAR
          ================================================== */}

      {!focusMode && (
        <footer className="statusbar">
          <span className="statusbar-words">
            {wordCount.toLocaleString()}{' '}
            palabras
          </span>

          <span className="statusbar-characters">
            {visibleContent.length.toLocaleString()}{' '}
            caracteres
          </span>

          {!selectedVersion && (
            <span
              className={
                draftStatus ===
                'pending'
                  ? 'statusbar-state save-status pending'
                  : 'statusbar-state save-status'
              }
            >
              {draftStatus ===
              'pending'
                ? 'Guardando…'
                : 'Guardado local'}
            </span>
          )}

          {selectedVersion && (
            <span className="statusbar-state statusbar-readonly">
              Solo lectura
            </span>
          )}
        </footer>
      )}

      {!focusMode && (
        <nav
          className="mobile-editor-navigation"
          aria-label="Navegación del editor"
        >
          <button
            type="button"
            className={
              view === 'edit' &&
              !search.open
                ? 'active'
                : ''
            }
            aria-pressed={
              view === 'edit' &&
              !search.open
            }
            onClick={
              handleMobileShowEdit
            }
          >
            <span className="mobile-editor-navigation-icon">
              ✎
            </span>

            <span>
              Editar
            </span>
          </button>

          <button
            type="button"
            className={
              view === 'preview' &&
              !search.open
                ? 'active'
                : ''
            }
            aria-pressed={
              view === 'preview' &&
              !search.open
            }
            onClick={
              handleMobileShowPreview
            }
          >
            <span className="mobile-editor-navigation-icon">
              ◉
            </span>

            <span>
              Preview
            </span>
          </button>

          <button
            type="button"
            className={
              search.open
                ? 'active'
                : ''
            }
            aria-pressed={
              search.open
            }
            onClick={
              handleMobileOpenSearch
            }
          >
            <span className="mobile-editor-navigation-icon">
              ⌕
            </span>

            <span>
              Buscar
            </span>
          </button>
          <button
            type="button"
            className={
              commandPaletteOpen
                ? 'active'
                : ''
            }
            aria-pressed={
              commandPaletteOpen
            }
            onClick={() =>
              setCommandPaletteOpen(
                true,
              )
            }
          >
            <span className="mobile-editor-navigation-icon">
              ⋯
            </span>

            <span>
              Comandos
            </span>
          </button>
        </nav>
      )}

      {/* ==================================================
          COMMAND PALETTE
          ================================================== */}

      {commandPaletteOpen && (
        <CommandPalette
          items={
            commandPaletteItems
          }

          onClose={() =>
            setCommandPaletteOpen(
              false,
            )
          }
        />
      )}
    </section>
  )
}