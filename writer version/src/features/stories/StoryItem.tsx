import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  Story,
} from '../../domain/models'

interface StoryItemProps {
  story: Story

  isSelected: boolean

  onSelect:
    () => void

  onRename:
    (
      title: string,
    ) => void

  onDuplicate:
    () => void

  onDelete:
    () => void

  onExport:
    () => void
}

export function StoryItem({
  story,

  isSelected,

  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
}: StoryItemProps) {
  const itemRef =
    useRef<HTMLDivElement>(
      null,
    )

  const [
    isRenaming,
    setIsRenaming,
  ] = useState(false)

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false)

  const [
    renameValue,
    setRenameValue,
  ] =
    useState(
      story.title,
    )

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      const target =
        event.target

      if (
        !(target instanceof Node)
      ) {
        return
      }

      if (
        itemRef.current?.contains(
          target,
        )
      ) {
        return
      }

      setMenuOpen(false)
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [menuOpen])

  function handleSelect() {
    setMenuOpen(false)

    onSelect()
  }

  function toggleMenu() {
    setMenuOpen(
      (current) =>
        !current,
    )
  }

  function startRename() {
    setMenuOpen(false)

    setRenameValue(
      story.title,
    )

    setIsRenaming(true)
  }

  function cancelRename() {
    setRenameValue(
      story.title,
    )

    setIsRenaming(false)
  }

  function submitRename() {
    const title =
      renameValue.trim()

    if (!title) {
      return
    }

    onRename(title)

    setIsRenaming(false)
  }

  function handleDuplicate() {
    setMenuOpen(false)

    onDuplicate()
  }

  function handleExport() {
    setMenuOpen(false)

    onExport()
  }

  function handleDelete() {
    setMenuOpen(false)

    const accepted =
      window.confirm(
        `¿Eliminar la historia "${story.title}"?\n\nSe eliminarán todos sus capítulos y snapshots.`,
      )

    if (!accepted) {
      return
    }

    onDelete()
  }

  return (
    <div
      ref={itemRef}
      className={[
        'story-item',

        isSelected
          ? 'active'
          : '',

        menuOpen
          ? 'mobile-menu-open'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="story-item-main">
        <button
          type="button"
          className="story-item-select"
          onClick={
            handleSelect
          }
        >
          <span>
            {story.title}
          </span>
        </button>

        {!isRenaming && (
          <button
            type="button"
            className="mobile-item-menu-trigger"
            aria-label={
              `Acciones de ${story.title}`
            }
            aria-haspopup="menu"
            aria-expanded={
              menuOpen
            }
            onClick={
              toggleMenu
            }
          >
            ⋮
          </button>
        )}
      </div>

      {isRenaming ? (
        <form
          className="story-rename-form"
          onSubmit={(event) => {
            event.preventDefault()

            submitRename()
          }}
        >
          <input
            autoFocus
            value={
              renameValue
            }
            onChange={(event) =>
              setRenameValue(
                event.target.value,
              )
            }
          />

          <button
            type="submit"
          >
            Guardar
          </button>

          <button
            type="button"
            onClick={
              cancelRename
            }
          >
            Cancelar
          </button>
        </form>
      ) : (
        <>
          <div className="story-item-actions">
            <button
              type="button"
              onClick={
                startRename
              }
            >
              Renombrar
            </button>

            <button
              type="button"
              onClick={
                onDuplicate
              }
            >
              Duplicar
            </button>

            <button
              type="button"
              onClick={
                onExport
              }
            >
              Exportar
            </button>

            <button
              type="button"
              className="danger"
              onClick={
                handleDelete
              }
            >
              Eliminar
            </button>
          </div>

          {menuOpen && (
            <div
              className="mobile-item-context-menu"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                onClick={
                  startRename
                }
              >
                Renombrar
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={
                  handleDuplicate
                }
              >
                Duplicar
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={
                  handleExport
                }
              >
                Exportar
              </button>

              <button
                type="button"
                role="menuitem"
                className="danger"
                onClick={
                  handleDelete
                }
              >
                Eliminar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}