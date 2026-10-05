import {
  useEffect,
  useState,
} from 'react'

export function useFocusMode() {
  const [
    isFocusMode,
    setIsFocusMode,
  ] = useState(false)

  function enterFocusMode() {
    setIsFocusMode(true)
  }

  function exitFocusMode() {
    setIsFocusMode(false)
  }

  function toggleFocusMode() {
    setIsFocusMode(
      (current) =>
        !current,
    )
  }

  useEffect(() => {
    if (!isFocusMode) {
      return
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      /**
       * SearchPanel también usa Escape.
       * Si ya consumió el evento,
       * no cerramos Focus Mode.
       */
      if (
        event.defaultPrevented ||
        event.key !== 'Escape'
      ) {
        return
      }

      exitFocusMode()
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
  }, [isFocusMode])

  return {
    isFocusMode,

    enterFocusMode,
    exitFocusMode,
    toggleFocusMode,
  }
}