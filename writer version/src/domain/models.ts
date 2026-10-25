import type {
  StoryCustomLayout,
} from './story-layout'

import type {
  StoryAssets,
  StoryProfile,
  StoryVisuals,
} from './story-profile'

import type {
  StoryThemeKey,
} from './story-theme'

import type {
  SyncMetadata,
} from './sync-metadata'

export interface Story extends SyncMetadata {
  id: string

  /**
   * Identidad editorial pública estable.
   */
  slug: string

  /**
   * Preset visual base del Codex.
   */
  themeKey: StoryThemeKey

  title: string
  description: string

  profile: StoryProfile
  assets: StoryAssets
  visuals: StoryVisuals
  layout: StoryCustomLayout

  createdAt: string
  updatedAt: string
}

export interface Chapter extends SyncMetadata {
  id: string
  storyId: string

  /**
   * Slug público estable dentro de la obra.
   */
  slug: string

  title: string
  order: number

  /**
   * Último snapshot explícito guardado.
   */
  currentVersionId: string | null

  /**
   * Estado de trabajo actual.
   * No genera una versión nueva por cada edición.
   */
  draftContent: string
  draftUpdatedAt: string

  createdAt: string
  updatedAt: string
}

export interface ChapterVersion extends SyncMetadata {
  id: string
  chapterId: string

  parentVersionId: string | null

  label: string
  content: string

  createdAt: string
  updatedAt: string

  /**
   * Dispositivo que originó este snapshot.
   */
  deviceId: string
}
