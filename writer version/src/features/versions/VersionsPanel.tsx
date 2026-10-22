import type {
  Chapter,
  ChapterVersion,
} from '../../domain/models'

import {
  VersionCard,
} from './VersionCard'

interface PublicationFeedback {
  kind:
    | 'success'
    | 'error'

  message: string
}

interface VersionsPanelProps {
  chapter:
    | Chapter
    | null

  versions:
    ChapterVersion[]

  selectedVersionId:
    | string
    | null

  versionLabel: string

  publishedVersionId:
    | string
    | null

  publishingVersionId:
    | string
    | null

  publicationFeedback:
    | PublicationFeedback
    | null

  leftVersionId:
    | string
    | null

  rightVersionId:
    | string
    | null

  onLeftVersionChange:
    (
      versionId: string,
    ) => void

  onRightVersionChange:
    (
      versionId: string,
    ) => void

  onCompare:
    () => void

  onVersionLabelChange:
    (
      value: string,
    ) => void

  onSaveVersion:
    () => void

  onClose:
    () => void

  onSelectVersion:
    (
      version:
        ChapterVersion,
    ) => void

  onPublishVersion:
    (
      version:
        ChapterVersion,
    ) => void

  onRenameVersion:
    (
      version:
        ChapterVersion,
      label: string,
    ) => void

  onDuplicateVersion:
    (
      version:
        ChapterVersion,
    ) => void

  onDeleteVersion:
    (
      version:
        ChapterVersion,
    ) => void
}

export function VersionsPanel({
  chapter,
  versions,

  selectedVersionId,
  versionLabel,

  publishedVersionId,
  publishingVersionId,
  publicationFeedback,

  leftVersionId,
  rightVersionId,

  onLeftVersionChange,
  onRightVersionChange,
  onCompare,

  onVersionLabelChange,
  onSaveVersion,
  onSelectVersion,
  onPublishVersion,

  onRenameVersion,
  onDuplicateVersion,
  onDeleteVersion,

  onClose,
}: VersionsPanelProps) {
  const publicationBusy =
    publishingVersionId !==
      null

  return (
    <aside className="versions-panel">
      <div className="versions-header-actions">
        <span className="counter">
          {versions.length}
        </span>

        <button
          type="button"
          className="panel-close-button"
          title="Cerrar historial"
          onClick={
            onClose
          }
        >
          ×
        </button>
      </div>

      {chapter ? (
        <>
          <div className="snapshot-box">
            <input
              value={
                versionLabel
              }
              onChange={(event) =>
                onVersionLabelChange(
                  event.target.value,
                )
              }
              placeholder={`v${
                versions.length + 1
              }`}
            />

            <button
              className="primary"
              onClick={
                onSaveVersion
              }
            >
              Crear snapshot
            </button>
          </div>

          {versions.length >= 2 && (
            <div className="compare-box">
              <div className="compare-title">
                Comparar versiones
              </div>

              <label>
                <span>
                  Base
                </span>

                <select
                  value={
                    leftVersionId ??
                    ''
                  }
                  onChange={(event) =>
                    onLeftVersionChange(
                      event.target.value,
                    )
                  }
                >
                  {versions.map(
                    (version) => (
                      <option
                        key={
                          version.id
                        }
                        value={
                          version.id
                        }
                      >
                        {
                          version.label
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Contra
                </span>

                <select
                  value={
                    rightVersionId ??
                    ''
                  }
                  onChange={(event) =>
                    onRightVersionChange(
                      event.target.value,
                    )
                  }
                >
                  {versions.map(
                    (version) => (
                      <option
                        key={
                          version.id
                        }
                        value={
                          version.id
                        }
                      >
                        {
                          version.label
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <button
                className="secondary"
                disabled={
                  !leftVersionId ||
                  !rightVersionId ||
                  leftVersionId ===
                    rightVersionId
                }
                onClick={
                  onCompare
                }
              >
                Comparar
              </button>
            </div>
          )}

          {publicationFeedback && (
            <div
              className={[
                'publication-feedback',
                publicationFeedback.kind,
              ].join(' ')}
              role={
                publicationFeedback.kind ===
                  'error'
                  ? 'alert'
                  : 'status'
              }
            >
              {
                publicationFeedback.message
              }
            </div>
          )}

          <div className="version-list">
            {versions.length ===
              0 && (
              <div className="versions-empty">
                Todavía no existen
                snapshots.
              </div>
            )}

            {versions.map(
              (
                version,
                index,
              ) => (
                <VersionCard
                  key={
                    version.id
                  }
                  version={
                    version
                  }
                  indexNumber={
                    versions.length -
                    index
                  }
                  isCurrent={
                    version.id ===
                    chapter.currentVersionId
                  }
                  isSelected={
                    version.id ===
                    selectedVersionId
                  }
                  isPublished={
                    version.id ===
                    publishedVersionId
                  }
                  isPublishing={
                    version.id ===
                    publishingVersionId
                  }
                  publishDisabled={
                    publicationBusy
                  }
                  isLeftCompare={
                    version.id ===
                    leftVersionId
                  }
                  isRightCompare={
                    version.id ===
                    rightVersionId
                  }
                  onSelect={() =>
                    onSelectVersion(
                      version,
                    )
                  }
                  onPublish={() =>
                    onPublishVersion(
                      version,
                    )
                  }
                  onRename={(
                    label,
                  ) =>
                    onRenameVersion(
                      version,
                      label,
                    )
                  }
                  onDuplicate={() =>
                    onDuplicateVersion(
                      version,
                    )
                  }
                  onDelete={() =>
                    onDeleteVersion(
                      version,
                    )
                  }
                />
              ),
            )}
          </div>
        </>
      ) : (
        <div className="versions-empty">
          Selecciona un capítulo
          para ver su historial.
        </div>
      )}
    </aside>
  )
}
