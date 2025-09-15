// Servicio de Clientes (demo): localStorage con datos por defecto
const STORAGE_KEY = 'evita-clientes'

const defaultData = [
  { id: 'CLI001', name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '(555) 123-4567', address: '', totalPurchases: 1250, lastPurchase: '2023-11-15', paymentStatus: 'pagado', status: 'activo' },
  { id: 'CLI002', name: 'Ana Gómez', email: 'ana.gomez@example.com', phone: '(555) 987-6543', address: '', totalPurchases: 875, lastPurchase: '2023-10-20', paymentStatus: 'pendiente', status: 'activo' },
  { id: 'CLI003', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@example.com', phone: '(555) 246-8013', address: '', totalPurchases: 2100, lastPurchase: '2023-12-01', paymentStatus: 'pagado', status: 'activo' },
  { id: 'CLI004', name: 'Laura Fernández', email: 'laura.fernandez@example.com', phone: '(555) 369-1215', address: '', totalPurchases: 550, lastPurchase: '2023-11-28', paymentStatus: 'pagado', status: 'bloqueado' },
]

function read() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData)); return defaultData }
  try { return JSON.parse(raw) } catch { return defaultData }
}

function write(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }

export async function listClientes() { return Promise.resolve(read()) }

export async function createCliente(cliente) {
  const list = read()
  const next = [...list, cliente]
  write(next)
  return Promise.resolve(cliente)
}

export async function updateCliente(id, patch) {
  const list = read().map(c => c.id === id ? { ...c, ...patch } : c)
  write(list)
  return Promise.resolve(list.find(c => c.id === id))
}

export async function deleteCliente(id) {
  const next = read().filter(c => c.id !== id)
  write(next)
  return Promise.resolve({ id })
}

