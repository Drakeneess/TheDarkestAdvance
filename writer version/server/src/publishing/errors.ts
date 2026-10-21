export type PublishingErrorCode =
  | 'STORY_NOT_FOUND'
  | 'STORY_DELETED'
  | 'STORY_INVALID'
  | 'STORY_SLUG_CONFLICT'
  | 'CHAPTER_NOT_FOUND'
  | 'CHAPTER_DELETED'
  | 'CHAPTER_INVALID'
  | 'CHAPTER_STORY_MISMATCH'
  | 'CHAPTER_SLUG_CONFLICT'
  | 'VERSION_NOT_FOUND'
  | 'VERSION_DELETED'
  | 'VERSION_INVALID'
  | 'VERSION_CHAPTER_MISMATCH'

export class PublishingError extends Error {
  constructor(
    public readonly code:
      PublishingErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'PublishingError'
  }
}
