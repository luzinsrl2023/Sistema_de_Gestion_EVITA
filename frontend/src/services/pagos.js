// Servicio de Pagos: almacena en localStorage para DEMO
const STORAGE_KEY = 'evita-pagos'

function read() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    return []
  }
  try { return JSON.parse(raw) } catch { return [] }
}

function write(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export async function listPagos() {
  return Promise.resolve(read())
}

export async function createPago(pago) {
  const list = read()
  const id = pago.id || `PAY-${Date.now()}`
  const toSave = [...list, { ...pago, id }]
  write(toSave)
  return Promise.resolve({ ...pago, id })
}

export async function listPagosByInvoice(invoiceId) {
  const list = read()
  return Promise.resolve(list.filter(p => p.invoiceId === invoiceId))
}

export async function listPagosByClient(client) {
  const list = read()
  return Promise.resolve(list.filter(p => (p.client || '') === (client || '')))
}

