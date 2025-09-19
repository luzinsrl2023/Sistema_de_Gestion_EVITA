import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { exportPurchaseOrderPDF } from '../../common'

function nextOrderId() {
  try {
    const raw = localStorage.getItem('evita-orden-seq')
    const current = raw ? parseInt(raw, 10) : 0
    const next = isNaN(current) ? 1 : current + 1
    localStorage.setItem('evita-orden-seq', String(next))
    return `PO-${String(next).padStart(6, '0')}`
  } catch {
    return `PO-${Date.now()}`
  }
}

function parseDaysFromTerms(terms) {
  if (!terms) return 30
  const t = String(terms).toLowerCase()
  if (t.includes('contado') || t === 'cod') return 0
  const m = t.match(/net\s*(\d+)/)
  return m ? parseInt(m[1], 10) : 30
}

function getSupplierTermsDays(name) {
  try {
    const raw = localStorage.getItem('evita-suppliers')
    if (raw) {
      const arr = JSON.parse(raw)
      const found = Array.isArray(arr) ? arr.find(s => s.name === name) : null
      if (found && found.paymentTerms) return parseDaysFromTerms(found.paymentTerms)
    }
  } catch(_) {}
  const fallback = {
    'TecnoGlobal S.A.': 'Net 30',
    'Soluciones de Oficina Ltda.': 'Net 15',
    'Componentes & Cia.': 'Net 60',
    'Distribuidora Norte': 'COD'
  }
  return parseDaysFromTerms(fallback[name] || 'Net 30')
}

function addDays(dateStr, days) {
  if (!dateStr) return ''
  const dt = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(dt.getTime())) return ''
  dt.setDate(dt.getDate() + Number(days || 0))
  return dt.toISOString().slice(0,10)
}



function buildOrderFromForm() {
  const f = document.getElementById('orden-form')
  if (!f) return null
  const id = f['id']?.value || ''
  const supplier = f['supplier']?.value || ''
  const date = f['date']?.value || ''
  const dueDate = f['dueDate']?.value || ''
  const name = f['product']?.value || ''
  const qty = Number(f['qty']?.value || 0)
  const price = Number(f['price']?.value || 0)
  const items = name ? [{ name, qty, price }] : []
  const total = items.reduce((a, it) => a + (Number(it.qty)||0) * (Number(it.price)||0), 0)
  return { id, supplier, date, dueDate, items, total }
}

async function handleGeneratePDF(e, isDemoMode) {
  e?.preventDefault?.()
  if (isDemoMode) {
    alert('Acción no permitida en modo demo.')
    return
  }
  const order = buildOrderFromForm()
  if (!order) return
  try {
    await exportPurchaseOrderPDF({
      id: order.id,
      supplier: order.supplier,
      date: order.date,
      dueDate: order.dueDate,
      total: order.total,
      items: order.items,
      filename: `OC-${order.id}.pdf`
    })
  } catch (err) {
    console.error(err)
    alert('No se pudo generar el PDF de la Orden de Compra')
  }
}


export default function OrdenForm() {
  const { user } = useAuth()
  const isDemoMode = user?.demo === true

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isDemoMode) {
      alert('Acción no permitida en modo demo.')
      return
    }
    // Handle form submission logic here
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Nueva Orden de Compra</h1>
          <p className="text-gray-400 mt-1">Crea una nueva orden de compra para tus proveedores</p>
        </div>
        <button onClick={(e) => handleGeneratePDF(e, isDemoMode)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Descargar OC en PDF">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" x2="8" y1="13" y2="13"></line>
            <line x1="16" x2="8" y1="17" y2="17"></line>
            <line x1="10" x2="8" y1="9" y2="9"></line>
          </svg>
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <form id="orden-form" onSubmit={handleSubmit} className="space-y-6">
          {isDemoMode && (
            <div className="p-3 mb-4 text-sm text-yellow-300 bg-yellow-900/30 rounded-lg" role="alert">
              <span className="font-medium">Modo Demo:</span> Las funciones de guardado están deshabilitadas.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                ID de Orden
              </label>
              <input
                id="id"
                name="id"
                type="text"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="PO-XXX"
                defaultValue={nextOrderId()}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Proveedor
              </label>
              <select
                id="supplier"
                name="supplier"
                onChange={(e)=>{
                  const f = document.getElementById('orden-form')
                  const supplier = e.target.value
                  const baseDate = f?.date?.value || new Date().toISOString().slice(0,10)
                  if (f && !f.date.value) f.date.value = baseDate
                  const days = getSupplierTermsDays(supplier)
                  const venc = addDays(baseDate, days)
                  if (f) f.dueDate.value = venc
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar proveedor</option>
                <option value="TecnoGlobal S.A.">TecnoGlobal S.A.</option>
                <option value="Soluciones de Oficina Ltda.">Soluciones de Oficina Ltda.</option>
                <option value="Componentes & Cia.">Componentes & Cia.</option>
                <option value="Distribuidora Norte">Distribuidora Norte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fecha
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0,10)}
                onChange={(e)=>{
                  const f = document.getElementById('orden-form')
                  const supplier = f?.supplier?.value || ''
                  const days = getSupplierTermsDays(supplier)
                  const venc = addDays(e.target.value, days)
                  if (f) f.dueDate.value = venc
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fecha de Vencimiento
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                defaultValue={addDays(new Date().toISOString().slice(0,10), getSupplierTermsDays(''))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Productos
            </label>
            <div className="border border-gray-700 rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Precio</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="px-4 py-2">
                        <select id="product" name="product" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                          <option>Limpiador Multiuso EVITA Pro</option>
                          <option>Jabón Líquido para Manos EVITA</option>
                          <option>Desinfectante Antibacterial EVITA</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          id="qty"
                          name="qty"
                          type="number"
                          defaultValue="1"
                          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          id="price"
                          name="price"
                          type="number"
                          defaultValue="5.99"
                          className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                        />
                      </td>
                      <td className="px-4 py-2 text-white font-mono">
                        $5.99
                      </td>
                      <td className="px-4 py-2">
                        <button className="text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-700">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={(e) => handleGeneratePDF(e, isDemoMode)}
              disabled={isDemoMode}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${isDemoMode ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
              Generar PDF
            </button>
            <button
              type="submit"
              disabled={isDemoMode}
              className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${isDemoMode ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              Guardar Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Icons
function Plus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}

function Trash2() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  )
}