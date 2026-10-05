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
  onClose?: () => void
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
  return (
    <aside className="library-panel">
      {onClose && (
        <header className="mobile-library-header">
          <div>
            <span>WRITER</span>
            <strong>Biblioteca</strong>
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
          onSelectStory
        }
        onSelectChapter={
          onSelectChapter
        }
      />

      <section className="library-section">
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
                  onSelectStory(
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
        <section className="library-section chapters-section">
          <div className="section-title-row">
            <span>
              Capítulos
            </span>

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
                    onSelectChapter(
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
        </section>
      )}
    </aside>
  )
}