import {
  useMemo,
  useState,
} from 'react'

import type {
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from 'react'

import type {
  EditorCommandResult,
} from './editor.commands'

type SearchMode =
  | 'find'
  | 'replace'

interface SearchMatch {
  start: number
  end: number
}

interface UseEditorSearchOptions {
  content: string

  readOnly: boolean

  textareaRef:
    RefObject<
      HTMLTextAreaElement | null
    >

  searchInputRef:
    RefObject<
      HTMLInputElement | null
    >

  replaceInputRef:
    RefObject<
      HTMLInputElement | null
    >

  onApplyEdit:
    (
      result:
        EditorCommandResult,
    ) => void
}

function escapeRegExp(
  value: string,
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  )
}

function findMatches(
  content: string,
  query: string,
  caseSensitive: boolean,
): SearchMatch[] {
  if (!query) {
    return []
  }

  const expression =
    new RegExp(
      escapeRegExp(query),

      caseSensitive
        ? 'gu'
        : 'giu',
    )

  const matches:
    SearchMatch[] = []

  for (
    const match of
    content.matchAll(
      expression,
    )
  ) {
    if (
      match.index ===
      undefined
    ) {
      continue
    }

    matches.push({
      start:
        match.index,

      end:
        match.index +
        match[0].length,
    })
  }

  return matches
}

export function useEditorSearch({
  content,
  readOnly,

  textareaRef,
  searchInputRef,
  replaceInputRef,

  onApplyEdit,
}: UseEditorSearchOptions) {
  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    mode,
    setMode,
  ] =
    useState<SearchMode>(
      'find',
    )

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const [
    replaceTerm,
    setReplaceTerm,
  ] = useState('')

  const [
    caseSensitive,
    setCaseSensitive,
  ] = useState(false)

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0)

  const matches =
    useMemo(
      () =>
        findMatches(
          content,
          searchTerm,
          caseSensitive,
        ),
      [
        content,
        searchTerm,
        caseSensitive,
      ],
    )

  const activeIndex =
    matches.length === 0
      ? -1
      : Math.min(
          currentIndex,
          matches.length - 1,
        )

  function focusField(
    targetMode:
      SearchMode,
    select = false,
  ) {
    window.requestAnimationFrame(
      () => {
        const input =
          targetMode ===
          'replace'
            ? replaceInputRef.current
            : searchInputRef.current

        if (!input) {
          return
        }

        input.focus()

        if (select) {
          input.select()
        }
      },
    )
  }

  function revealMatch(
    match: SearchMatch,
    targetMode:
        SearchMode = mode,
    ) {
    const textarea =
        textareaRef.current

    if (!textarea) {
        return
    }

    const activeElement =
        document.activeElement

    const searchHadFocus =
        activeElement ===
        searchInputRef.current ||
        activeElement ===
        replaceInputRef.current

    textarea.setSelectionRange(
        match.start,
        match.end,
    )

    /**
     * Calculamos aproximadamente dónde se encuentra
     * la coincidencia y desplazamos el textarea.
     */
    const beforeMatch =
        content.slice(
        0,
        match.start,
        )

    const lineNumber =
        beforeMatch.split(
        '\n',
        ).length - 1

    const computedStyle =
        window.getComputedStyle(
        textarea,
        )

    const parsedLineHeight =
        Number.parseFloat(
        computedStyle.lineHeight,
        )

    const lineHeight =
        Number.isFinite(
        parsedLineHeight,
        )
        ? parsedLineHeight
        : 28

    const targetScroll =
        lineNumber *
        lineHeight -
        textarea.clientHeight /
        2

    textarea.scrollTop =
        Math.max(
        0,
        targetScroll,
        )

    /**
     * Si veníamos escribiendo en el buscador,
     * mantenemos el foco ahí para poder continuar
     * escribiendo sin interrupciones.
     *
     * Si pulsamos un botón de navegación,
     * dejamos el foco en el editor para que
     * la coincidencia seleccionada sea visible.
     */
    if (searchHadFocus) {
        const input =
        targetMode ===
        'replace'
            ? replaceInputRef.current
            : searchInputRef.current

        window.requestAnimationFrame(
        () => {
            input?.focus({
            preventScroll: true,
            })
        },
        )

        return
    }

    textarea.focus({
        preventScroll: true,
    })
    }

  function openSearch(
    nextMode:
      SearchMode,
  ) {
    setOpen(true)

    setMode(
      nextMode,
    )

    const textarea =
      textareaRef.current

    if (textarea) {
      const selected =
        content.slice(
          textarea.selectionStart,
          textarea.selectionEnd,
        )

      /**
       * Si existe una selección razonable,
       * Ctrl+F / Ctrl+H la usa automáticamente.
       */
      if (
        selected &&
        selected.length <= 200 &&
        !selected.includes(
          '\n',
        )
      ) {
        setSearchTerm(
          selected,
        )

        const nextMatches =
          findMatches(
            content,
            selected,
            caseSensitive,
          )

        const index =
          nextMatches.findIndex(
            (match) =>
              match.start ===
              textarea.selectionStart,
          )

        setCurrentIndex(
          index >= 0
            ? index
            : 0,
        )

        focusField(
          nextMode,
          true,
        )

        return
      }
    }

    focusField(
      nextMode,
      false,
    )
  }

  function openFind() {
    openSearch(
      'find',
    )
  }

  function openReplace() {
    openSearch(
      'replace',
    )
  }

  function showReplace() {
    setMode(
      'replace',
    )

    focusField(
      'replace',
    )
  }

  function close() {
    setOpen(false)

    window.requestAnimationFrame(
      () => {
        textareaRef.current?.focus()
      },
    )
  }

  function handleSearchTermChange(
    value: string,
    ) {
    setSearchTerm(
        value,
    )

    setCurrentIndex(0)

    const nextMatches =
        findMatches(
        content,
        value,
        caseSensitive,
        )

    if (
        nextMatches.length === 0
    ) {
        return
    }

    revealMatch(
        nextMatches[0],
        'find',
    )
  }

  function handleReplaceTermChange(
    value: string,
  ) {
    setReplaceTerm(
      value,
    )
  }

  function toggleCaseSensitive() {
    const nextValue =
      !caseSensitive

    setCaseSensitive(
      nextValue,
    )

    setCurrentIndex(0)

    const nextMatches =
      findMatches(
        content,
        searchTerm,
        nextValue,
      )

    if (
      nextMatches.length >
      0
    ) {
      revealMatch(
        nextMatches[0],
        mode,
      )
    }
  }

  function nextMatch() {
    if (
        matches.length === 0
    ) {
        return
    }

    const nextIndex =
        activeIndex < 0
        ? 0
        : (
            activeIndex + 1
            ) %
            matches.length

    setCurrentIndex(
        nextIndex,
    )

    revealMatch(
        matches[
        nextIndex
        ],
    )
  }

  function previousMatch() {
    if (
        matches.length === 0
    ) {
        return
    }

    const nextIndex =
        activeIndex <= 0
        ? matches.length - 1
        : activeIndex - 1

    setCurrentIndex(
        nextIndex,
    )

    revealMatch(
        matches[
        nextIndex
        ],
    )
  }

  function replaceCurrent() {
    if (
      readOnly ||
      activeIndex < 0
    ) {
      return
    }

    const match =
      matches[
        activeIndex
      ]

    const nextContent =
      content.slice(
        0,
        match.start,
      ) +
      replaceTerm +
      content.slice(
        match.end,
      )

    onApplyEdit({
      content:
        nextContent,

      selectionStart:
        match.start,

      selectionEnd:
        match.start +
        replaceTerm.length,
    })

    const nextMatches =
      findMatches(
        nextContent,
        searchTerm,
        caseSensitive,
      )

    if (
      nextMatches.length === 0
    ) {
      setCurrentIndex(0)

      return
    }

    const afterReplacement =
      match.start +
      replaceTerm.length

    let nextIndex =
      nextMatches.findIndex(
        (candidate) =>
          candidate.start >=
          afterReplacement,
      )

    if (
      nextIndex === -1
    ) {
      nextIndex = 0
    }

    setCurrentIndex(
      nextIndex,
    )

    revealMatch(
      nextMatches[
        nextIndex
      ],
      'replace',
    )
  }

  function replaceAll() {
    if (
      readOnly ||
      matches.length === 0
    ) {
      return
    }

    let nextContent =
      content

    /**
     * Reemplazamos desde el final
     * para no invalidar los índices
     * de coincidencias anteriores.
     */
    for (
      const match of
      [...matches].reverse()
    ) {
      nextContent =
        nextContent.slice(
          0,
          match.start,
        ) +
        replaceTerm +
        nextContent.slice(
          match.end,
        )
    }

    onApplyEdit({
      content:
        nextContent,

      selectionStart: 0,
      selectionEnd: 0,
    })

    setCurrentIndex(0)

    const nextMatches =
      findMatches(
        nextContent,
        searchTerm,
        caseSensitive,
      )

    if (
      nextMatches.length >
      0
    ) {
      revealMatch(
        nextMatches[0],
        'replace',
      )
    }
  }

  function handleTextareaKeyDown(
    event:
      ReactKeyboardEvent<
        HTMLTextAreaElement
      >,
  ) {
    const modifier =
      event.ctrlKey ||
      event.metaKey

    if (
      modifier &&
      event.key.toLowerCase() ===
        'f'
    ) {
      event.preventDefault()

      openFind()

      return true
    }

    if (
      modifier &&
      event.key.toLowerCase() ===
        'h'
    ) {
      event.preventDefault()

      openReplace()

      return true
    }

    if (
      event.key ===
        'Escape' &&
      open
    ) {
      event.preventDefault()

      close()

      return true
    }

    return false
  }

  function handleSearchInputKeyDown(
    event:
      ReactKeyboardEvent<
        HTMLInputElement
      >,
  ) {
    if (
      event.key ===
      'Escape'
    ) {
      event.preventDefault()

      close()

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
      event.shiftKey
    ) {
      previousMatch()

      return
    }

    nextMatch()
  }

  function handleReplaceInputKeyDown(
    event:
      ReactKeyboardEvent<
        HTMLInputElement
      >,
  ) {
    if (
      event.key ===
      'Escape'
    ) {
      event.preventDefault()

      close()

      return
    }

    if (
      event.key ===
      'Enter'
    ) {
      event.preventDefault()

      replaceCurrent()
    }
  }

  return {
    open,
    mode,

    searchTerm,
    replaceTerm,

    caseSensitive,

    matches,

    currentMatchNumber:
      activeIndex >= 0
        ? activeIndex + 1
        : 0,

    openFind,
    openReplace,
    showReplace,
    close,

    handleSearchTermChange,
    handleReplaceTermChange,

    toggleCaseSensitive,

    nextMatch,
    previousMatch,

    replaceCurrent,
    replaceAll,

    handleTextareaKeyDown,
    handleSearchInputKeyDown,
    handleReplaceInputKeyDown,
  }
}