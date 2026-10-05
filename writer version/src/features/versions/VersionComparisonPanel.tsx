import type {
  Chapter,
  ChapterVersion,
} from '../../domain/models'

import {
  VersionDiff,
} from './VersionDiff'

interface VersionComparisonPanelProps {
  chapter: Chapter

  leftVersion:
    ChapterVersion

  rightVersion:
    ChapterVersion

  versionsOpen: boolean

  onToggleVersions:
    () => void

  onClose:
    () => void
}

export function VersionComparisonPanel({
  chapter,

  leftVersion,
  rightVersion,

  versionsOpen,
  onToggleVersions,

  onClose,
}: VersionComparisonPanelProps) {
  return (
    <section className="editor-panel">
      <header className="editor-header">
        <div>
          <p className="eyebrow">
            COMPARACIÓN
          </p>

          <h2>
            {chapter.title}
          </h2>

          <p className="version-preview-label">
            {leftVersion.label}
            {' ↔ '}
            {rightVersion.label}
          </p>
        </div>

        <div className="editor-actions">
          <button
            className="secondary"
            onClick={
              onToggleVersions
            }
          >
            {versionsOpen
              ? 'Ocultar historial'
              : 'Historial'}
          </button>

          <button
            className="secondary"
            onClick={
              onClose
            }
          >
            Volver al editor
          </button>
        </div>
      </header>

      <VersionDiff
        leftLabel={
          leftVersion.label
        }
        rightLabel={
          rightVersion.label
        }
        leftContent={
          leftVersion.content
        }
        rightContent={
          rightVersion.content
        }
      />
    </section>
  )
}