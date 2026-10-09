import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'

import App from './App'

import {
  databaseReady,
} from './data/database'

import {
  installSyncDebugBridge,
  startSyncRuntime,
} from './sync'

import './styles/index.css'
import './styles/mobile/index.css'

registerSW({
  immediate: true,
})

async function bootstrap() {
  /**
   * IndexedDB + colecciones + migraciones
   * deben estar listas antes de permitir
   * cualquier ciclo de sincronización.
   */
  await databaseReady

  installSyncDebugBridge()

  const rootElement =
    document.getElementById(
      'root',
    )

  if (!rootElement) {
    throw new Error(
      'No se encontró el elemento #root',
    )
  }

  createRoot(
    rootElement,
  ).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  /**
   * El runtime arranca después de que
   * la base local quedó inicializada.
   *
   * startSyncRuntime() no bloquea el render:
   * dispara el primer sync en segundo plano.
   */
  startSyncRuntime()
}

void bootstrap().catch(
  (error) => {
    console.error(
      '[Writer] Error durante bootstrap:',
      error,
    )
  },
)