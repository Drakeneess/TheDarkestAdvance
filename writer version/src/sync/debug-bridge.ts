import {
  clearWriterSessionToken,
  getWriterSessionToken,
  setWriterSessionToken,
} from '../auth/session'

import {
  scanSyncEntities,
} from './scan-dirty'

import {
  getPendingMutations,
  getRejectedMutations,
} from './storage'

import {
  requestSync,
} from './sync-runtime'

export function installSyncDebugBridge() {
  if (
    import.meta.env.VITE_SYNC_DEBUG !==
    'true'
  ) {
    return
  }

  const debug = {
    auth(
      token: string,
    ) {
      setWriterSessionToken(
        token,
      )

      return requestSync()
    },

    clearAuth() {
      clearWriterSessionToken()
    },

    hasAuth() {
      return Boolean(
        getWriterSessionToken(),
      )
    },

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
