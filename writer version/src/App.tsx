import {
  useEffect,
  useState,
} from 'react'

import {
  databaseReady,
} from './data/database'

import {
  WriterWorkspace,
} from './features/writer/WriterWorkspace'

function App() {
  const [
    databaseState,
    setDatabaseState,
  ] = useState<
    'loading' |
    'ready' |
    'error'
  >('loading')

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

  return <WriterWorkspace />
}

export default App