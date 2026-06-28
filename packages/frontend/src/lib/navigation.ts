const listeners = new Set<() => void>()

export function subscribeToUrlChanges(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function notifyUrlChange(): void {
  listeners.forEach((cb) => cb())
}
