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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Facturador</h1>
        <p className="text-gray-400 mt-1">
          Genera facturas para tus clientes
        </p>
      </div>

      <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">Importar desde Cotización</label>
            <input
              list="cotizaciones-list"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Buscar por ID de cotización (ej: COT-000001)"
              value={selectedCotId}
              onChange={e => setSelectedCotId(e.target.value)}
            />
            <datalist id="cotizaciones-list">
              {cotizaciones.map(c => <option key={c.id} value={c.id} />)}
            </datalist>
          </div>
          <button
            type="button"
            onClick={() => importFromCotizacion(selectedCotId)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <Download className="h-4 w-4" /> Importar
          </button>
        </div>
      </div>


      <div className="bg-gray-900/40 p-6 rounded-lg border border-gray-800">
        <h2 className="text-lg font-medium text-white mb-4">Información del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Cliente</label>
            <input
              list="clientes-list"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="email@ejemplo.com"
              value={customer.email}
              onChange={e => setCustomer(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900/40 p-6 rounded-lg border border-gray-800">
        <h2 className="text-lg font-medium text-white mb-4">Información de la Factura</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fecha</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              value={meta.fecha}
              onChange={e => setMeta(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vencimiento</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              value={meta.vencimiento}
              onChange={e => setMeta(prev => ({ ...prev, vencimiento: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plazo de pago</label>
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
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="15">15 días</option>
              <option value="20">20 días</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
              <option value="contado">Contado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notas</label>
            <input
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Notas adicionales"
              value={meta.notas}
              onChange={e => setMeta(prev => ({ ...prev, notas: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900/40 p-6 rounded-lg border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Productos</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Producto
          </button>
        </div>

        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <input
                list="productos-list"
                className="md:col-span-6 px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Producto"
                value={it.nombre}
                onChange={e=>{
                  const nombre = e.target.value
                  const p = productos.find(pr=>pr.name===nombre)
                  updateItem(it.id,{ nombre, precio: p?.price ?? it.precio })
                }}
              />
              <datalist id="productos-list">
                {productos.map(p=> <option key={p.id} value={p.name} />)}
              </datalist>
              <input
                type="number"
                min="1"
                className="md:col-span-2 px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Cantidad"
                value={it.cantidad}
                onChange={e=>updateItem(it.id,{ cantidad: Number(e.target.value) })}
              />
              <input
                type="number"
                step="0.01"
                className="md:col-span-2 px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Precio"
                value={it.precio}
                onChange={e=>updateItem(it.id,{ precio: Number(e.target.value) })}
              />
              <div className="md:col-span-1 text-right text-white font-medium">
                $ {(Number(it.cantidad||0)*Number(it.precio||0)).toFixed(2)}
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="md:col-span-1 p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Subtotal:</span>
            <span>$ {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>IVA (21%):</span>
            <span>$ {totals.iva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Total:</span>
            <span>$ {totals.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleGuardar}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Save className="h-4 w-4" />
            Guardar Factura
          </button>
          <button
            onClick={handlePDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            Generar PDF
          </button>
        </div>
      </div>

      {facturas.length > 0 && (
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
          <h2 className="font-medium mb-2 text-white">Últimas facturas</h2>
          <div className="text-sm text-gray-300 space-y-1">
            {facturas.slice(-5).reverse().map(f => (
              <div key={f.id} className="flex justify-between border-b border-gray-800 pb-1">
                <span>{f.id} · {f.client || '-'} · {f.date}</span>
                <span>$ {Number(f.total||0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
