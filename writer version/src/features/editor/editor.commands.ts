export interface EditorCommandResult {
  content: string
  selectionStart: number
  selectionEnd: number
}

function normalizeSelection(
  start: number,
  end: number,
) {
  return {
    start: Math.min(
      start,
      end,
    ),

    end: Math.max(
      start,
      end,
    ),
  }
}

export function toggleInlineFormat(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix = prefix,
  placeholder = 'texto',
): EditorCommandResult {
  const selection =
    normalizeSelection(
      selectionStart,
      selectionEnd,
    )

  const selected =
    content.slice(
      selection.start,
      selection.end,
    )

  const before =
    content.slice(
      0,
      selection.start,
    )

  const after =
    content.slice(
      selection.end,
    )

  /**
   * Sin selección:
   *
   * **
   * ↓
   * **texto**
   *
   * y dejamos "texto" seleccionado.
   */
  if (!selected) {
    const insertion =
      `${prefix}${placeholder}${suffix}`

    return {
      content:
        before +
        insertion +
        after,

      selectionStart:
        selection.start +
        prefix.length,

      selectionEnd:
        selection.start +
        prefix.length +
        placeholder.length,
    }
  }

  /**
   * El texto seleccionado ya contiene
   * el formato internamente.
   *
   * **texto**
   * ↓
   * texto
   */
  if (
    selected.startsWith(
      prefix,
    ) &&
    selected.endsWith(
      suffix,
    ) &&
    selected.length >=
      prefix.length +
        suffix.length
  ) {
    const unwrapped =
      selected.slice(
        prefix.length,
        selected.length -
          suffix.length,
      )

    return {
      content:
        before +
        unwrapped +
        after,

      selectionStart:
        selection.start,

      selectionEnd:
        selection.start +
        unwrapped.length,
    }
  }

  /**
   * El formato está inmediatamente
   * alrededor de la selección.
   *
   * **texto**
   *   └──┘
   *
   * ↓
   *
   * texto
   */
  if (
    before.endsWith(
      prefix,
    ) &&
    after.startsWith(
      suffix,
    )
  ) {
    const cleanBefore =
      before.slice(
        0,
        before.length -
          prefix.length,
      )

    const cleanAfter =
      after.slice(
        suffix.length,
      )

    return {
      content:
        cleanBefore +
        selected +
        cleanAfter,

      selectionStart:
        selection.start -
        prefix.length,

      selectionEnd:
        selection.end -
        prefix.length,
    }
  }

  return {
    content:
      before +
      prefix +
      selected +
      suffix +
      after,

    selectionStart:
      selection.start +
      prefix.length,

    selectionEnd:
      selection.end +
      prefix.length,
  }
}

function getSelectedLineBlock(
  content: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const selection =
    normalizeSelection(
      selectionStart,
      selectionEnd,
    )

  const previousBreak =
    content.lastIndexOf(
      '\n',
      Math.max(
        0,
        selection.start - 1,
      ),
    )

  const lineStart =
    previousBreak === -1
      ? 0
      : previousBreak + 1

  const nextBreak =
    content.indexOf(
      '\n',
      selection.end,
    )

  const lineEnd =
    nextBreak === -1
      ? content.length
      : nextBreak

  return {
    lineStart,
    lineEnd,

    block:
      content.slice(
        lineStart,
        lineEnd,
      ),
  }
}

function transformSelectedLines(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  transform: (
    lines: string[],
  ) => string[],
): EditorCommandResult {
  const {
    lineStart,
    lineEnd,
    block,
  } =
    getSelectedLineBlock(
      content,
      selectionStart,
      selectionEnd,
    )

  const lines =
    block.split('\n')

  const transformedLines =
    transform(lines)

  const transformed =
    transformedLines.join(
      '\n',
    )

  return {
    content:
      content.slice(
        0,
        lineStart,
      ) +
      transformed +
      content.slice(
        lineEnd,
      ),

    selectionStart:
      lineStart,

    selectionEnd:
      lineStart +
      transformed.length,
  }
}

export function setHeading(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  level:
    | 1
    | 2
    | 3,
): EditorCommandResult {
  const headingPrefix =
    `${'#'.repeat(level)} `

  return transformSelectedLines(
    content,
    selectionStart,
    selectionEnd,
    (lines) =>
      lines.map(
        (line) => {
          if (!line.trim()) {
            return line
          }

          const cleaned =
            line.replace(
              /^#{1,6}\s+/,
              '',
            )

          return (
            headingPrefix +
            cleaned
          )
        },
      ),
  )
}

export function toggleQuote(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  return transformSelectedLines(
    content,
    selectionStart,
    selectionEnd,
    (lines) => {
      const meaningful =
        lines.filter(
          (line) =>
            line.trim(),
        )

      const alreadyQuoted =
        meaningful.length >
          0 &&
        meaningful.every(
          (line) =>
            /^>\s?/.test(
              line,
            ),
        )

      return lines.map(
        (line) => {
          if (!line.trim()) {
            return line
          }

          if (
            alreadyQuoted
          ) {
            return line.replace(
              /^>\s?/,
              '',
            )
          }

          return `> ${line}`
        },
      )
    },
  )
}

export function toggleBulletList(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  return transformSelectedLines(
    content,
    selectionStart,
    selectionEnd,
    (lines) => {
      const meaningful =
        lines.filter(
          (line) =>
            line.trim(),
        )

      const alreadyList =
        meaningful.length >
          0 &&
        meaningful.every(
          (line) =>
            /^[-*+]\s+/.test(
              line,
            ),
        )

      return lines.map(
        (line) => {
          if (!line.trim()) {
            return line
          }

          if (alreadyList) {
            return line.replace(
              /^[-*+]\s+/,
              '',
            )
          }

          const cleaned =
            line.replace(
              /^\d+\.\s+/,
              '',
            )

          return `- ${cleaned}`
        },
      )
    },
  )
}

export function toggleOrderedList(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  return transformSelectedLines(
    content,
    selectionStart,
    selectionEnd,
    (lines) => {
      const meaningful =
        lines.filter(
          (line) =>
            line.trim(),
        )

      const alreadyList =
        meaningful.length >
          0 &&
        meaningful.every(
          (line) =>
            /^\d+\.\s+/.test(
              line,
            ),
        )

      let number = 1

      return lines.map(
        (line) => {
          if (!line.trim()) {
            return line
          }

          if (alreadyList) {
            return line.replace(
              /^\d+\.\s+/,
              '',
            )
          }

          const cleaned =
            line
              .replace(
                /^[-*+]\s+/,
                '',
              )
              .replace(
                /^\d+\.\s+/,
                '',
              )

          const result =
            `${number}. ${cleaned}`

          number += 1

          return result
        },
      )
    },
  )
}

export function insertSeparator(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  const selection =
    normalizeSelection(
      selectionStart,
      selectionEnd,
    )

  const before =
    content.slice(
      0,
      selection.start,
    )

  const after =
    content.slice(
      selection.end,
    )

  const leadingBreak =
    before &&
    !before.endsWith(
      '\n',
    )
      ? '\n'
      : ''

  const trailingBreak =
    after &&
    !after.startsWith(
      '\n',
    )
      ? '\n'
      : ''

  const separator =
    `${leadingBreak}---\n${trailingBreak}`

  const nextContent =
    before +
    separator +
    after

  const caret =
    before.length +
    separator.length

  return {
    content:
      nextContent,

    selectionStart:
      caret,

    selectionEnd:
      caret,
  }
}

export function insertLink(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  const selection =
    normalizeSelection(
      selectionStart,
      selectionEnd,
    )

  const selected =
    content.slice(
      selection.start,
      selection.end,
    )

  const label =
    selected ||
    'texto'

  const url =
    'https://'

  const insertion =
    `[${label}](${url})`

  const before =
    content.slice(
      0,
      selection.start,
    )

  const after =
    content.slice(
      selection.end,
    )

  if (selected) {
    const urlStart =
      selection.start +
      label.length +
      3

    return {
      content:
        before +
        insertion +
        after,

      selectionStart:
        urlStart,

      selectionEnd:
        urlStart +
        url.length,
    }
  }

  const labelStart =
    selection.start + 1

  return {
    content:
      before +
      insertion +
      after,

    selectionStart:
      labelStart,

    selectionEnd:
      labelStart +
      label.length,
  }
}

export function insertImage(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  const selection =
    normalizeSelection(
      selectionStart,
      selectionEnd,
    )

  const selected =
    content.slice(
      selection.start,
      selection.end,
    )

  const alt =
    selected ||
    'descripción'

  const source =
    'https://'

  const insertion =
    `![${alt}](${source})`

  const before =
    content.slice(
      0,
      selection.start,
    )

  const after =
    content.slice(
      selection.end,
    )

  if (selected) {
    const sourceStart =
      selection.start +
      alt.length +
      4

    return {
      content:
        before +
        insertion +
        after,

      selectionStart:
        sourceStart,

      selectionEnd:
        sourceStart +
        source.length,
    }
  }

  const altStart =
    selection.start + 2

  return {
    content:
      before +
      insertion +
      after,

    selectionStart:
      altStart,

    selectionEnd:
      altStart +
      alt.length,
  }
}

export function clearFormatting(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  const selection =
    normalizeSelection(
      selectionStart,
      selectionEnd,
    )

  /**
   * Si no existe selección,
   * limpiamos la línea actual.
   */
  if (
    selection.start ===
    selection.end
  ) {
    const {
      lineStart,
      lineEnd,
      block,
    } =
      getSelectedLineBlock(
        content,
        selection.start,
        selection.end,
      )

    const cleaned =
      cleanText(block)

    return {
      content:
        content.slice(
          0,
          lineStart,
        ) +
        cleaned +
        content.slice(
          lineEnd,
        ),

      selectionStart:
        lineStart,

      selectionEnd:
        lineStart +
        cleaned.length,
    }
  }

  const selected =
    content.slice(
      selection.start,
      selection.end,
    )

  const cleaned =
    cleanText(selected)

  return {
    content:
      content.slice(
        0,
        selection.start,
      ) +
      cleaned +
      content.slice(
        selection.end,
      ),

    selectionStart:
      selection.start,

    selectionEnd:
      selection.start +
      cleaned.length,
  }
}

function cleanText(
  value: string,
) {
  return value
    .replace(
      /^(#{1,6}\s+|>\s+|[-*+]\s+|\d+\.\s+)/gm,
      '',
    )
    .replace(
      /\*\*/g,
      '',
    )
    .replace(
      /~~/g,
      '',
    )
    .replace(
      /`/g,
      '',
    )
    .replace(
      /\*/g,
      '',
    )
}

export function toggleDialogue(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommandResult {
  return transformSelectedLines(
    content,
    selectionStart,
    selectionEnd,
    (lines) => {
      const meaningful =
        lines.filter(
          (line) =>
            line.trim(),
        )

      const alreadyDialogue =
        meaningful.length >
          0 &&
        meaningful.every(
          (line) =>
            /^—/.test(
              line.trimStart(),
            ),
        )

      return lines.map(
        (line) => {
          if (!line.trim()) {
            return line
          }

          const indentation =
            line.match(
              /^\s*/,
            )?.[0] ?? ''

          const text =
            line.trimStart()

          if (
            alreadyDialogue
          ) {
            return (
              indentation +
              text.replace(
                /^—\s*/,
                '',
              )
            )
          }

          /**
           * Convención narrativa:
           *
           * —Entonces...
           *
           * sin espacio después
           * de la raya inicial.
           */
          return (
            indentation +
            '—' +
            text.replace(
              /^—\s*/,
              '',
            )
          )
        },
      )
    },
  )
}