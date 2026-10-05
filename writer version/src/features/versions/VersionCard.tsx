import {
  useState,
} from 'react'

import type {
  ChapterVersion,
} from '../../domain/models'

interface VersionCardProps {
  version:
    ChapterVersion

  indexNumber:
    number

  isCurrent:
    boolean

  isSelected:
    boolean

  isLeftCompare:
    boolean

  isRightCompare:
    boolean

  onSelect:
    () => void

  onRename:
    (
      label: string,
    ) => void

  onDuplicate:
    () => void

  onDelete:
    () => void
}

export function VersionCard({
  version,
  indexNumber,

  isCurrent,
  isSelected,

  isLeftCompare,
  isRightCompare,

  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: VersionCardProps) {
  const [
    isRenaming,
    setIsRenaming,
  ] = useState(false)

  const [
    renameValue,
    setRenameValue,
  ] =
    useState(
      version.label,
    )

  function startRename() {
    setRenameValue(
      version.label,
    )

    setIsRenaming(true)
  }

  function cancelRename() {
    setRenameValue(
      version.label,
    )

    setIsRenaming(false)
  }

  function submitRename() {
    const label =
      renameValue.trim()

    if (!label) {
      return
    }

    onRename(label)

    setIsRenaming(false)
  }

  function handleDelete() {
    const accepted =
      window.confirm(
        `¿Eliminar la versión "${version.label}"?\n\nEsta acción no elimina el borrador.`,
      )

    if (!accepted) {
      return
    }

    onDelete()
  }

  return (
    <div
      className={[
        'version-card',

        isSelected
          ? 'selected'
          : '',

        isCurrent
          ? 'current'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="version-card-select"
        onClick={
          onSelect
        }
      >
        <div className="version-card-top">
          <strong>
            {version.label}
          </strong>

          <div className="version-badges">
            {isLeftCompare && (
              <span className="compare-badge">
                base
              </span>
            )}

            {isRightCompare && (
              <span className="compare-badge">
                contra
              </span>
            )}

            {isCurrent && (
              <span className="current-badge">
                actual
              </span>
            )}
          </div>
        </div>

        <span className="version-date">
          {new Date(
            version.createdAt,
          ).toLocaleString()}
        </span>

        <div className="version-meta-row">
          <span className="version-meta">
            {version.content.length.toLocaleString()}{' '}
            caracteres
          </span>

          <span className="version-index">
            #{indexNumber}
          </span>
        </div>
      </button>

      {isRenaming ? (
        <form
          className="version-rename-form"
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
        <div className="version-card-actions">
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
      )}
    </div>
  )
}