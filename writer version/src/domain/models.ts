export interface SyncMetadata {
  /**
   * Revisión lógica del registro.
   *
   * create -> 1
   * update -> +1
   * delete -> +1
   */
  revision: number

  /**
   * Tombstone.
   *
   * null = registro activo
   * fecha = eliminado lógicamente
   */
  deletedAt: string | null
}

export interface Story
  extends SyncMetadata {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Chapter
  extends SyncMetadata {
  id: string
  storyId: string
  title: string
  order: number

  /**
   * Snapshot/version explícita actualmente
   * marcada como última versión.
   */
  currentVersionId:
    | string
    | null

  /**
   * Estado de trabajo actual.
   * Se guarda automáticamente,
   * pero NO crea una nueva versión.
   */
  draftContent?: string

  draftUpdatedAt?:
    | string
    | null

  createdAt: string
  updatedAt: string
}

export interface ChapterVersion
  extends SyncMetadata {
  id: string
  chapterId: string

  parentVersionId:
    | string
    | null

  label: string
  content: string

  createdAt: string

  /**
   * Necesario para cambios de metadata
   * como deletedAt.
   */
  updatedAt: string

  deviceId: string
}