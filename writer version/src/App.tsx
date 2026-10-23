import {
  useEffect,
  useState,
} from 'react'

import {
  LoginScreen,
} from './auth/LoginScreen'

import {
  clearWriterSessionToken,
  getWriterSessionToken,
  subscribeWriterSession,
} from './auth/session'

import {
  databaseReady,
} from './data/database'

import {
  WriterWorkspace,
} from './features/writer/WriterWorkspace'

import {
  requestSync,
} from './sync'

function App() {
  const [
    databaseState,
    setDatabaseState,
  ] = useState<
    'loading' |
    'ready' |
    'error'
  >('loading')

  const [
    hasSession,
    setHasSession,
  ] = useState(
    () =>
      Boolean(
        getWriterSessionToken(),
      ),
  )

  useEffect(() => {
    let active = true

    databaseReady
      .then(() => {
        if (active) {
          setDatabaseState(
            'ready',
          )
        }
      })
      .catch((error) => {
        console.error(
          'Failed to open local database:',
          error,
        )

        if (active) {
          setDatabaseState(
            'error',
          )
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(
    () =>
      subscribeWriterSession(
        () => {
          setHasSession(
            Boolean(
              getWriterSessionToken(),
            ),
          )
        },
      ),
    [],
  )

  useEffect(() => {
    if (
      databaseState !== 'ready'
      || !hasSession
      || !navigator.onLine
    ) {
      return
    }

    void requestSync()
  }, [
    databaseState,
    hasSession,
  ])

  if (
    databaseState ===
    'loading'
  ) {
    return (
      <div className="boot-state">
        Abriendo biblioteca local…
      </div>
    )
  }

  if (
    databaseState ===
    'error'
  ) {
    return (
      <div className="boot-state error">
        No se pudo abrir el
        almacenamiento local del
        navegador.
      </div>
    )
  }

  if (!hasSession) {
    return <LoginScreen />
  }

  return (
    <WriterWorkspace
      onLogout={
        clearWriterSessionToken
      }
    />
  )
}

export default App
