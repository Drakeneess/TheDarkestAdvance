import {
  useMemo,
  useState,
} from 'react'

export interface CommandPaletteItem {
  id: string

  label: string

  description?: string

  category?: string

  shortcut?: string

  keywords?: string[]

  disabled?: boolean

  action:
    () => void
}

interface CommandPaletteProps {
  items:
    CommandPaletteItem[]

  onClose:
    () => void
}

function normalize(
  value: string,
) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
}

function matchesCommand(
  item:
    CommandPaletteItem,

  query: string,
) {
  const normalizedQuery =
    normalize(
      query.trim(),
    )

  if (!normalizedQuery) {
    return true
  }

  const searchable =
    [
      item.label,
      item.description ?? '',
      item.category ?? '',
      item.shortcut ?? '',
      ...(item.keywords ?? []),
    ].join(' ')

  return normalize(
    searchable,
  ).includes(
    normalizedQuery,
  )
}

export function CommandPalette({
  items,
  onClose,
}: CommandPaletteProps) {
  const [
    query,
    setQuery,
  ] = useState('')

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0)

  const filteredItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            matchesCommand(
              item,
              query,
            ),
        ),
      [
        items,
        query,
      ],
    )

  const safeActiveIndex =
    filteredItems.length === 0
      ? -1
      : Math.min(
          activeIndex,
          filteredItems.length - 1,
        )

  function moveSelection(
    direction:
      | 1
      | -1,
  ) {
    if (
      filteredItems.length === 0
    ) {
      return
    }

    let nextIndex =
      safeActiveIndex

    for (
      let attempt = 0;
      attempt <
      filteredItems.length;
      attempt += 1
    ) {
      nextIndex =
        (
          nextIndex +
          direction +
          filteredItems.length
        ) %
        filteredItems.length

      if (
        !filteredItems[
          nextIndex
        ].disabled
      ) {
        setActiveIndex(
          nextIndex,
        )

        return
      }
    }
  }

  function runCommand(
    item:
      CommandPaletteItem,
  ) {
    if (item.disabled) {
      return
    }

    item.action()

    onClose()
  }

  function handleQueryChange(
    value: string,
  ) {
    setQuery(value)

    const nextItems =
      items.filter(
        (item) =>
          matchesCommand(
            item,
            value,
          ),
      )

    const firstEnabled =
      nextItems.findIndex(
        (item) =>
          !item.disabled,
      )

    setActiveIndex(
      firstEnabled >= 0
        ? firstEnabled
        : 0,
    )
  }

  return (
    <div
      className="command-palette-backdrop"
      onPointerDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
      >
        <div className="command-palette-search">
          <span>
            ›
          </span>

          <input
            autoFocus
            value={
              query
            }
            placeholder="Buscar comando..."
            onChange={(
              event,
            ) =>
              handleQueryChange(
                event.target.value,
              )
            }
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                'Escape'
              ) {
                event.preventDefault()
                event.stopPropagation()

                onClose()

                return
              }

              if (
                event.key ===
                'ArrowDown'
              ) {
                event.preventDefault()

                moveSelection(
                  1,
                )

                return
              }

              if (
                event.key ===
                'ArrowUp'
              ) {
                event.preventDefault()

                moveSelection(
                  -1,
                )

                return
              }

              if (
                event.key !==
                'Enter'
              ) {
                return
              }

              event.preventDefault()

              if (
                safeActiveIndex <
                0
              ) {
                return
              }

              const item =
                filteredItems[
                  safeActiveIndex
                ]

              runCommand(
                item,
              )
            }}
          />

          <kbd>
            Esc
          </kbd>

          <button
            type="button"
            className="command-palette-close"
            aria-label="Cerrar paleta de comandos"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </div>

        <div className="command-palette-results">
          {filteredItems.length ===
          0 ? (
            <div className="command-palette-empty">
              No hay comandos
              que coincidan.
            </div>
          ) : (
            filteredItems.map(
              (
                item,
                index,
              ) => (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  disabled={
                    item.disabled
                  }
                  className={[
                    'command-palette-item',

                    index ===
                    safeActiveIndex
                      ? 'active'
                      : '',
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(' ')}
                  onMouseEnter={() => {
                    if (
                      !item.disabled
                    ) {
                      setActiveIndex(
                        index,
                      )
                    }
                  }}
                  onClick={() =>
                    runCommand(
                      item,
                    )
                  }
                >
                  <div className="command-palette-item-content">
                    <div className="command-palette-item-title">
                      <strong>
                        {
                          item.label
                        }
                      </strong>

                      {item.category && (
                        <span>
                          {
                            item.category
                          }
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <small>
                        {
                          item.description
                        }
                      </small>
                    )}
                  </div>

                  {item.shortcut && (
                    <kbd>
                      {
                        item.shortcut
                      }
                    </kbd>
                  )}
                </button>
              ),
            )
          )}
        </div>

        <footer className="command-palette-footer">
          <span>
            ↑ ↓ navegar
          </span>

          <span>
            Enter ejecutar
          </span>

          <span>
            Esc cerrar
          </span>
        </footer>
      </div>
    </div>
  )
}