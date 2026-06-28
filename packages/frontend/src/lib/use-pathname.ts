import { useSyncExternalStore } from 'react'
import { subscribeToUrlChanges } from './navigation'

export function usePathname(): string {
  return useSyncExternalStore(
    subscribeToUrlChanges,
    () => window.location.pathname,
  )
}
