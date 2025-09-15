// Servicio de Cotizaciones (demo): guarda en localStorage
const STORAGE_KEY = 'evita-cotizaciones'

function read() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify([])); return [] }
  try { return JSON.parse(raw) } catch { return [] }
}

function write(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export async function listCotizaciones() { return Promise.resolve(read()) }

export async function createCotizacion(cotizacion) {
  const list = read()
  const next = [...list, cotizacion]
  write(next)
  return Promise.resolve(cotizacion)
}

export async function updateCotizacion(id, patch) {
  const list = read()
  const updated = list.map(q => q.id === id ? { ...q, ...patch } : q)
  write(updated)
  return Promise.resolve(updated.find(q => q.id === id))
}

export async function deleteCotizacion(id) {
  const list = read()
  const next = list.filter(q => q.id !== id)
  write(next)
  return Promise.resolve({ id })
}

