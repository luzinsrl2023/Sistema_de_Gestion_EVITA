import { processQueue } from './offlineQueue'

export function registerOnlineSync(processor) {
  const trySync = async () => {
    if (!navigator.onLine) return
    try {
      await processQueue(processor)
    } catch {
      // swallow, will retry on next online
    }
  }

  window.addEventListener('online', trySync)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trySync()
  })

  // initial attempt
  trySync()

  return () => {
    window.removeEventListener('online', trySync)
  }
}


