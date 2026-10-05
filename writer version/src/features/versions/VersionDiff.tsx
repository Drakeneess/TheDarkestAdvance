import {
  useMemo,
} from 'react'

import type {
  DiffCell,
} from './diff'

import {
  buildSideBySideDiff,
} from './diff'

interface VersionDiffProps {
  leftLabel: string
  rightLabel: string

  leftContent: string
  rightContent: string
}

export function VersionDiff({
  leftLabel,
  rightLabel,
  leftContent,
  rightContent,
}: VersionDiffProps) {
  const rows =
    useMemo(
      () =>
        buildSideBySideDiff(
          leftContent,
          rightContent,
        ),
      [
        leftContent,
        rightContent,
      ],
    )

  const removedLines =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        (
          row.changed &&
          row.left
            ? 1
            : 0
        ),
      0,
    )

  const addedLines =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        (
          row.changed &&
          row.right
            ? 1
            : 0
        ),
      0,
    )

  return (
    <div className="diff-view">
      <header className="diff-summary">
        <span>
          − {removedLines}{' '}
          líneas
        </span>

        <span>
          + {addedLines}{' '}
          líneas
        </span>
      </header>

      <div className="diff-table">
        <div className="diff-column-header">
          {leftLabel}
        </div>

        <div className="diff-column-header">
          {rightLabel}
        </div>

        {rows.map(
          (
            row,
            index,
          ) => (
            <div
              key={index}
              className="diff-row"
            >
              <DiffCellView
                cell={
                  row.left
                }
                changed={
                  row.changed
                }
                side="left"
              />

              <DiffCellView
                cell={
                  row.right
                }
                changed={
                  row.changed
                }
                side="right"
              />
            </div>
          ),
        )}
      </div>
    </div>
  )
}

interface DiffCellViewProps {
  cell:
    | DiffCell
    | null

  changed: boolean

  side:
    | 'left'
    | 'right'
}

function DiffCellView({
  cell,
  changed,
  side,
}: DiffCellViewProps) {
  const className = [
    'diff-cell',

    changed
      ? side === 'left'
        ? 'removed'
        : 'added'
      : '',

    !cell
      ? 'empty'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <span className="diff-line-number">
        {cell?.lineNumber ?? ''}
      </span>

      <pre className="diff-line-content">
        {cell
          ? renderCellContent(
              cell,
              side,
            )
          : ''}
      </pre>
    </div>
  )
}

function renderCellContent(
  cell: DiffCell,
  side:
    | 'left'
    | 'right',
) {
  if (!cell.segments) {
    return cell.content
  }

  return cell.segments.map(
    (
      segment,
      index,
    ) => (
      <span
        key={index}
        className={
          segment.changed
            ? side === 'left'
              ? 'diff-token diff-token-removed'
              : 'diff-token diff-token-added'
            : undefined
        }
      >
        {segment.content}
      </span>
    ),
  )
}