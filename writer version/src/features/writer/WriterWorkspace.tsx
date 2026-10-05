import {
  useState,
} from 'react'

import {
  EditorPanel,
} from '../editor/EditorPanel'

import {
  LibraryPanel,
} from '../library/LibraryPanel'

import {
  VersionComparisonPanel,
} from '../versions/VersionComparisonPanel'

import {
  VersionsPanel,
} from '../versions/VersionsPanel'

import {
  useVersionComparison,
} from '../versions/useVersionComparison'

import {
  useWriterShortcuts,
} from './useWriterShortcuts'

import {
  useWriterWorkspace,
} from './useWriterWorkspace'

import {
  useFocusMode,
} from '../editor/useFocusMode'

const VERSIONS_OPEN_KEY =
  'writer:versions-open'

export function WriterWorkspace() {
  const writer =
    useWriterWorkspace()

  const comparison =
    useVersionComparison(
      writer.versions,
      writer.selectedChapterId,
    )

  const [
    versionsOpen,
    setVersionsOpen,
  ] =
    useState(
      () =>
        localStorage.getItem(
          VERSIONS_OPEN_KEY,
        ) === 'true',
    )

  const [
    mobileLibraryOpen,
    setMobileLibraryOpen,
  ] = useState(false)

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  const focus =
    useFocusMode()

  function setVersionsVisibility(
    visible: boolean,
  ) {
    setVersionsOpen(
      visible,
    )

    localStorage.setItem(
      VERSIONS_OPEN_KEY,
      String(visible),
    )
  }

  function toggleVersions() {
    setVersionsVisibility(
      !versionsOpen,
    )
  }

  function handleCompare() {
    focus.exitFocusMode()

    writer.persistDraftNow()

    comparison.startComparison()
  }

  useWriterShortcuts({
    onPreviousChapter:
      writer.handlePreviousChapter,

    onNextChapter:
      writer.handleNextChapter,
  })

  return (
    <main
      className={[
        'writer-shell',

        !versionsOpen
          ? 'versions-collapsed'
          : '',

        focus.isFocusMode
          ? 'focus-mode'
          : '',

        mobileLibraryOpen
          ? 'mobile-library-open'
          : '',

        mobileMenuOpen
          ? 'mobile-menu-open'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!focus.isFocusMode && (
        <>
          <header className="mobile-topbar">
            <button
              type="button"
              className="mobile-icon-button"
              aria-label="Abrir biblioteca"
              aria-expanded={
                mobileLibraryOpen
              }
              onClick={() => {
                setMobileMenuOpen(false)

                setMobileLibraryOpen(
                  (current) =>
                    !current,
                )
              }}
            >
              ☰
            </button>

            <div className="mobile-topbar-context">
              <span>
                {writer.selectedStory
                  ?.title ??
                  'Writer'}
              </span>

              <strong>
                {writer.selectedChapter
                  ?.title ??
                  'Selecciona un capítulo'}
              </strong>
            </div>

            <button
              type="button"
              className="mobile-icon-button"
              aria-label="Abrir menú"
              aria-expanded={
                mobileMenuOpen
              }
              onClick={() => {
                setMobileLibraryOpen(false)

                setMobileMenuOpen(
                  (current) =>
                    !current,
                )
              }}
            >
              ⋮
            </button>
          </header>

          {mobileLibraryOpen && (
            <button
              type="button"
              className={[
                'mobile-backdrop',
                'mobile-library-backdrop',
              ].join(' ')}
              aria-label="Cerrar biblioteca"
              onClick={() =>
                setMobileLibraryOpen(
                  false,
                )
              }
            />
          )}

          {mobileMenuOpen && (
            <>
              <button
                type="button"
                className={[
                  'mobile-backdrop',
                  'mobile-menu-backdrop',
                ].join(' ')}
                aria-label="Cerrar menú"
                onClick={() =>
                  setMobileMenuOpen(
                    false,
                  )
                }
              />

              <div
                className="mobile-action-menu"
                role="menu"
              >
                <button
                  type="button"
                  disabled={
                    !writer.selectedChapter
                  }
                  onClick={() => {
                    setVersionsVisibility(
                      true,
                    )

                    setMobileMenuOpen(
                      false,
                    )
                  }}
                >
                  Historial
                </button>

                <button
                  type="button"
                  disabled={
                    !writer.selectedChapter ||
                    Boolean(
                      writer.selectedVersion,
                    )
                  }
                  onClick={() => {
                    writer.handleSaveVersion()

                    setMobileMenuOpen(
                      false,
                    )
                  }}
                >
                  Guardar versión
                </button>

                <button
                  type="button"
                  disabled={
                    !writer.selectedChapter ||
                    Boolean(
                      writer.selectedVersion,
                    )
                  }
                  onClick={() => {
                    setMobileMenuOpen(
                      false,
                    )

                    focus.toggleFocusMode()
                  }}
                >
                  Focus Mode
                </button>
              </div>
            </>
          )}
        </>
      )}
      {!focus.isFocusMode && (
        <LibraryPanel
          stories={
            writer.storyList
          }
          chapters={
            writer.chapterList
          }
          allChapters={
            writer.allChapters
          }

          selectedStory={
            writer.selectedStory
          }
          selectedStoryId={
            writer.selectedStoryId
          }
          selectedChapterId={
            writer.selectedChapterId
          }

          newStoryTitle={
            writer.newStoryTitle
          }
          newChapterTitle={
            writer.newChapterTitle
          }

          onNewStoryTitleChange={
            writer.setNewStoryTitle
          }
          onNewChapterTitleChange={
            writer.setNewChapterTitle
          }

          onCreateStory={
            writer.handleCreateStory
          }
          onCreateChapter={
            writer.handleCreateChapter
          }

          onSelectStory={
            writer.handleSelectStory
          }
          onSelectChapter={(chapter) => {
            writer.handleSelectChapter(
              chapter,
            )

            setMobileLibraryOpen(
              false,
            )
          }}

          onRenameChapter={
            writer.handleRenameChapter
          }
          onMoveChapter={
            writer.handleMoveChapter
          }
          onDuplicateChapter={
            writer.handleDuplicateChapter
          }
          onDeleteChapter={
            writer.handleDeleteChapter
          }

          onRenameStory={
            writer.handleRenameStory
          }
          onDuplicateStory={
            writer.handleDuplicateStory
          }
          onDeleteStory={
            writer.handleDeleteStory
          }

          onExportStory={
            writer.handleExportStory
          }
          onImportedStory={
            writer.handleImportedStory
          }
          onClose={() =>
            setMobileLibraryOpen(false)
          }
        />
      )}

      {comparison.isComparing &&
      writer.selectedChapter &&
      comparison.leftVersion &&
      comparison.rightVersion ? (
        <VersionComparisonPanel
          chapter={
            writer.selectedChapter
          }
          leftVersion={
            comparison.leftVersion
          }
          rightVersion={
            comparison.rightVersion
          }
          versionsOpen={
            versionsOpen
          }
          onToggleVersions={
            toggleVersions
          }
          onClose={
            comparison.closeComparison
          }
        />
      ) : (
        <EditorPanel
          story={
            writer.selectedStory
          }
          chapter={
            writer.selectedChapter
          }
          selectedVersion={
            writer.selectedVersion
          }

          previousChapter={
            writer.previousChapter
          }
          nextChapter={
            writer.nextChapter
          }

          versionsOpen={
            versionsOpen
          }

          draft={
            writer.draft
          }
          visibleContent={
            writer.visibleContent
          }
          wordCount={
            writer.wordCount
          }
          draftStatus={
            writer.draftStatus
          }

          onDraftChange={
            writer.handleDraftChange
          }

          onSaveVersion={
            writer.handleSaveVersion
          }
          onRestoreVersion={
            writer.handleRestoreVersion
          }
          onReturnToDraft={
            writer.handleReturnToDraft
          }

          onPreviousChapter={
            writer.handlePreviousChapter
          }
          onNextChapter={
            writer.handleNextChapter
          }

          onToggleVersions={
            toggleVersions
          }

          focusMode={
            focus.isFocusMode
          }

          onToggleFocusMode={
            focus.toggleFocusMode
          }
        />
      )}

      {versionsOpen &&
        !focus.isFocusMode && (
          <button
            type="button"
            className={[
              'mobile-backdrop',
              'mobile-versions-backdrop',
            ].join(' ')}
            aria-label="Cerrar historial"
            onClick={() =>
              setVersionsVisibility(
                false,
              )
            }
          />
        )}
      {versionsOpen &&
      !focus.isFocusMode && (
        <VersionsPanel
          chapter={
            writer.selectedChapter
          }
          versions={
            writer.versions
          }

          selectedVersionId={
            writer.selectedVersionId
          }
          versionLabel={
            writer.versionLabel
          }

          leftVersionId={
            comparison.leftVersionId
          }
          rightVersionId={
            comparison.rightVersionId
          }

          onLeftVersionChange={
            comparison.setLeftVersionId
          }
          onRightVersionChange={
            comparison.setRightVersionId
          }

          onCompare={
            handleCompare
          }

          onVersionLabelChange={
            writer.setVersionLabel
          }
          onSaveVersion={
            writer.handleSaveVersion
          }
          onSelectVersion={
            writer.handleSelectVersion
          }

          onRenameVersion={
            writer.handleRenameVersion
          }
          onDuplicateVersion={
            writer.handleDuplicateVersion
          }
          onDeleteVersion={
            writer.handleDeleteVersion
          }

          onClose={() =>
            setVersionsVisibility(
              false,
            )
          }
        />
      )}
    </main>
  )
}