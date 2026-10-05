import type {
  SyncCursor,
  SyncEntityType,
  SyncMutation,
  SyncProtocolVersion,
  SyncServerRecord,
  SyncServerVersion,
} from './protocol'

export interface SyncCheckpoint {
  /**
   * Coincide con workspaceId.
   */
  id: string

  protocolVersion:
    SyncProtocolVersion

  workspaceId: string
  deviceId: string

  cursor:
    | SyncCursor
    | null
}

export interface SyncEntityState {
  /**
   * Formato:
   *
   * story:<id>
   * chapter:<id>
   * chapterVersion:<id>
   */
  id: string

  entityType:
    SyncEntityType

  entityId: string

  /**
   * Última versión confirmada
   * por el servidor.
   */
  serverVersion:
    | SyncServerVersion
    | null

  /**
   * revision local que sabemos
   * sincronizada.
   *
   * null = nunca sincronizada.
   */
  lastSyncedRevision:
    | number
    | null

  /**
   * Una entidad solo puede tener
   * una mutación pendiente a la vez.
   */
  pendingMutationId:
    | string
    | null

  /**
   * V4.1 no intenta resolver conflictos.
   * Solo evita pisarlos.
   */
  conflict: boolean

  conflictServerRecord:
    | SyncServerRecord
    | null
}

export interface SyncOutboxItem {
  /**
   * Coincide con mutation.mutationId.
   */
  id: string

  /**
   * Permite localizar rápidamente
   * la entidad afectada.
   */
  entityKey: string

  mutation:
    SyncMutation

  createdAt: string

  attempts: number

  lastAttemptAt:
    | string
    | null
}

export function createSyncEntityKey(
  entityType:
    SyncEntityType,

  entityId: string,
) {
  return (
    `${entityType}:${entityId}`
  )
}