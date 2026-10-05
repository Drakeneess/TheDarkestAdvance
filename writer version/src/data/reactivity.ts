import { effect } from '@maverick-js/signals'
import { createUseReactivityHook } from '@signaldb/react'

export const useSignalDB = createUseReactivityHook(effect)
