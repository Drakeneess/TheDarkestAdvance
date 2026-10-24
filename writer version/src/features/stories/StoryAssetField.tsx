import {
  useRef,
  useState,
} from 'react'

import type {
  StoryAssetKind,
} from './story-assets.client'

import {
  uploadStoryAsset,
} from './story-assets.client'

interface StoryAssetFieldProps {
  storyId: string
  kind: StoryAssetKind
  label: string
  value: string
  onChange: (
    value: string,
  ) => void
}

function formatBytes(
  value: number,
) {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(
      value / 1024
    ).toFixed(1)} KiB`
  }

  return `${(
    value /
    (1024 * 1024)
  ).toFixed(1)} MiB`
}

export function StoryAssetField({
  storyId,
  kind,
  label,
  value,
  onChange,
}: StoryAssetFieldProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    uploading,
    setUploading,
  ] = useState(false)

  const [
    feedback,
    setFeedback,
  ] = useState<string | null>(
    null,
  )

  async function handleFile(
    file: File,
  ) {
    if (uploading) {
      return
    }

    setUploading(true)
    setFeedback(null)

    try {
      const result =
        await uploadStoryAsset(
          storyId,
          kind,
          file,
        )

      onChange(
        result.asset.url,
      )

      setFeedback(
        `${file.name} · ${formatBytes(result.asset.size)}`,
      )
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No se pudo subir el archivo.',
      )
    } finally {
      setUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="story-asset-field">
      <label>
        <span>{label}</span>

        <input
          type="url"
          value={value}
          placeholder="https://…"
          onChange={(event) => {
            onChange(
              event.target.value,
            )
            setFeedback(null)
          }}
        />
      </label>

      <div className="story-asset-field-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="story-asset-native-input"
          onChange={(event) => {
            const file =
              event.target.files?.[0]

            if (file) {
              void handleFile(file)
            }
          }}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => {
            inputRef.current?.click()
          }}
        >
          {uploading
            ? 'Subiendo…'
            : 'Subir archivo'}
        </button>

        {value.trim() && (
          <button
            type="button"
            className="story-asset-clear"
            disabled={uploading}
            onClick={() => {
              onChange('')
              setFeedback(null)
            }}
          >
            Quitar referencia
          </button>
        )}
      </div>

      {feedback && (
        <small className="story-asset-feedback">
          {feedback}
        </small>
      )}
    </div>
  )
}
