import type {
  SyncMetadata,
} from './models'

export function createSyncMetadata():
  SyncMetadata {
  return {
    revision: 1,
    deletedAt: null,
  }
}

export function nextRevision(
  revision:
    | number
    | null
    | undefined,
) {
  if (
    typeof revision !==
      'number' ||
    !Number.isFinite(
      revision,
    )
  ) {
    return 1
  }

  return revision + 1
}

export function isDeleted(
  entity: SyncMetadata,
) {
  return Boolean(
    entity.deletedAt,
  )
}

export function createTimestamp() {
  return new Date().toISOString()
}

export function createUpdateMetadata(
  revision:
    | number
    | null
    | undefined,

  timestamp =
    createTimestamp(),
) {
  return {
    revision:
      nextRevision(
        revision,
      ),

    updatedAt:
      timestamp,
  }
}

export function markUpdated<
  T extends
    SyncMetadata & {
      updatedAt: string
    },
>(
  entity: T,
): T {
  return {
    ...entity,

    ...createUpdateMetadata(
      entity.revision,
    ),
  }
}

export function markDeleted<
  T extends
    SyncMetadata & {
      updatedAt: string
    },
>(
  entity: T,
): T {
  return {
    ...entity,

    ...createDeleteMetadata(
      entity.revision,
    ),
  }
}

export function createDeleteMetadata(
  revision:
    | number
    | null
    | undefined,

  timestamp =
    createTimestamp(),
) {
  return {
    revision:
      nextRevision(
        revision,
      ),

    deletedAt:
      timestamp,

    updatedAt:
      timestamp,
  }
}

export function isActive(
  entity: {
    deletedAt?:
      | string
      | null
  },
) {
  return !entity.deletedAt
}

export function getActiveEntity<
  T extends {
    deletedAt?:
      | string
      | null
  },
>(
  entity:
    | T
    | null
    | undefined,
):
  | T
  | undefined {
  if (
    !entity ||
    !isActive(entity)
  ) {
    return undefined
  }

  return entity
}