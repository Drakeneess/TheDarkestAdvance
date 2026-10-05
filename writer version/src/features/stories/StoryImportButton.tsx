import {
  useRef,
  useState,
} from 'react'

import type {
  Story,
} from '../../domain/models'

import {
  importStoryFile,
} from './story-transfer.service'

interface StoryImportButtonProps {
  onImported:
    (
      story: Story,
    ) => void
}

export function StoryImportButton({
  onImported,
}: StoryImportButtonProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    isImporting,
    setIsImporting,
  ] = useState(false)

  async function handleFile(
    file: File,
  ) {
    setIsImporting(true)

    try {
      const story =
        await importStoryFile(
          file,
        )

      onImported(story)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo importar la historia.'

      window.alert(message)
    } finally {
      setIsImporting(false)

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          ''
      }
    }
  }

  return (
    <>
      <input
        ref={
          inputRef
        }
        className="story-import-input"
        type="file"
        accept=".json,.writer.json,application/json"
        onChange={(event) => {
          const file =
            event.target
              .files?.[0]

          if (!file) {
            return
          }

          void handleFile(
            file,
          )
        }}
      />

      <button
        type="button"
        className="story-import-button"
        disabled={
          isImporting
        }
        onClick={() =>
          inputRef.current?.click()
        }
      >
        {isImporting
          ? 'Importando…'
          : 'Importar historia'}
      </button>
    </>
  )
}