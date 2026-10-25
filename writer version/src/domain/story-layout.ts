export type StoryLayoutMode =
  | 'preset'
  | 'custom'

export interface StoryCustomLayout {
  mode: StoryLayoutMode
  html: string
  css: string
}

export const STORY_LAYOUT_HTML_MAX_LENGTH =
  100_000

export const STORY_LAYOUT_CSS_MAX_LENGTH =
  100_000

export function createDefaultStoryCustomLayout():
  StoryCustomLayout {
  return {
    mode: 'preset',
    html: '',
    css: '',
  }
}

export function normalizeStoryCustomLayout(
  value:
    | Partial<StoryCustomLayout>
    | null
    | undefined,
): StoryCustomLayout {
  return {
    mode:
      value?.mode === 'custom'
        ? 'custom'
        : 'preset',

    html:
      typeof value?.html === 'string'
        ? value.html.slice(
            0,
            STORY_LAYOUT_HTML_MAX_LENGTH,
          )
        : '',

    css:
      typeof value?.css === 'string'
        ? value.css.slice(
            0,
            STORY_LAYOUT_CSS_MAX_LENGTH,
          )
        : '',
  }
}
