// Servicio de Compras (Órdenes de Compra): almacena en localStorage para DEMO
const STORAGE_KEY = 'evita-compras'

const defaultData = [
  { id: 'PO-001', supplier: 'TecnoGlobal S.A.', date: '2023-12-10', total: 25000, status: 'completed', items: 15, dueDate: '2023-12-20' },
  { id: 'PO-002', supplier: 'Soluciones de Oficina Ltda.', date: '2023-11-28', total: 12500, status: 'pending', items: 8, dueDate: '2023-12-15' },
  { id: 'PO-003', supplier: 'Componentes & Cia.', date: '2023-12-08', total: 45000, status: 'completed', items: 22, dueDate: '2023-12-25' },
  { id: 'PO-004', supplier: 'Distribuidora Norte', date: '2023-10-15', total: 5400, status: 'cancelled', items: 3, dueDate: '2023-11-01' },
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

export async function listCompras() {
  return Promise.resolve(read())
}

export async function createCompra(order) {
  const list = read()
  const exists = list.some(o => o.id === order.id)
  const toSave = exists ? list.map(o => o.id === order.id ? order : o) : [...list, order]
  write(toSave)
  return Promise.resolve(order)
}

export async function updateCompra(id, patch) {
  const list = read()
  const updated = list.map(o => o.id === id ? { ...o, ...patch } : o)
  write(updated)
  return Promise.resolve(updated.find(o => o.id === id))
}

export async function deleteCompra(id) {
  const list = read()
  const next = list.filter(o => o.id !== id)
  write(next)
  return Promise.resolve({ id })
}

