import {
  runSync,
} from './run-sync'

import type {
  RunSyncResult,
} from './run-sync'

const DEFAULT_INTERVAL_MS =
  30_000

let intervalId:
  ReturnType<typeof setInterval>
  | null =
    null

let running =
  false

let rerunRequested =
  false

let started =
  false

export type SyncRuntimeListener =
  (
    result:
      RunSyncResult,
  ) => void

export type SyncRuntimeErrorListener =
  (
    error:
      unknown,
  ) => void

const resultListeners =
  new Set<
    SyncRuntimeListener
  >()

const errorListeners =
  new Set<
    SyncRuntimeErrorListener
  >()

async function executeSync() {
  if (!navigator.onLine) {
    return null
  }

  if (running) {
    rerunRequested =
      true

    return null
  }

  running =
    true

  try {
    let lastResult:
      RunSyncResult
      | null =
        null

    do {
      rerunRequested =
        false

      lastResult =
        await runSync()

      for (
        const listener
        of resultListeners
      ) {
        listener(
          lastResult,
        )
      }
    } while (
      rerunRequested
    )

    return lastResult
  } catch (error) {
    for (
      const listener
      of errorListeners
    ) {
      listener(
        error,
      )
    }

    return null
  } finally {
    running =
      false
  }
}

function handleOnline() {
  void executeSync()
}

function handleVisibilityChange() {
  if (
    document.visibilityState !==
      'visible' ||
    !navigator.onLine
  ) {
    return
  }

  void executeSync()
}

export function requestSync() {
  return executeSync()
}

export function isSyncRunning() {
  return running
}

export function startSyncRuntime(
  intervalMs =
    DEFAULT_INTERVAL_MS,
) {
  if (started) {
    return
  }

  started =
    true

  window.addEventListener(
    'online',
    handleOnline,
  )

  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange,
  )

  intervalId =
    setInterval(
      () => {
        if (
          navigator.onLine
        ) {
          void executeSync()
        }
      },
      intervalMs,
    )

  /**
   * Primer intercambio al arrancar.
   */
  if (
    navigator.onLine
  ) {
    void executeSync()
  }
}

export function stopSyncRuntime() {
  if (!started) {
    return
  }

  started =
    false

  window.removeEventListener(
    'online',
    handleOnline,
  )

  document.removeEventListener(
    'visibilitychange',
    handleVisibilityChange,
  )

  if (
    intervalId !==
    null
  ) {
    clearInterval(
      intervalId,
    )

    intervalId =
      null
  }
}

export function subscribeSyncResult(
  listener:
    SyncRuntimeListener,
) {
  resultListeners.add(
    listener,
  )

  return () => {
    resultListeners.delete(
      listener,
    )
  }
}

export function subscribeSyncError(
  listener:
    SyncRuntimeErrorListener,
) {
  errorListeners.add(
    listener,
  )

  return () => {
    errorListeners.delete(
      listener,
    )
  }
}