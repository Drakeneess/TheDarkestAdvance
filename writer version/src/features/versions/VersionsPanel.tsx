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
    | 'conflict'

  message: string

  conflictTarget?: {
    hasServerRecord: boolean
  }
}

type ConflictResolutionStrategy =
  | 'keep-local'
  | 'use-server'

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

  publicationStatusLoading:
    boolean

  unpublishing:
    boolean

  resolvingPublicationConflict:
    boolean

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

  onResolvePublicationConflict:
    (
      strategy:
        ConflictResolutionStrategy,
    ) => void

  onUnpublish:
    () => void

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
  publicationStatusLoading,
  unpublishing,
  resolvingPublicationConflict,
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
  onResolvePublicationConflict,
  onUnpublish,

  onRenameVersion,
  onDuplicateVersion,
  onDeleteVersion,

  onClose,
}: VersionsPanelProps) {
  const publicationBusy =
    publicationStatusLoading ||
    publishingVersionId !==
      null ||
    unpublishing ||
    resolvingPublicationConflict

  const currentVersion =
    chapter?.currentVersionId
      ? (
          versions.find(
            (version) =>
              version.id ===
              chapter.currentVersionId,
          ) ?? null
        )
      : null

  const publishedVersion =
    publishedVersionId
      ? (
          versions.find(
            (version) =>
              version.id ===
              publishedVersionId,
          ) ?? null
        )
      : null

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

          <div
            className="publication-state"
            aria-live="polite"
          >
            <div className="publication-state-row">
              <span>
                Borrador
              </span>

              <strong>
                Trabajo local
              </strong>
            </div>

            <div className="publication-state-row">
              <span>
                Snapshot actual
              </span>

              <strong>
                {currentVersion
                  ?.label ??
                  'Sin snapshot'}
              </strong>
            </div>

            <div className="publication-state-row">
              <span>
                Publicado
              </span>

              <strong>
                {publicationStatusLoading
                  ? 'Consultando…'
                  : publishedVersion
                    ? publishedVersion.label
                    : publishedVersionId
                      ? 'Versión no disponible localmente'
                      : 'No publicado'}
              </strong>
            </div>

            {!publicationStatusLoading &&
              publishedVersionId &&
              !publishedVersion && (
                <button
                  type="button"
                  className="secondary publication-state-unpublish"
                  disabled={
                    publicationBusy
                  }
                  onClick={
                    onUnpublish
                  }
                >
                  {unpublishing
                    ? 'Despublicando…'
                    : 'Despublicar versión remota'}
                </button>
              )}
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
                  'error' ||
                publicationFeedback.kind ===
                  'conflict'
                  ? 'alert'
                  : 'status'
              }
            >
              <div>
                {
                  publicationFeedback.message
                }
              </div>

              {publicationFeedback.kind ===
                'conflict' &&
                publicationFeedback
                  .conflictTarget && (
                  <div className="publication-conflict-resolution">
                    <p>
                      Conservar local vuelve a enviar esta entidad sobre la versión remota actual. Usar servidor descarta los cambios locales de esta entidad. Ninguna opción publica automáticamente.
                    </p>

                    <div className="publication-conflict-actions">
                      <button
                        type="button"
                        className="secondary"
                        disabled={
                          resolvingPublicationConflict
                        }
                        onClick={() =>
                          onResolvePublicationConflict(
                            'keep-local',
                          )
                        }
                      >
                        {resolvingPublicationConflict
                          ? 'Resincronizando…'
                          : 'Conservar local y resincronizar'}
                      </button>

                      {publicationFeedback
                        .conflictTarget
                        .hasServerRecord && (
                        <button
                          type="button"
                          className="secondary"
                          disabled={
                            resolvingPublicationConflict
                          }
                          onClick={() =>
                            onResolvePublicationConflict(
                              'use-server',
                            )
                          }
                        >
                          Usar versión del servidor
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
              ) => {
                const isPublished =
                  version.id ===
                  publishedVersionId

                return (
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
                      isPublished
                    }
                    isPublishing={
                      version.id ===
                      publishingVersionId
                    }
                    isUnpublishing={
                      isPublished &&
                      unpublishing
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
                    onUnpublish={
                      onUnpublish
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
                )
              },
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
