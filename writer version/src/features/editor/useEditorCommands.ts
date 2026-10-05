import {
  useEffect,
  useRef,
} from 'react'

import type {
  RefObject,
} from 'react'

import {
  clearFormatting,
  insertImage,
  insertLink,
  insertSeparator,
  setHeading,
  toggleBulletList,
  toggleDialogue,
  toggleInlineFormat,
  toggleOrderedList,
  toggleQuote,
} from './editor.commands'

import type {
  EditorCommandResult,
} from './editor.commands'

interface UseEditorCommandsOptions {
  content: string

  historyKey: string

  readOnly: boolean

  textareaRef:
    RefObject<
      HTMLTextAreaElement | null
    >

  onChange:
    (
      value: string,
    ) => void
}

const MAX_HISTORY = 100

export function useEditorCommands({
  content,
  historyKey,
  readOnly,
  textareaRef,
  onChange,
}: UseEditorCommandsOptions) {

  const pastRef =
    useRef<string[]>([])

  const futureRef =
    useRef<string[]>([])

  const typingSessionRef =
    useRef(false)

  const typingTimeoutRef =
    useRef<
      number | null
    >(null)

  /**
   * Nueva historia/capítulo:
   * no arrastramos undo/redo del documento anterior.
   */
  useEffect(() => {
    pastRef.current = []
    futureRef.current = []
    typingSessionRef.current =
      false

    if (
      typingTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimeoutRef.current,
      )

      typingTimeoutRef.current =
        null
    }
  }, [historyKey])

  useEffect(
    () => () => {
      if (
        typingTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          typingTimeoutRef.current,
        )
      }
    },
    [],
  )

  function getSelection() {
    const textarea =
      textareaRef.current

    if (!textarea) {
      return {
        start:
          content.length,

        end:
          content.length,
      }
    }

    return {
      start:
        textarea.selectionStart,

      end:
        textarea.selectionEnd,
    }
  }

  function restoreSelection(
    start: number,
    end: number,
  ) {
    window.requestAnimationFrame(
      () => {
        const textarea =
          textareaRef.current

        if (!textarea) {
          return
        }

        textarea.focus()

        textarea.setSelectionRange(
          start,
          end,
        )
      },
    )
  }

  function pushHistory(
    value: string,
  ) {
    const last =
      pastRef.current[
        pastRef.current.length -
          1
      ]

    if (last === value) {
      return
    }

    pastRef.current.push(
      value,
    )

    if (
      pastRef.current.length >
      MAX_HISTORY
    ) {
      pastRef.current.shift()
    }
  }

  function finishTypingSession() {
    typingSessionRef.current =
      false

    if (
      typingTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimeoutRef.current,
      )

      typingTimeoutRef.current =
        null
    }
  }

  function applyResult(
    result:
      EditorCommandResult,
  ) {
    if (
      readOnly ||
      result.content ===
        content
    ) {
      return
    }

    finishTypingSession()

    pushHistory(
      content,
    )

    futureRef.current = []

    onChange(
      result.content,
    )

    restoreSelection(
      result.selectionStart,
      result.selectionEnd,
    )
  }

  function execute(
    command: (
      content: string,
      start: number,
      end: number,
    ) => EditorCommandResult,
  ) {
    if (readOnly) {
      return
    }

    const selection =
      getSelection()

    applyResult(
      command(
        content,
        selection.start,
        selection.end,
      ),
    )
  }

  /**
   * Las pulsaciones consecutivas se agrupan
   * en una sola entrada del historial.
   */
  function handleTextChange(
    value: string,
  ) {
    if (readOnly) {
      return
    }

    if (
      !typingSessionRef.current
    ) {
      pushHistory(
        content,
      )

      futureRef.current = []

      typingSessionRef.current =
        true
    }

    if (
      typingTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimeoutRef.current,
      )
    }

    typingTimeoutRef.current =
      window.setTimeout(
        () => {
          typingSessionRef.current =
            false

          typingTimeoutRef.current =
            null
        },
        600,
      )

    onChange(value)
  }

  function undo() {
    if (readOnly) {
      return
    }

    finishTypingSession()

    const previous =
      pastRef.current.pop()

    if (
      previous ===
      undefined
    ) {
      return
    }

    futureRef.current.push(
      content,
    )

    onChange(previous)

    restoreSelection(
      previous.length,
      previous.length,
    )
  }

  function redo() {
    if (readOnly) {
      return
    }

    finishTypingSession()

    const next =
      futureRef.current.pop()

    if (
      next === undefined
    ) {
      return
    }

    pushHistory(
      content,
    )

    onChange(next)

    restoreSelection(
      next.length,
      next.length,
    )
  }

  function bold() {
    execute(
      (
        value,
        start,
        end,
      ) =>
        toggleInlineFormat(
          value,
          start,
          end,
          '**',
          '**',
          'texto',
        ),
    )
  }

  function italic() {
    execute(
      (
        value,
        start,
        end,
      ) =>
        toggleInlineFormat(
          value,
          start,
          end,
          '*',
          '*',
          'texto',
        ),
    )
  }

  function strike() {
    execute(
      (
        value,
        start,
        end,
      ) =>
        toggleInlineFormat(
          value,
          start,
          end,
          '~~',
          '~~',
          'texto',
        ),
    )
  }

  function code() {
    execute(
      (
        value,
        start,
        end,
      ) =>
        toggleInlineFormat(
          value,
          start,
          end,
          '`',
          '`',
          'código',
        ),
    )
  }

  function heading1() {
    execute(
      (
        value,
        start,
        end,
      ) =>
        setHeading(
          value,
          start,
          end,
          1,
        ),
    )
  }

  function heading2() {
    execute(
      (
        value,
        start,
        end,
      ) =>
        setHeading(
          value,
          start,
          end,
          2,
        ),
    )
  }

  function heading3() {
    execute(
      (
        value,
        start,
        end,
      ) =>
        setHeading(
          value,
          start,
          end,
          3,
        ),
    )
  }

  function quote() {
    execute(
      toggleQuote,
    )
  }

  function bulletList() {
    execute(
      toggleBulletList,
    )
  }

  function orderedList() {
    execute(
      toggleOrderedList,
    )
  }

  function separator() {
    execute(
      insertSeparator,
    )
  }

  function link() {
    execute(
      insertLink,
    )
  }

  function image() {
    execute(
      insertImage,
    )
  }

  function clean() {
    execute(
      clearFormatting,
    )
  }

  function dialogue() {
    execute(
      toggleDialogue,
    )
  }

  function thought() {
    italic()
  }

  function handleKeyDown(
    event:
      React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    const modifier =
      event.ctrlKey ||
      event.metaKey

    if (!modifier) {
      return
    }

    const key =
      event.key.toLowerCase()

    if (
      key === 'b'
    ) {
      event.preventDefault()

      bold()

      return
    }

    if (
      key === 'i'
    ) {
      event.preventDefault()

      italic()

      return
    }

    if (
      key === 's' &&
      event.shiftKey
    ) {
      event.preventDefault()

      strike()

      return
    }

    if (
      key === 'z' &&
      event.shiftKey
    ) {
      event.preventDefault()

      redo()

      return
    }

    if (
      key === 'z'
    ) {
      event.preventDefault()

      undo()

      return
    }

    if (
      key === 'y'
    ) {
      event.preventDefault()

      redo()
    }
  }

  return {
    applyEdit:
      applyResult,

    handleTextChange,
    handleKeyDown,

    undo,
    redo,

    bold,
    italic,
    strike,
    code,

    dialogue,
    thought,

    heading1,
    heading2,
    heading3,

    quote,
    bulletList,
    orderedList,

    separator,
    link,
    image,

    clean,
  }
}