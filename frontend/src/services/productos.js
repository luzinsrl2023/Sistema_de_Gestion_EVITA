// Servicio de Productos (demo): localStorage con datos por defecto
const STORAGE_KEY = 'evita-productos'

const defaultData = [
  { id: 'EVT001', name: 'Limpiador Multiuso EVITA Pro', category: 'Limpieza', sku: 'LMP-EVT-001', stock: 150, minStock: 50, price: 5.99, cost: 3.50, status: 'activo' },
  { id: 'EVT002', name: 'Desinfectante Antibacterial EVITA', category: 'Limpieza', sku: 'DES-EVT-002', stock: 120, minStock: 30, price: 8.99, cost: 5.20, status: 'activo' },
  { id: 'EVT003', name: 'Jabón Líquido para Manos EVITA', category: 'Limpieza', sku: 'JAB-EVT-003', stock: 20,  minStock: 50, price: 3.99, cost: 2.20, status: 'activo' },
  { id: 'EVT004', name: 'Detergente en Polvo Concentrado', category: 'Limpieza', sku: 'DET-EVT-004', stock: 80,  minStock: 25, price: 12.99, cost: 8.50, status: 'activo' },
  { id: 'EVT005', name: 'Limpiavidrios Profesional EVITA', category: 'Limpieza', sku: 'LVD-EVT-005', stock: 90,  minStock: 30, price: 4.49, cost: 2.80, status: 'activo' },
  { id: 'EVT006', name: 'Bombillas LED Eco 12W', category: 'Electricidad', sku: 'LED-ECO-012', stock: 180, minStock: 50, price: 3.49, cost: 2.10, status: 'activo' },
  { id: 'EVT007', name: 'Cable Eléctrico Flexible 2.5mm', category: 'Electricidad', sku: 'CAB-FLX-25', stock: 45,  minStock: 25, price: 2.99, cost: 1.80, status: 'activo' },
  { id: 'EVT008', name: 'Enchufe Universal con Toma Tierra', category: 'Electricidad', sku: 'ENC-UNI-TT', stock: 200, minStock: 75, price: 4.79, cost: 3.20, status: 'activo' },
  { id: 'EVT009', name: 'Bolsas Basura Biodegradables 50L', category: 'Generales', sku: 'BOL-BIO-50', stock: 250, minStock: 100, price: 1.99, cost: 1.20, status: 'activo' },
  { id: 'EVT010', name: 'Guantes de Nitrilo (Caja x100)', category: 'Seguridad', sku: 'GUA-NIT-100', stock: 60, minStock: 20, price: 14.99, cost: 10.50, status: 'activo' },
]

function read() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData)); return defaultData }
  try { return JSON.parse(raw) } catch { return defaultData }
}

function write(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }

export async function listProductos() { return Promise.resolve(read()) }
export async function upsertProducto(producto) {
  const list = read()
  const exists = list.some(p => p.id === producto.id)
  const next = exists ? list.map(p => p.id === producto.id ? { ...p, ...producto } : p) : [...list, producto]
  write(next)
  return Promise.resolve(producto)
}
export async function deleteProducto(id) {
  const list = read().filter(p => p.id !== id)
  write(list)
  return Promise.resolve({ id })
}

