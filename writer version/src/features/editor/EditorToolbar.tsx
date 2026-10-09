import {
  useEffect,
  useRef,
  useState,
} from 'react'

interface EditorToolbarProps {
  onUndo: () => void
  onRedo: () => void

  onBold: () => void
  onItalic: () => void
  onStrike: () => void
  onCode: () => void

  onHeading1: () => void
  onHeading2: () => void
  onHeading3: () => void

  onQuote: () => void
  onBulletList: () => void
  onOrderedList: () => void

  onSeparator: () => void
  onLink: () => void
  onImage: () => void

  onClean: () => void
  onDialogue: () => void
  onThought: () => void
}

type MobileFormatMenu =
  | 'text'
  | 'more'
  | null

export function EditorToolbar({
  onUndo,
  onRedo,

  onBold,
  onItalic,
  onStrike,
  onCode,

  onHeading1,
  onHeading2,
  onHeading3,

  onQuote,
  onBulletList,
  onOrderedList,

  onSeparator,
  onLink,
  onImage,

  onClean,
  onDialogue,
  onThought,
}: EditorToolbarProps) {
  const [
    mobileMenu,
    setMobileMenu,
  ] =
    useState<MobileFormatMenu>(
      null,
    )

  const mobileToolbarRef =
    useRef<HTMLDivElement>(
      null,
    )

  useEffect(() => {
    if (!mobileMenu) {
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
        mobileToolbarRef.current
          ?.contains(target)
      ) {
        return
      }

      setMobileMenu(null)
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        setMobileMenu(null)
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
  }, [
    mobileMenu,
  ])

  function runMobileAction(
    action: () => void,
  ) {
    setMobileMenu(null)

    action()
  }

  function preventFocusLoss(
    event:
      React.PointerEvent<
        HTMLButtonElement
      >,
  ) {
    event.preventDefault()
  }

  return (
    <>
      {/* ==========================================
          DESKTOP
          ========================================== */}

      <div className="format-toolbar format-toolbar-desktop">
        <div className="format-toolbar-group">
          <button
            type="button"
            title="Deshacer"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onUndo
            }
          >
            ↶
          </button>

          <button
            type="button"
            title="Rehacer"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onRedo
            }
          >
            ↷
          </button>
        </div>

        <span className="format-toolbar-separator" />

        <div className="format-toolbar-group">
          <button
            type="button"
            className="format-bold"
            title="Negrita"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onBold
            }
          >
            B
          </button>

          <button
            type="button"
            className="format-italic"
            title="Cursiva"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onItalic
            }
          >
            I
          </button>

          <button
            type="button"
            className="format-strike"
            title="Tachado"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onStrike
            }
          >
            S
          </button>

          <button
            type="button"
            className="format-code"
            title="Código"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onCode
            }
          >
            {'</>'}
          </button>
        </div>

        <span className="format-toolbar-separator" />

        <div className="format-toolbar-group">
          <button
            type="button"
            className="format-dialogue"
            title="Convertir en diálogo"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onDialogue
            }
          >
            —
          </button>

          <button
            type="button"
            className="format-thought"
            title="Pensamiento"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onThought
            }
          >
            Pens.
          </button>
        </div>

        <span className="format-toolbar-separator" />

        <div className="format-toolbar-group">
          <button
            type="button"
            title="Título principal"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onHeading1
            }
          >
            H1
          </button>

          <button
            type="button"
            title="Sección"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onHeading2
            }
          >
            H2
          </button>

          <button
            type="button"
            title="Subsección"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onHeading3
            }
          >
            H3
          </button>
        </div>

        <span className="format-toolbar-separator" />

        <div className="format-toolbar-group">
          <button
            type="button"
            title="Cita"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onQuote
            }
          >
            “”
          </button>

          <button
            type="button"
            title="Lista con viñetas"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onBulletList
            }
          >
            •
          </button>

          <button
            type="button"
            title="Lista numerada"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onOrderedList
            }
          >
            1.
          </button>

          <button
            type="button"
            title="Separador"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onSeparator
            }
          >
            ―
          </button>
        </div>

        <span className="format-toolbar-separator" />

        <div className="format-toolbar-group">
          <button
            type="button"
            title="Insertar enlace"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onLink
            }
          >
            Link
          </button>

          <button
            type="button"
            title="Insertar imagen"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onImage
            }
          >
            Img
          </button>
        </div>

        <div className="format-toolbar-spacer" />

        <div className="format-toolbar-group">
          <button
            type="button"
            title="Limpiar formato"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={
              onClean
            }
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ==========================================
          MOBILE
          ========================================== */}

      <div
        ref={
          mobileToolbarRef
        }
        className="format-toolbar-mobile-shell"
      >
        <div className="format-toolbar-mobile">
          <button
            type="button"
            className="format-bold"
            aria-label="Negrita"
            title="Negrita"
            onPointerDown={
              preventFocusLoss
            }
            onClick={
              onBold
            }
          >
            B
          </button>

          <button
            type="button"
            className="format-italic"
            aria-label="Cursiva"
            title="Cursiva"
            onPointerDown={
              preventFocusLoss
            }
            onClick={
              onItalic
            }
          >
            I
          </button>

          <button
            type="button"
            className="format-dialogue"
            aria-label="Diálogo"
            title="Diálogo"
            onPointerDown={
              preventFocusLoss
            }
            onClick={
              onDialogue
            }
          >
            —
          </button>

          <button
            type="button"
            className="format-thought-mobile"
            aria-label="Pensamiento"
            title="Pensamiento"
            onPointerDown={
              preventFocusLoss
            }
            onClick={
              onThought
            }
          >
            “ ”
          </button>

          <button
            type="button"
            className={
              mobileMenu === 'text'
                ? 'active'
                : ''
            }
            aria-label="Estilos de texto"
            aria-expanded={
              mobileMenu === 'text'
            }
            title="Estilos de texto"
            onPointerDown={
              preventFocusLoss
            }
            onClick={() =>
              setMobileMenu(
                mobileMenu ===
                  'text'
                  ? null
                  : 'text',
              )
            }
          >
            Aa
          </button>

          <button
            type="button"
            className={
              mobileMenu === 'more'
                ? 'active'
                : ''
            }
            aria-label="Más formato"
            aria-expanded={
              mobileMenu === 'more'
            }
            title="Más formato"
            onPointerDown={
              preventFocusLoss
            }
            onClick={() =>
              setMobileMenu(
                mobileMenu ===
                  'more'
                  ? null
                  : 'more',
              )
            }
          >
            ⋯
          </button>
        </div>

        {mobileMenu ===
          'text' && (
          <div className="mobile-format-menu">
            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onHeading1,
                )
              }
            >
              <strong>H1</strong>
              <span>
                Título principal
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onHeading2,
                )
              }
            >
              <strong>H2</strong>
              <span>
                Sección
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onHeading3,
                )
              }
            >
              <strong>H3</strong>
              <span>
                Subsección
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onQuote,
                )
              }
            >
              <strong>“ ”</strong>
              <span>
                Cita
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onStrike,
                )
              }
            >
              <strong>S</strong>
              <span>
                Tachado
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onCode,
                )
              }
            >
              <strong>
                {'</>'}
              </strong>
              <span>
                Código
              </span>
            </button>

            <button
              type="button"
              className="mobile-format-menu-wide"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onClean,
                )
              }
            >
              <strong>Aa</strong>
              <span>
                Limpiar formato
              </span>
            </button>
          </div>
        )}

        {mobileMenu ===
          'more' && (
          <div className="mobile-format-menu">
            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onUndo,
                )
              }
            >
              <strong>↶</strong>
              <span>
                Deshacer
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onRedo,
                )
              }
            >
              <strong>↷</strong>
              <span>
                Rehacer
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onBulletList,
                )
              }
            >
              <strong>•</strong>
              <span>
                Viñetas
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onOrderedList,
                )
              }
            >
              <strong>1.</strong>
              <span>
                Lista numerada
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onSeparator,
                )
              }
            >
              <strong>―</strong>
              <span>
                Separador
              </span>
            </button>

            <button
              type="button"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onLink,
                )
              }
            >
              <strong>↗</strong>
              <span>
                Enlace
              </span>
            </button>

            <button
              type="button"
              className="mobile-format-menu-wide"
              onPointerDown={
                preventFocusLoss
              }
              onClick={() =>
                runMobileAction(
                  onImage,
                )
              }
            >
              <strong>▧</strong>
              <span>
                Imagen
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}