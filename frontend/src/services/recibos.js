// Servicio de Recibos (demo): guarda en localStorage
const STORAGE_KEY = 'evita-recibos'

function read() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify([])); return [] }
  try { return JSON.parse(raw) } catch { return [] }
}

function write(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }

export async function listRecibos() {
  return Promise.resolve(read())
}

export async function createRecibo(recibo) {
  const list = read()
  const next = [...list, recibo]
  write(next)
  return Promise.resolve(recibo)
}

