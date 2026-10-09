import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useSortable,
} from '@dnd-kit/sortable'

import {
  CSS,
} from '@dnd-kit/utilities'

import type {
  Chapter,
} from '../../domain/models'

interface ChapterItemProps {
  chapter: Chapter

  isSelected: boolean

  canMoveUp: boolean
  canMoveDown: boolean

  onSelect:
    () => void

  onRename:
    (
      title: string,
    ) => void

  onMoveUp:
    () => void

  onMoveDown:
    () => void

  onDuplicate:
    () => void

  onDelete:
    () => void
}

export function ChapterItem({
  chapter,

  isSelected,

  canMoveUp,
  canMoveDown,

  onSelect,
  onRename,

  onMoveUp,
  onMoveDown,

  onDuplicate,
  onDelete,
}: ChapterItemProps) {
  const itemRef =
    useRef<HTMLDivElement>(
      null,
    )

  const [
    isRenaming,
    setIsRenaming,
  ] =
    useState(false)

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false)

  const [
    renameValue,
    setRenameValue,
  ] =
    useState(
      chapter.title,
    )

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } =
    useSortable({
      id:
        chapter.id,

      disabled:
        isRenaming,
    })

  function setItemRef(
    node:
      | HTMLDivElement
      | null,
  ) {
    itemRef.current =
      node

    setNodeRef(
      node,
    )
  }

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
        event.key ===
        'Escape'
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
      chapter.title,
    )

    setIsRenaming(true)
  }

  function cancelRename() {
    setRenameValue(
      chapter.title,
    )

    setIsRenaming(false)
  }

  function submitRename() {
    const title =
      renameValue.trim()

    if (!title) {
      return
    }

    onRename(
      title,
    )

    setIsRenaming(false)
  }

  function handleMoveUp() {
    setMenuOpen(false)

    onMoveUp()
  }

  function handleMoveDown() {
    setMenuOpen(false)

    onMoveDown()
  }

  function handleDuplicate() {
    setMenuOpen(false)

    onDuplicate()
  }

  function handleDelete() {
    setMenuOpen(false)

    const accepted =
      window.confirm(
        `¿Eliminar el capítulo "${chapter.title}"?\n\nTambién se eliminarán todos sus snapshots.`,
      )

    if (!accepted) {
      return
    }

    onDelete()
  }

  return (
    <div
      ref={
        setItemRef
      }
      style={{
        transform:
          isDragging
            ? undefined
            : CSS.Transform.toString(
                transform,
              ),

        transition:
          isDragging
            ? undefined
            : transition,
      }}
      className={[
        'chapter-item',

        isSelected
          ? 'active'
          : '',

        menuOpen
          ? 'mobile-menu-open'
          : '',

        isDragging
          ? 'dragging'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="chapter-item-main">
        <button
          type="button"
          className="chapter-drag-handle"
          disabled={
            isRenaming
          }
          aria-label={
            `Reordenar ${chapter.title}`
          }
          title="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <button
          type="button"
          className="chapter-item-select"
          onClick={
            handleSelect
          }
        >
          <small>
            {String(
              chapter.order,
            ).padStart(
              3,
              '0',
            )}
          </small>

          <span>
            {chapter.title}
          </span>
        </button>

        {!isRenaming && (
          <button
            type="button"
            className="mobile-item-menu-trigger"
            aria-label={
              `Acciones de ${chapter.title}`
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
          className="chapter-rename-form"
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
          <div className="chapter-item-actions">
            <button
              type="button"
              title="Mover arriba"
              disabled={
                !canMoveUp
              }
              onClick={
                onMoveUp
              }
            >
              ↑
            </button>

            <button
              type="button"
              title="Mover abajo"
              disabled={
                !canMoveDown
              }
              onClick={
                onMoveDown
              }
            >
              ↓
            </button>

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
                disabled={
                  !canMoveUp
                }
                onClick={
                  handleMoveUp
                }
              >
                Mover arriba
              </button>

              <button
                type="button"
                role="menuitem"
                disabled={
                  !canMoveDown
                }
                onClick={
                  handleMoveDown
                }
              >
                Mover abajo
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