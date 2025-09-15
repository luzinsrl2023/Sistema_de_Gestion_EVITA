// Servicio de Facturas: almacena en localStorage para DEMO
const STORAGE_KEY = 'evita-facturas'

const defaultData = [
  { id: 'INV-001', client: 'Juan Pérez', date: '2023-12-10', total: 25000, status: 'pagado', items: 15, dueDate: '2023-12-20' },
  { id: 'INV-002', client: 'Ana Gómez', date: '2023-11-28', total: 12500, status: 'pendiente', items: 8, dueDate: '2023-12-15' },
  { id: 'INV-003', client: 'Carlos Rodríguez', date: '2023-12-08', total: 45000, status: 'vencido', items: 22, dueDate: '2023-12-25' },
  { id: 'INV-004', client: 'Laura Fernández', date: '2023-10-15', total: 5400, status: 'pagado', items: 3, dueDate: '2023-11-01' },
]

function read() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
  try { return JSON.parse(raw) } catch { return defaultData }
}

function write(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export async function listFacturas() {
  return Promise.resolve(read())
}

export async function createFactura(factura) {
  const list = read()
  const exists = list.some(f => f.id === factura.id)
  const toSave = exists ? list.map(f => f.id === factura.id ? factura : f) : [...list, factura]
  write(toSave)
  return Promise.resolve(factura)
}

export async function updateFactura(id, patch) {
  const list = read()
  const updated = list.map(f => f.id === id ? { ...f, ...patch } : f)
  write(updated)
  return Promise.resolve(updated.find(f => f.id === id))
}

export async function deleteFactura(id) {
  const list = read()
  const next = list.filter(f => f.id !== id)
  write(next)
  return Promise.resolve({ id })
}

