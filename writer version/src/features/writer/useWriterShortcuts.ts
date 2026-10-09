import {
  useEffect,
} from 'react'

interface WriterShortcutsOptions {
  onPreviousChapter:
    () => void

  onNextChapter:
    () => void
}

export function useWriterShortcuts({
  onPreviousChapter,
  onNextChapter,
}: WriterShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      /**
       * Ctrl/Cmd + K
       * búsqueda global.
       */
      if (
  (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === 'k'
  ) {
    if (
      isMobileViewport()
    ) {
      return
    }

    event.preventDefault()

        window.dispatchEvent(
          new Event(
            'writer:focus-search',
          ),
        )

        return
      }

      /**
       * Alt + ↑
       * capítulo anterior.
       */
      if (
        event.altKey &&
        event.key ===
          'ArrowUp'
      ) {
        event.preventDefault()

        onPreviousChapter()

        return
      }

      /**
       * Alt + ↓
       * siguiente capítulo.
       */
      if (
        event.altKey &&
        event.key ===
          'ArrowDown'
      ) {
        event.preventDefault()

        onNextChapter()
      }
    }

    function isMobileViewport() {
      return window.matchMedia(
        '(max-width: 760px)',
      ).matches
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    onPreviousChapter,
    onNextChapter,
  ])
}