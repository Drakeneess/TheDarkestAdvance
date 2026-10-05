import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../domain/models'

export const SYNC_PROTOCOL_VERSION =
  1 as const

export type SyncProtocolVersion =
  typeof SYNC_PROTOCOL_VERSION

/**
 * Los cursores y versiones del servidor
 * viajan como string para no depender del
 * límite seguro de Number si el backend
 * termina usando BIGINT.
 */
export type SyncCursor = string

export type SyncServerVersion =
  string

export type SyncEntityType =
  | 'story'
  | 'chapter'
  | 'chapterVersion'

export interface SyncEntityMap {
  story: Story
  chapter: Chapter
  chapterVersion: ChapterVersion
}

type SyncMutationBase<
  T extends SyncEntityType,
> = {
  mutationId: string

  entityType: T
  entityId: string

  /**
   * revision pertenece al modelo local.
   *
   * Sirve para saber exactamente qué revisión
   * local representa esta mutación.
   */
  clientRevision: number

  /**
   * Última versión del servidor que este
   * dispositivo conocía para la entidad.
   *
   * null significa:
   * "Nunca vi esta entidad en el servidor".
   */
  baseServerVersion:
    | SyncServerVersion
    | null

  /**
   * Snapshot completo.
   *
   * Incluso los tombstones viajan completos.
   */
  payload:
    SyncEntityMap[T]
}

export type SyncMutation = {
  [T in SyncEntityType]:
    SyncMutationBase<T>
}[SyncEntityType]

type SyncServerRecordBase<
  T extends SyncEntityType,
> = {
  entityType: T
  entityId: string

  serverVersion:
    SyncServerVersion

  payload:
    SyncEntityMap[T]
}

export type SyncServerRecord = {
  [T in SyncEntityType]:
    SyncServerRecordBase<T>
}[SyncEntityType]

type SyncChangeBase<
  T extends SyncEntityType,
> =
  SyncServerRecordBase<T> & {
    cursor:
      SyncCursor

    sourceDeviceId:
      string

    sourceMutationId:
      string | null
  }

export type SyncChange = {
  [T in SyncEntityType]:
    SyncChangeBase<T>
}[SyncEntityType]

interface SyncMutationAckBase {
  mutationId: string

  entityType:
    SyncEntityType

  entityId: string

  /**
   * Revisión local a la que corresponde
   * este ACK.
   *
   * Esto permite distinguir un ACK viejo
   * si el usuario siguió editando mientras
   * la petición estaba en vuelo.
   */
  clientRevision: number
}

export interface SyncAppliedAck
  extends SyncMutationAckBase {
  status:
    | 'applied'
    | 'duplicate'

  serverVersion:
    SyncServerVersion

  cursor:
    SyncCursor
}

export interface SyncConflictAck
  extends SyncMutationAckBase {
  status:
    'conflict'

  /**
   * Puede ser null si el cliente creía que
   * la entidad existía, pero el servidor
   * no tiene registro actual de ella.
   */
  serverRecord:
    | SyncServerRecord
    | null
}

export interface SyncRejectedAck
  extends SyncMutationAckBase {
  status:
    'rejected'

  error: {
    code: string
    message: string
  }
}

export type SyncMutationAck =
  | SyncAppliedAck
  | SyncConflictAck
  | SyncRejectedAck

export interface SyncExchangeRequest {
  protocolVersion:
    SyncProtocolVersion

  /**
   * Identifica el mismo workspace en todos
   * los dispositivos.
   *
   * No debe generarse uno nuevo por dispositivo.
   */
  workspaceId: string

  deviceId: string

  /**
   * Último evento del servidor procesado
   * durablemente por este dispositivo.
   */
  cursor:
    | SyncCursor
    | null

  mutations:
    SyncMutation[]

  /**
   * Máximo de eventos del log que el servidor
   * puede escanear en este lote.
   */
  maxChanges?:
    number
}

export interface SyncExchangeResponse {
  protocolVersion:
    SyncProtocolVersion

  acknowledgements:
    SyncMutationAck[]

  /**
   * Cambios provenientes de otros dispositivos.
   *
   * Los eventos originados por este mismo
   * deviceId no se devuelven aquí.
   */
  changes:
    SyncChange[]

  /**
   * Último evento del servidor procesado
   * por este lote.
   *
   * Puede avanzar incluso cuando `changes`
   * esté vacío, porque los eventos creados
   * por el mismo dispositivo también consumen
   * cursor.
   */
  nextCursor:
    | SyncCursor
    | null

  /**
   * Cursor más reciente existente actualmente
   * en el servidor para este workspace.
   */
  serverHead:
    | SyncCursor
    | null

  /**
   * true significa que aún existen eventos
   * posteriores a nextCursor.
   */
  hasMore: boolean
}