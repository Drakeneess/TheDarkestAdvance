import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  Chapter,
  Story,
} from '../../domain/models'

interface SearchBarProps {
  stories: Story[]

  chapters: Chapter[]

  onSelectStory:
    (storyId: string) => void

  onSelectChapter:
    (chapter: Chapter) => void
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

function getSnippet(
  content: string,
  query: string,
) {
  const normalizedContent =
    normalize(content)

  const normalizedQuery =
    normalize(query)

  const matchIndex =
    normalizedContent.indexOf(
      normalizedQuery,
    )

  if (matchIndex === -1) {
    return content
      .replace(/\s+/g, ' ')
      .slice(0, 90)
  }

  const start =
    Math.max(
      0,
      matchIndex - 35,
    )

  const end =
    Math.min(
      content.length,
      matchIndex +
        query.length +
        55,
    )

  const snippet =
    content
      .slice(start, end)
      .replace(/\s+/g, ' ')

  return `${
    start > 0
      ? '…'
      : ''
  }${snippet}${
    end < content.length
      ? '…'
      : ''
  }`
}

export function SearchBar({
  stories,
  chapters,

  onSelectStory,
  onSelectChapter,
}: SearchBarProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    query,
    setQuery,
  ] = useState('')

  const [
    open,
    setOpen,
  ] = useState(false)

  useEffect(() => {
    function focusSearch() {
      inputRef.current?.focus()

      setOpen(true)
    }

    window.addEventListener(
      'writer:focus-search',
      focusSearch,
    )

    return () => {
      window.removeEventListener(
        'writer:focus-search',
        focusSearch,
      )
    }
  }, [])

  const storyMap =
    useMemo(
      () =>
        new Map(
          stories.map(
            (story) => [
              story.id,
              story,
            ],
          ),
        ),
      [stories],
    )

  const results =
    useMemo(() => {
      const trimmed =
        query.trim()

      if (!trimmed) {
        return {
          stories: [],
          chapters: [],
        }
      }

      const normalized =
        normalize(trimmed)

      const matchingStories =
        stories
          .filter((story) =>
            normalize(
              story.title,
            ).includes(
              normalized,
            ),
          )
          .slice(0, 5)

      const matchingChapters =
        chapters
          .filter(
            (chapter) => {
              const titleMatch =
                normalize(
                  chapter.title,
                ).includes(
                  normalized,
                )

              const contentMatch =
                normalize(
                  chapter.draftContent ??
                    '',
                ).includes(
                  normalized,
                )

              return (
                titleMatch ||
                contentMatch
              )
            },
          )
          .slice(0, 10)

      return {
        stories:
          matchingStories,

        chapters:
          matchingChapters,
      }
    }, [
      query,
      stories,
      chapters,
    ])

  const hasResults =
    results.stories.length >
      0 ||
    results.chapters.length >
      0

  function close() {
    setOpen(false)
  }

  return (
    <div className="global-search">
      <div className="global-search-input-wrapper">
        <span className="global-search-icon">
          ⌕
        </span>

        <input
          ref={inputRef}
          value={query}
          placeholder="Buscar..."
          onFocus={() =>
            setOpen(true)
          }
          onChange={(event) => {
            setQuery(
              event.target.value,
            )

            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (
              event.key ===
              'Escape'
            ) {
              close()

              inputRef.current?.blur()
            }
          }}
        />

        <span className="global-search-shortcut">
          Ctrl K
        </span>
      </div>

      {open &&
        query.trim() && (
          <div className="global-search-results">
            {!hasResults && (
              <div className="search-empty">
                Sin resultados
              </div>
            )}

            {results.stories.length >
              0 && (
              <section>
                <div className="search-group-title">
                  Historias
                </div>

                {results.stories.map(
                  (story) => (
                    <button
                      key={
                        story.id
                      }
                      type="button"
                      className="search-result"
                      onMouseDown={(
                        event,
                      ) =>
                        event.preventDefault()
                      }
                      onClick={() => {
                        onSelectStory(
                          story.id,
                        )

                        close()
                      }}
                    >
                      <strong>
                        {
                          story.title
                        }
                      </strong>

                      <span>
                        Historia
                      </span>
                    </button>
                  ),
                )}
              </section>
            )}

            {results.chapters.length >
              0 && (
              <section>
                <div className="search-group-title">
                  Capítulos
                </div>

                {results.chapters.map(
                  (chapter) => {
                    const story =
                      storyMap.get(
                        chapter.storyId,
                      )

                    return (
                      <button
                        key={
                          chapter.id
                        }
                        type="button"
                        className="search-result"
                        onMouseDown={(
                          event,
                        ) =>
                          event.preventDefault()
                        }
                        onClick={() => {
                          onSelectChapter(
                            chapter,
                          )

                          close()
                        }}
                      >
                        <strong>
                          {
                            chapter.title
                          }
                        </strong>

                        <span>
                          {
                            story?.title
                          }
                        </span>

                        {chapter.draftContent &&
                          normalize(
                            chapter.draftContent,
                          ).includes(
                            normalize(
                              query,
                            ),
                          ) && (
                            <small>
                              {getSnippet(
                                chapter.draftContent,
                                query,
                              )}
                            </small>
                          )}
                      </button>
                    )
                  },
                )}
              </section>
            )}
          </div>
        )}
    </div>
  )
}