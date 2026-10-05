interface PersistenceCollection {
  isPushing:
    () => boolean

  on(
    event:
      'persistence.pushCompleted',

    listener:
      () => void,
  ): unknown

  on(
    event:
      'persistence.error',

    listener:
      (error: Error) => void,
  ): unknown

  off(
    event:
      'persistence.pushCompleted',

    listener:
      () => void,
  ): unknown

  off(
    event:
      'persistence.error',

    listener:
      (error: Error) => void,
  ): unknown
}

/**
 * Espera hasta que la cola actual de
 * persistencia de una Collection haya
 * terminado.
 *
 * Si no hay nada pendiente, resuelve
 * inmediatamente.
 */
export function waitForPersistenceIdle(
  collection:
    PersistenceCollection,

  timeoutMs = 10_000,
): Promise<void> {
  if (!collection.isPushing()) {
    return Promise.resolve()
  }

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      let settled =
        false

      const onCompleted =
        () => {
          finish(
            resolve,
          )
        }

      const onError =
        (
          error:
            Error,
        ) => {
          finish(
            () => {
              reject(
                error,
              )
            },
          )
        }

      const cleanup =
        () => {
          clearTimeout(
            timeoutId,
          )

          collection.off(
            'persistence.pushCompleted',
            onCompleted,
          )

          collection.off(
            'persistence.error',
            onError,
          )
        }

      const finish =
        (
          callback:
            () => void,
        ) => {
          if (settled) {
            return
          }

          settled =
            true

          cleanup()
          callback()
        }

      collection.on(
        'persistence.pushCompleted',
        onCompleted,
      )

      collection.on(
        'persistence.error',
        onError,
      )

      const timeoutId =
        setTimeout(
          () => {
            finish(
              () => {
                reject(
                  new Error(
                    'Timeout esperando persistencia local',
                  ),
                )
              },
            )
          },
          timeoutMs,
        )

      /**
       * Cerramos la pequeña carrera:
       * la cola pudo terminar entre el
       * primer isPushing() y el registro
       * de listeners.
       */
      if (
        !collection.isPushing()
      ) {
        finish(
          resolve,
        )
      }
    },
  )
}