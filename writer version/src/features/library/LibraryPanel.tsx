import {
  useState,
} from 'react'

import type {
  Chapter,
  Story,
} from '../../domain/models'

import {
  ChapterItem,
} from '../chapters/ChapterItem'

import {
  StoryItem,
} from '../stories/StoryItem'

import {
  StoryImportButton,
} from '../stories/StoryImportButton'

import {
  SearchBar,
} from '../search/SearchBar'

import {
  useHorizontalSwipe,
} from '../mobile/useHorizontalSwipe'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import type {
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core'

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'

type MobileLibraryView =
  | 'stories'
  | 'chapters'

interface LibraryPanelProps {
  stories:
    Story[]

  chapters:
    Chapter[]

  selectedStory:
    | Story
    | null

  selectedStoryId:
    | string
    | null

  selectedChapterId:
    | string
    | null

  newStoryTitle:
    string

  newChapterTitle:
    string

  allChapters:
    Chapter[]

  onNewStoryTitleChange:
    (
      value: string,
    ) => void

  onNewChapterTitleChange:
    (
      value: string,
    ) => void

  onCreateStory:
    () => void

  onCreateChapter:
    () => void

  onSelectStory:
    (
      storyId: string,
    ) => void

  onSelectChapter:
    (
      chapter: Chapter,
    ) => void

  onRenameChapter:
    (
      chapter: Chapter,
      title: string,
    ) => void

  onMoveChapter:
    (
      chapter: Chapter,
      direction:
        | 'up'
        | 'down',
    ) => void
  
  onReorderChapter:
    (
      chapterId: string,
      targetChapterId: string,
    ) => void

  onDuplicateChapter:
    (
      chapter: Chapter,
    ) => void

  onDeleteChapter:
    (
      chapter: Chapter,
    ) => void

  onRenameStory:
    (
      story: Story,
      title: string,
    ) => void

  onDuplicateStory:
    (
      story: Story,
    ) => void

  onDeleteStory:
    (
      story: Story,
    ) => void

  onExportStory:
    (
      story: Story,
    ) => void

  onImportedStory:
    (
      story: Story,
    ) => void

  onClose?:
    () => void
}

export function LibraryPanel({
  stories,
  chapters,

  selectedStory,
  selectedStoryId,
  selectedChapterId,

  newStoryTitle,
  newChapterTitle,

  onNewStoryTitleChange,
  onNewChapterTitleChange,

  onCreateStory,
  onCreateChapter,

  onSelectStory,
  onSelectChapter,

  onRenameChapter,
  onMoveChapter,
  onReorderChapter,
  onDuplicateChapter,
  onDeleteChapter,

  onRenameStory,
  onDuplicateStory,
  onDeleteStory,

  onExportStory,
  onImportedStory,

  allChapters,
  onClose,
}: LibraryPanelProps) {
  const [
    mobileView,
    setMobileView,
  ] =
    useState<
      MobileLibraryView
    >('stories')

  const [
    mobileSelectorOpen,
    setMobileSelectorOpen,
  ] =
    useState(false)

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 5,
          },
        },
      ),

      useSensor(
        KeyboardSensor,
        {
          coordinateGetter:
            sortableKeyboardCoordinates,
        },
      ),
    )

  const [
    activeChapterId,
    setActiveChapterId,
  ] = useState<string | null>(
    null,
  )

  const activeChapter =
    activeChapterId
      ? chapters.find(
          (chapter) =>
            chapter.id ===
            activeChapterId,
        ) ?? null
      : null

  function handleChapterDragStart(
    event: DragStartEvent,
  ) {
    setMobileSelectorOpen(false)

    setActiveChapterId(
      String(
        event.active.id,
      ),
    )
  }

  function handleChapterDragEnd(
    event: DragEndEvent,
  ) {
    const {
      active,
      over,
    } = event

    setActiveChapterId(
      null,
    )

    if (!over) {
      return
    }

    const activeId =
      String(
        active.id,
      )

    const overId =
      String(
        over.id,
      )

    if (
      activeId ===
      overId
    ) {
      return
    }

    onReorderChapter(
      activeId,
      overId,
    )
  }

  function handleChapterDragCancel() {
    setActiveChapterId(
      null,
    )
  }

  /**
   * No permitimos una vista de capítulos
   * si no existe una historia seleccionada.
   */
  const activeMobileView:
    MobileLibraryView =
      selectedStory
        ? mobileView
        : 'stories'

  const mobileSwipe =
  useHorizontalSwipe({
    onSwipeLeft: () => {
      setMobileSelectorOpen(
        false,
      )

      onClose?.()
    },

    onSwipeRight: () => {
      if (
        activeMobileView !==
        'chapters'
      ) {
        return
      }

      setMobileSelectorOpen(
        false,
      )

      setMobileView(
        'stories',
      )
    },
  })

  function selectStory(
    storyId: string,
  ) {
    onSelectStory(
      storyId,
    )

    /**
     * En móvil, seleccionar una historia
     * entra naturalmente al siguiente nivel:
     * sus capítulos.
     *
     * En desktop este estado no afecta
     * la visibilidad porque el CSS móvil
     * es quien interpreta estas clases.
     */
    setMobileView(
      'chapters',
    )
  }

  function selectChapter(
    chapter: Chapter,
  ) {
    onSelectChapter(
      chapter,
    )

    setMobileView(
      'chapters',
    )
  }

  return (
    <aside
      className="library-panel"
      {...mobileSwipe}
    >
      {onClose && (
        <header className="mobile-library-header">
          <div>
            <span>
              WRITER
            </span>

            <strong>
              Biblioteca
            </strong>
          </div>

          <button
            type="button"
            className="mobile-library-close"
            aria-label="Cerrar biblioteca"
            onClick={onClose}
          >
            ×
          </button>
        </header>
      )}

      <SearchBar
        stories={
          stories
        }
        chapters={
          allChapters
        }
        onSelectStory={
          selectStory
        }
        onSelectChapter={
          selectChapter
        }
      />

      <div className="mobile-library-view-selector">
        <button
          type="button"
          className="mobile-library-view-trigger"
          aria-haspopup="menu"
          aria-expanded={
            mobileSelectorOpen
          }
          onClick={() => {
            setMobileSelectorOpen(
              (open) =>
                !open,
            )
          }}
        >
          <span>
            {activeMobileView ===
            'stories'
              ? `Historias (${stories.length})`
              : `Capítulos (${chapters.length})`}
          </span>

          <span
            className={[
              'mobile-library-view-chevron',

              mobileSelectorOpen
                ? 'open'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {mobileSelectorOpen && (
          <div
            className="mobile-library-view-menu"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className={[
                'mobile-library-view-option',

                activeMobileView ===
                'stories'
                  ? 'active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setMobileView(
                  'stories',
                )

                setMobileSelectorOpen(
                  false,
                )
              }}
            >
              <span>
                Historias
              </span>

              <span className="mobile-library-view-count">
                {stories.length}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={
                !selectedStory
              }
              className={[
                'mobile-library-view-option',

                activeMobileView ===
                'chapters'
                  ? 'active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (
                  !selectedStory
                ) {
                  return
                }

                setMobileView(
                  'chapters',
                )

                setMobileSelectorOpen(
                  false,
                )
              }}
            >
              <span>
                Capítulos
              </span>

              <span className="mobile-library-view-count">
                {chapters.length}
              </span>
            </button>
          </div>
        )}
      </div>

      <section
        className={[
          'library-section',
          'stories-section',

          activeMobileView !==
          'stories'
            ? 'mobile-library-section-hidden'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="section-title-row">
          <span>
            Historias
          </span>

          <span className="counter">
            {stories.length}
          </span>
        </div>

        <form
          className="create-row"
          onSubmit={(event) => {
            event.preventDefault()

            onCreateStory()
          }}
        >
          <input
            value={
              newStoryTitle
            }
            onChange={(event) =>
              onNewStoryTitleChange(
                event.target.value,
              )
            }
            placeholder="Nueva historia"
          />

          <button
            type="submit"
            title="Crear historia"
          >
            +
          </button>
        </form>

        <StoryImportButton
          onImported={
            onImportedStory
          }
        />

        <nav className="story-list">
          {stories.map(
            (story) => (
              <StoryItem
                key={
                  story.id
                }
                story={
                  story
                }
                isSelected={
                  story.id ===
                  selectedStoryId
                }
                onSelect={() =>
                  selectStory(
                    story.id,
                  )
                }
                onRename={(
                  title,
                ) =>
                  onRenameStory(
                    story,
                    title,
                  )
                }
                onDuplicate={() =>
                  onDuplicateStory(
                    story,
                  )
                }
                onExport={() =>
                  onExportStory(
                    story,
                  )
                }
                onDelete={() =>
                  onDeleteStory(
                    story,
                  )
                }
              />
            ),
          )}
        </nav>
      </section>

      {selectedStory && (
        <section
          className={[
            'library-section',
            'chapters-section',

            activeMobileView !==
            'chapters'
              ? 'mobile-library-section-hidden'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="section-title-row chapter-section-title-row">
            <div className="chapter-section-heading">
              <button
                type="button"
                className="mobile-library-back"
                aria-label="Volver a historias"
                title="Volver a historias"
                onClick={() => {
                  setMobileView(
                    'stories',
                  )

                  setMobileSelectorOpen(
                    false,
                  )
                }}
              >
                ←
              </button>

              <span>
                Capítulos
              </span>
            </div>

            <span className="counter">
              {chapters.length}
            </span>
          </div>

          <form
            className="create-row"
            onSubmit={(event) => {
              event.preventDefault()

              onCreateChapter()
            }}
          >
            <input
              value={
                newChapterTitle
              }
              onChange={(event) =>
                onNewChapterTitleChange(
                  event.target.value,
                )
              }
              placeholder="Nuevo capítulo"
            />

            <button
              type="submit"
              title="Crear capítulo"
            >
              +
            </button>
          </form>

          <DndContext
            sensors={
              sensors
            }
            collisionDetection={
              closestCenter
            }
            autoScroll
            modifiers={[
              restrictToVerticalAxis,
              restrictToFirstScrollableAncestor,
            ]}
            onDragStart={
              handleChapterDragStart
            }
            onDragEnd={
              handleChapterDragEnd
            }
            onDragCancel={
              handleChapterDragCancel
            }
          >
            <SortableContext
              items={chapters.map(
                (chapter) =>
                  chapter.id,
              )}
              strategy={
                verticalListSortingStrategy
              }
            >
              <nav className="chapter-list">
                {chapters.map(
                  (
                    chapter,
                    index,
                  ) => (
                    <ChapterItem
                      key={
                        chapter.id
                      }
                      chapter={
                        chapter
                      }
                      isSelected={
                        chapter.id ===
                        selectedChapterId
                      }
                      canMoveUp={
                        index > 0
                      }
                      canMoveDown={
                        index <
                        chapters.length - 1
                      }
                      onSelect={() =>
                        selectChapter(
                          chapter,
                        )
                      }
                      onRename={(
                        title,
                      ) =>
                        onRenameChapter(
                          chapter,
                          title,
                        )
                      }
                      onMoveUp={() =>
                        onMoveChapter(
                          chapter,
                          'up',
                        )
                      }
                      onMoveDown={() =>
                        onMoveChapter(
                          chapter,
                          'down',
                        )
                      }
                      onDuplicate={() =>
                        onDuplicateChapter(
                          chapter,
                        )
                      }
                      onDelete={() =>
                        onDeleteChapter(
                          chapter,
                        )
                      }
                    />
                  ),
                )}
              </nav>
            </SortableContext>
            <DragOverlay
              dropAnimation={
                null
              }
              modifiers={[
                restrictToVerticalAxis,
                restrictToFirstScrollableAncestor,
              ]}
            >
              {activeChapter && (
                <div className="chapter-drag-overlay">
                  <span className="chapter-drag-overlay-handle">
                    ⠿
                  </span>

                  <small>
                    {String(
                      activeChapter.order,
                    ).padStart(
                      3,
                      '0',
                    )}
                  </small>

                  <span className="chapter-drag-overlay-title">
                    {activeChapter.title}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </section>
      )}
    </aside>
  )
}