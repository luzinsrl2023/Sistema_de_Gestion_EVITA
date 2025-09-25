import React, { useMemo, useState } from 'react'
import { Plus, Trash2, Download, Save, FileText } from 'lucide-react'
import { exportSectionsToPDF } from '../../common'
import { useFacturas } from '../../hooks/useFacturas'
import { useClientes } from '../../hooks/useClientes'
import { useProductos } from '../../hooks/useProductos'
import { useCotizaciones } from '../../hooks/useCotizaciones'


function nextFacturaId() {
  try {
    const raw = localStorage.getItem('evita-factura-seq')
    const current = raw ? parseInt(raw, 10) : 0
    const next = isNaN(current) ? 1 : current + 1
    localStorage.setItem('evita-factura-seq', String(next))
    return `FAC-${String(next).padStart(6, '0')}`
  } catch {
    return `FAC-${Date.now()}`
  }
}

export default function Facturador() {
  const { data: facturas = [], addFactura } = useFacturas()
  const { data: clientes = [] } = useClientes()
  const { data: productos = [] } = useProductos()
  const { data: cotizaciones = [] } = useCotizaciones()
  const [selectedCotId, setSelectedCotId] = useState('')


  const [customer, setCustomer] = useState({ nombre: '', email: '' })
  const [meta, setMeta] = useState({
    fecha: new Date().toISOString().slice(0,10),
    vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10),
    notas: ''
  })
  const [items, setItems] = useState([{ id: 1, nombre: '', cantidad: 1, precio: 0 }])

  function importFromCotizacion(id) {
    const c = cotizaciones.find(x => x.id === id)
    if (!c) {
      alert('Cotización no encontrada')
      return
    }
    setSelectedCotId(id)
    setCustomer({ nombre: c.cliente?.nombre || '', email: c.cliente?.email || '' })
    setItems((c.items && c.items.length ? c.items : [{ id: 1, nombre: '', cantidad: 1, precio: 0 }]).map((it, idx) => ({
      id: it.id || Date.now() + idx,
      nombre: it.nombre || '',
      cantidad: Number(it.cantidad) || 1,
      precio: Number(it.precio) || 0
    })))
    setMeta(prev => ({
      ...prev,
      fecha: new Date().toISOString().slice(0,10),
      vencimiento: new Date(Date.now() + ((c.validezDias || 30) * 24 * 60 * 60 * 1000)).toISOString().slice(0,10),
      notas: c.notas || prev.notas
    }))
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.cantidad)||0) * (Number(it.precio)||0), 0)
    const iva = +(subtotal * 0.21).toFixed(2)
    const total = +(subtotal + iva).toFixed(2)
    return { subtotal, iva, total }
  }, [items])

  function addItem() {
    setItems(prev => [...prev, { id: Date.now(), nombre: '', cantidad: 1, precio: 0 }])
  }
  function removeItem(id) {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev)
  }
  function updateItem(id, patch) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  async function handleGuardar() {
    // Evitar guardar dos veces la misma cotización
    if (selectedCotId) {
      const yaExiste = facturas.some(f => f.cotizacionId === selectedCotId)
      if (yaExiste) {
        alert(`Esta cotización (${selectedCotId}) ya fue facturada. Evitando duplicado.`)
        return
      }
    }

    const id = nextFacturaId()
    const payload = {
      id,
      client: customer.nombre,
      date: meta.fecha,
      dueDate: meta.vencimiento,
      total: totals.total,
      items: items.length,
      status: 'pendiente',
      cliente: customer,
      notas: meta.notas,
      productos: items,
      totales: totals,
      cotizacionId: selectedCotId || null,
    }
    await addFactura(payload)
    alert(`Factura ${id} guardada`)

    // Limpiar formulario
    setCustomer({ nombre: '', email: '' })
    setMeta({
      fecha: new Date().toISOString().slice(0,10),
      vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10),
      notas: ''
    })
    setItems([{ id: 1, nombre: '', cantidad: 1, precio: 0 }])
  }

  async function handlePDF() {
    const id = nextFacturaId()

    // Evitar guardar duplicado si ya existe factura para la misma cotización
    let puedeGuardar = true
    if (selectedCotId) {
      const yaExiste = facturas.some(f => f.cotizacionId === selectedCotId)
      if (yaExiste) {
        puedeGuardar = false
        console.warn(`La cotización ${selectedCotId} ya tiene factura, se generará el PDF sin volver a guardar.`)
      }
    }

    if (puedeGuardar) {
      const payload = {
        id,
        client: customer.nombre,
        date: meta.fecha,
        dueDate: meta.vencimiento,
        total: totals.total,
        items: items.length,
        status: 'pendiente',
        cliente: customer,
        notas: meta.notas,
        productos: items,
        totales: totals,
        cotizacionId: selectedCotId || null,
      }
      try { await addFactura(payload) } catch (e) { console.warn('No se pudo guardar la factura antes del PDF:', e) }
    }

    // Armar tabla y generar PDF con encabezado corporativo
    const head = ['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']
    const body = items.map(it => [
      it.nombre || '-',
      String(it.cantidad||0),
      `$ ${Number(it.precio||0).toFixed(2)}`,
      `$ ${(Number(it.cantidad||0)*Number(it.precio||0)).toFixed(2)}`
    ])
    body.push([{ text: 'Subtotal', colSpan: 3, alignment: 'right' }, {}, {}, `$ ${totals.subtotal.toFixed(2)}`])
    body.push([{ text: 'IVA 21%', colSpan: 3, alignment: 'right' }, {}, {}, `$ ${totals.iva.toFixed(2)}`])
    body.push([{ text: 'TOTAL', colSpan: 3, alignment: 'right', bold: true }, {}, {}, { text: `$ ${totals.total.toFixed(2)}`, bold: true }])

    await exportSectionsToPDF({
      title: `Factura ${id}`,
      sections: [
        { title: `Cliente: ${customer.nombre || '-'}`, head: [], body: [
          [{ text: `Email: ${customer.email || '-'}` }],
          [{ text: `Fecha: ${meta.fecha}` }],
          [{ text: `Vencimiento: ${meta.vencimiento}` }],
          ...(meta.notas ? [[{ text: `Notas: ${meta.notas}` }]] : [])
        ] },
        { title: 'Detalle', head, body }
      ],
      filename: `${id}.pdf`,
      brand: (JSON.parse(localStorage.getItem('evita-company')||'{}')?.name) || 'EVITA',
      subtitle: 'Factura de venta'
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <FileText className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Facturador</h1>
            <p className="text-sm text-gray-400">Genera facturas para tus clientes</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGuardar} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
          <button 
            onClick={handlePDF} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Import from Quotation */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="label">Importar desde Cotización</label>
            <div className="relative">
              <input
                list="cotizaciones-list"
                className="input pr-10"
                placeholder="Buscar por ID de cotización (ej: COT-000001)"
                value={selectedCotId}
                onChange={e => setSelectedCotId(e.target.value)}
              />
              <datalist id="cotizaciones-list">
                {cotizaciones.map(c => <option key={c.id} value={c.id} />)}
              </datalist>
              {selectedCotId && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => importFromCotizacion(selectedCotId)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
          >
            <Download className="h-4 w-4" /> Importar
          </button>
        </div>
      </div>

      {/* Client Information */}
      <div className="card p-5">
        <h2 className="font-semibold text-lg text-white mb-5 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Información del Cliente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-group">
            <label className="label">Nombre del Cliente</label>
            <input
              list="clientes-list"
              className="input"
              placeholder="Nombre del cliente"
              value={customer.nombre}
              onChange={e => {
                const nombre = e.target.value
                const c = clientes.find(cl => cl.name === nombre)
                setCustomer({ nombre, email: c?.email ?? customer.email })
              }}
            />
            <datalist id="clientes-list">
              {clientes.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="email@ejemplo.com"
              value={customer.email}
              onChange={e => setCustomer(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Invoice Information */}
      <div className="card p-5">
        <h2 className="font-semibold text-lg text-white mb-5 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Información de la Factura
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="form-group">
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={meta.fecha}
              onChange={e => setMeta(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Vencimiento</label>
            <input
              type="date"
              className="input"
              value={meta.vencimiento}
              onChange={e => setMeta(prev => ({ ...prev, vencimiento: e.target.value }))}
            />
          </div>
          <div className="form-group md:col-span-2">
            <label className="label">Plazo de pago</label>
            <select
              defaultValue="30"
              onChange={e => {
                const v = e.target.value
                const days = v === 'contado' ? 0 : Number(v)
                setMeta(prev => ({
                  ...prev,
                  vencimiento: days === 0
                    ? prev.fecha
                    : new Date(new Date(prev.fecha).getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0,10)
                }))
              }}
              className="input"
            >
              <option value="15">15 días</option>
              <option value="20">20 días</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
              <option value="contado">Contado</option>
            </select>
          </div>
          <div className="form-group md:col-span-4">
            <label className="label">Notas</label>
            <input
              className="input"
              placeholder="Notas adicionales"
              value={meta.notas}
              onChange={e => setMeta(prev => ({ ...prev, notas: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="font-semibold text-lg text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Productos
          </h2>
          <button
            onClick={addItem}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors border border-green-600/30"
          >
            <Plus className="h-4 w-4" />
            Agregar Producto
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {items.map((it, index) => (
            <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
              <div className="md:col-span-6">
                <label className="text-xs text-gray-400 mb-1 block">Producto</label>
                <input
                  list={`productos-list-${it.id}`}
                  className="input"
                  placeholder="Producto"
                  value={it.nombre}
                  onChange={e=>{
                    const nombre = e.target.value
                    const p = productos.find(pr=>pr.name===nombre)
                    updateItem(it.id,{ nombre, precio: p?.price ?? it.precio })
                  }}
                />
                <datalist id={`productos-list-${it.id}`}>
                  {productos.map(p=> <option key={p.id} value={p.name} />)}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="Cantidad"
                  value={it.cantidad}
                  onChange={e=>updateItem(it.id,{ cantidad: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="Precio"
                  value={it.precio}
                  onChange={e=>updateItem(it.id,{ precio: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-1 text-right">
                <label className="text-xs text-gray-400 mb-1 block">Total</label>
                <div className="text-white font-medium">$ {(Number(it.cantidad||0)*Number(it.precio||0)).toFixed(2)}</div>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button
                  onClick={() => removeItem(it.id)}
                  className="p-2 rounded-md border border-gray-700 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                  aria-label="Eliminar producto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <div className="bg-gray-800/30 rounded-lg p-4 md:p-5">
          <div className="space-y-3 max-w-xs ml-auto">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span className="font-medium">$ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>IVA (21%):</span>
              <span className="font-medium">$ {totals.iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-700">
              <span className="font-semibold text-white">Total:</span>
              <span className="font-bold text-lg text-green-400">$ {totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-gray-800">
          <button
            onClick={handleGuardar}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            <Save className="h-4 w-4" />
            Guardar Factura
          </button>
          <button
            onClick={handlePDF}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            Generar PDF
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      {facturas.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Últimas facturas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {facturas.slice(-5).reverse().map(f => (
                  <tr key={f.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 text-sm text-gray-300">{f.id}</td>
                    <td className="py-3 text-sm text-gray-300">{f.client || '-'}</td>
                    <td className="py-3 text-sm text-gray-300">{f.date}</td>
                    <td className="py-3 text-sm text-right font-medium text-white">$ {Number(f.total||0).toFixed(2)}</td>
                    <td className="py-3 text-sm text-right">
                      <button 
                        onClick={() => {
                          // Set the current invoice as the one to view
                          setCustomer({ nombre: f.client || '', email: f.cliente?.email || '' });
                          setMeta({
                            fecha: f.date || new Date().toISOString().slice(0,10),
                            vencimiento: f.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10),
                            notas: f.notas || ''
                          });
                          setItems(f.productos || [{ id: 1, nombre: '', cantidad: 1, precio: 0 }]);
                          // Trigger print after a short delay to allow state update
                          setTimeout(() => window.print(), 100);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9"></polyline>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                          <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Imprimir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
