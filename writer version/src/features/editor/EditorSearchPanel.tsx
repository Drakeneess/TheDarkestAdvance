import type {
  KeyboardEventHandler,
  RefObject,
} from 'react'

interface EditorSearchPanelProps {
  mode:
    | 'find'
    | 'replace'

  searchTerm: string
  replaceTerm: string

  currentMatchNumber: number
  matchCount: number

  caseSensitive: boolean
  readOnly: boolean

  searchInputRef:
    RefObject<
      HTMLInputElement | null
    >

  replaceInputRef:
    RefObject<
      HTMLInputElement | null
    >

  onSearchChange:
    (
      value: string,
    ) => void

  onReplaceChange:
    (
      value: string,
    ) => void

  onSearchKeyDown:
    KeyboardEventHandler<
      HTMLInputElement
    >

  onReplaceKeyDown:
    KeyboardEventHandler<
      HTMLInputElement
    >

  onPrevious:
    () => void

  onNext:
    () => void

  onToggleCaseSensitive:
    () => void

  onShowReplace:
    () => void

  onReplaceCurrent:
    () => void

  onReplaceAll:
    () => void

  onClose:
    () => void
}

export function EditorSearchPanel({
  mode,

  searchTerm,
  replaceTerm,

  currentMatchNumber,
  matchCount,

  caseSensitive,
  readOnly,

  searchInputRef,
  replaceInputRef,

  onSearchChange,
  onReplaceChange,

  onSearchKeyDown,
  onReplaceKeyDown,

  onPrevious,
  onNext,

  onToggleCaseSensitive,
  onShowReplace,

  onReplaceCurrent,
  onReplaceAll,

  onClose,
}: EditorSearchPanelProps) {
  return (
    <div
      className="editor-search-panel"
      role="search"
      aria-label="Buscar en el capítulo"
    >
      <div className="editor-search-row">
        <input
          ref={
            searchInputRef
          }
          value={
            searchTerm
          }
          placeholder="Buscar en el capítulo"
          onChange={(
            event,
          ) =>
            onSearchChange(
              event.target.value,
            )
          }
          onKeyDown={
            onSearchKeyDown
          }
        />

        <div className="editor-search-controls">
          <span
            className="editor-search-counter"
            aria-live="polite"
          >
            {currentMatchNumber}
            {' / '}
            {matchCount}
          </span>

          <button
            type="button"
            title="Coincidencia anterior"
            aria-label="Coincidencia anterior"
            disabled={
              matchCount === 0
            }
            onClick={
              onPrevious
            }
          >
            ↑
          </button>

          <button
            type="button"
            title="Siguiente coincidencia"
            aria-label="Siguiente coincidencia"
            disabled={
              matchCount === 0
            }
            onClick={
              onNext
            }
          >
            ↓
          </button>

          <button
            type="button"
            className={
              caseSensitive
                ? 'active'
                : ''
            }
            title="Distinguir mayúsculas y minúsculas"
            aria-label="Distinguir mayúsculas y minúsculas"
            aria-pressed={
              caseSensitive
            }
            onClick={
              onToggleCaseSensitive
            }
          >
            Aa
          </button>

          {mode ===
            'find' && (
            <button
              type="button"
              className="editor-search-text-button"
              onClick={
                onShowReplace
              }
            >
              Reemplazar
            </button>
          )}

          <button
            type="button"
            className="editor-search-close"
            title="Cerrar"
            aria-label="Cerrar búsqueda"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </div>
      </div>

      {mode ===
        'replace' && (
        <div className="editor-search-row editor-replace-row">
          <input
            ref={
              replaceInputRef
            }
            value={
              replaceTerm
            }
            placeholder="Reemplazar por…"
            disabled={
              readOnly
            }
            onChange={(
              event,
            ) =>
              onReplaceChange(
                event.target.value,
              )
            }
            onKeyDown={
              onReplaceKeyDown
            }
          />

          <div className="editor-replace-actions">
            <button
              type="button"
              className="editor-search-text-button"
              disabled={
                readOnly ||
                matchCount === 0
              }
              onClick={
                onReplaceCurrent
              }
            >
              Reemplazar
            </button>

            <button
              type="button"
              className="editor-search-text-button"
              disabled={
                readOnly ||
                matchCount === 0
              }
              onClick={
                onReplaceAll
              }
            >
              Todo
            </button>

            {readOnly && (
              <span className="editor-search-readonly">
                Solo lectura
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}