const STORAGE_KEY = 'evita-offline-queue'

export function enqueueOperation(operation) {
  const queue = getQueue()
  queue.push({ ...operation, id: crypto.randomUUID(), ts: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function getQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearQueue() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
}

export async function processQueue(processor) {
  const queue = getQueue()
  const remaining = []
  for (const item of queue) {
    try {
      // processor must throw on failure
      await processor(item)
    } catch (e) {
      remaining.push(item)
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
  return { processed: queue.length - remaining.length, remaining: remaining.length }
}


