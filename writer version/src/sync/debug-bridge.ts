import {
  scanSyncEntities,
} from './scan-dirty'

import {
  getPendingMutations,
  getRejectedMutations,
} from './storage'

export function installSyncDebugBridge() {
  if (
    import.meta.env.VITE_SYNC_DEBUG !==
    'true'
  ) {
    return
  }

  const debug = {
    scan() {
      return scanSyncEntities()
    },

    pending() {
      return getPendingMutations()
    },

    rejected() {
      return getRejectedMutations()
    },
  }

  ;(
    window as typeof window & {
      __writerSyncDebug?:
        typeof debug
    }
  ).__writerSyncDebug =
    debug
}