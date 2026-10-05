export interface InlineDiffSegment {
  content: string
  changed: boolean
}

export interface DiffCell {
  lineNumber: number
  content: string
  segments?: InlineDiffSegment[]
}

export interface DiffRow {
  left: DiffCell | null
  right: DiffCell | null
  changed: boolean
}

type RawDiff =
  | {
      type: 'same'
      content: string
    }
  | {
      type: 'removed'
      content: string
    }
  | {
      type: 'added'
      content: string
    }

type RawTokenDiff =
  | {
      type: 'same'
      content: string
    }
  | {
      type: 'removed'
      content: string
    }
  | {
      type: 'added'
      content: string
    }

function splitLines(content: string) {
  if (!content) {
    return []
  }

  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
}

/**
 * Separamos:
 *
 * - palabras
 * - números
 * - espacios
 * - puntuación
 *
 * Esto permite detectar:
 *
 * "abrió" → "empujó"
 *
 * sin convertir toda la línea en un único cambio.
 */
function tokenize(content: string) {
  return (
    content.match(
      /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu,
    ) ?? []
  )
}

function buildRawDiff(
  oldContent: string,
  newContent: string,
): RawDiff[] {
  const oldLines =
    splitLines(oldContent)

  const newLines =
    splitLines(newContent)

  const oldLength =
    oldLines.length

  const newLength =
    newLines.length

  const matrix = Array.from(
    {
      length:
        oldLength + 1,
    },
    () =>
      new Uint32Array(
        newLength + 1,
      ),
  )

  for (
    let oldIndex =
      oldLength - 1;
    oldIndex >= 0;
    oldIndex -= 1
  ) {
    for (
      let newIndex =
        newLength - 1;
      newIndex >= 0;
      newIndex -= 1
    ) {
      if (
        oldLines[oldIndex] ===
        newLines[newIndex]
      ) {
        matrix[oldIndex][newIndex] =
          matrix[
            oldIndex + 1
          ][
            newIndex + 1
          ] + 1
      } else {
        matrix[oldIndex][newIndex] =
          Math.max(
            matrix[
              oldIndex + 1
            ][newIndex],

            matrix[
              oldIndex
            ][
              newIndex + 1
            ],
          )
      }
    }
  }

  const result: RawDiff[] = []

  let oldIndex = 0
  let newIndex = 0

  while (
    oldIndex < oldLength &&
    newIndex < newLength
  ) {
    if (
      oldLines[oldIndex] ===
      newLines[newIndex]
    ) {
      result.push({
        type: 'same',
        content:
          oldLines[oldIndex],
      })

      oldIndex += 1
      newIndex += 1

      continue
    }

    if (
      matrix[
        oldIndex + 1
      ][newIndex] >=
      matrix[
        oldIndex
      ][
        newIndex + 1
      ]
    ) {
      result.push({
        type: 'removed',
        content:
          oldLines[oldIndex],
      })

      oldIndex += 1
    } else {
      result.push({
        type: 'added',
        content:
          newLines[newIndex],
      })

      newIndex += 1
    }
  }

  while (
    oldIndex < oldLength
  ) {
    result.push({
      type: 'removed',
      content:
        oldLines[oldIndex],
    })

    oldIndex += 1
  }

  while (
    newIndex < newLength
  ) {
    result.push({
      type: 'added',
      content:
        newLines[newIndex],
    })

    newIndex += 1
  }

  return result
}

function buildRawTokenDiff(
  oldContent: string,
  newContent: string,
): RawTokenDiff[] {
  const oldTokens =
    tokenize(oldContent)

  const newTokens =
    tokenize(newContent)

  const oldLength =
    oldTokens.length

  const newLength =
    newTokens.length

  const matrix = Array.from(
    {
      length:
        oldLength + 1,
    },
    () =>
      new Uint32Array(
        newLength + 1,
      ),
  )

  for (
    let oldIndex =
      oldLength - 1;
    oldIndex >= 0;
    oldIndex -= 1
  ) {
    for (
      let newIndex =
        newLength - 1;
      newIndex >= 0;
      newIndex -= 1
    ) {
      if (
        oldTokens[oldIndex] ===
        newTokens[newIndex]
      ) {
        matrix[oldIndex][newIndex] =
          matrix[
            oldIndex + 1
          ][
            newIndex + 1
          ] + 1
      } else {
        matrix[oldIndex][newIndex] =
          Math.max(
            matrix[
              oldIndex + 1
            ][newIndex],

            matrix[
              oldIndex
            ][
              newIndex + 1
            ],
          )
      }
    }
  }

  const result: RawTokenDiff[] =
    []

  let oldIndex = 0
  let newIndex = 0

  while (
    oldIndex < oldLength &&
    newIndex < newLength
  ) {
    if (
      oldTokens[oldIndex] ===
      newTokens[newIndex]
    ) {
      result.push({
        type: 'same',
        content:
          oldTokens[oldIndex],
      })

      oldIndex += 1
      newIndex += 1

      continue
    }

    if (
      matrix[
        oldIndex + 1
      ][newIndex] >=
      matrix[
        oldIndex
      ][
        newIndex + 1
      ]
    ) {
      result.push({
        type: 'removed',
        content:
          oldTokens[oldIndex],
      })

      oldIndex += 1
    } else {
      result.push({
        type: 'added',
        content:
          newTokens[newIndex],
      })

      newIndex += 1
    }
  }

  while (
    oldIndex < oldLength
  ) {
    result.push({
      type: 'removed',
      content:
        oldTokens[oldIndex],
    })

    oldIndex += 1
  }

  while (
    newIndex < newLength
  ) {
    result.push({
      type: 'added',
      content:
        newTokens[newIndex],
    })

    newIndex += 1
  }

  return result
}

function pushSegment(
  segments: InlineDiffSegment[],
  content: string,
  changed: boolean,
) {
  const last =
    segments[
      segments.length - 1
    ]

  /**
   * Unimos segmentos consecutivos con
   * el mismo estado para no generar
   * veinte <span> innecesarios.
   */
  if (
    last &&
    last.changed === changed
  ) {
    last.content += content
    return
  }

  segments.push({
    content,
    changed,
  })
}

function buildInlineDiff(
  oldContent: string,
  newContent: string,
) {
  const raw =
    buildRawTokenDiff(
      oldContent,
      newContent,
    )

  const left:
    InlineDiffSegment[] = []

  const right:
    InlineDiffSegment[] = []

  for (const token of raw) {
    if (
      token.type === 'same'
    ) {
      pushSegment(
        left,
        token.content,
        false,
      )

      pushSegment(
        right,
        token.content,
        false,
      )

      continue
    }

    if (
      token.type === 'removed'
    ) {
      pushSegment(
        left,
        token.content,
        true,
      )

      continue
    }

    pushSegment(
      right,
      token.content,
      true,
    )
  }

  return {
    left,
    right,
  }
}

export function buildSideBySideDiff(
  oldContent: string,
  newContent: string,
): DiffRow[] {
  const raw =
    buildRawDiff(
      oldContent,
      newContent,
    )

  const rows: DiffRow[] = []

  let leftLine = 1
  let rightLine = 1

  let index = 0

  while (
    index < raw.length
  ) {
    const current =
      raw[index]

    if (
      current.type ===
      'same'
    ) {
      rows.push({
        left: {
          lineNumber:
            leftLine,

          content:
            current.content,
        },

        right: {
          lineNumber:
            rightLine,

          content:
            current.content,
        },

        changed: false,
      })

      leftLine += 1
      rightLine += 1
      index += 1

      continue
    }

    const removed: DiffCell[] =
      []

    const added: DiffCell[] =
      []

    while (
      index < raw.length &&
      raw[index].type !==
        'same'
    ) {
      const change =
        raw[index]

      if (
        change.type ===
        'removed'
      ) {
        removed.push({
          lineNumber:
            leftLine,

          content:
            change.content,
        })

        leftLine += 1
      }

      if (
        change.type ===
        'added'
      ) {
        added.push({
          lineNumber:
            rightLine,

          content:
            change.content,
        })

        rightLine += 1
      }

      index += 1
    }

    const length =
      Math.max(
        removed.length,
        added.length,
      )

    for (
      let rowIndex = 0;
      rowIndex < length;
      rowIndex += 1
    ) {
      const leftCell =
        removed[
          rowIndex
        ] ?? null

      const rightCell =
        added[
          rowIndex
        ] ?? null

      /**
       * Si tenemos una línea a ambos lados,
       * hacemos además un diff interno.
       */
      if (
        leftCell &&
        rightCell
      ) {
        const inline =
          buildInlineDiff(
            leftCell.content,
            rightCell.content,
          )

        leftCell.segments =
          inline.left

        rightCell.segments =
          inline.right
      }

      /**
       * Una línea completamente eliminada
       * o agregada se marca entera.
       */
      if (
        leftCell &&
        !rightCell
      ) {
        leftCell.segments = [
          {
            content:
              leftCell.content,

            changed: true,
          },
        ]
      }

      if (
        rightCell &&
        !leftCell
      ) {
        rightCell.segments = [
          {
            content:
              rightCell.content,

            changed: true,
          },
        ]
      }

      rows.push({
        left: leftCell,
        right: rightCell,
        changed: true,
      })
    }
  }

  return rows
}