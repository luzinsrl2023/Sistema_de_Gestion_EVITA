import React, { useMemo, useState } from 'react'
import { Plus, Trash2, Download, Save, FileText } from 'lucide-react'
import { exportSectionsToPDF } from '../../common'
import { useCotizaciones } from '../../hooks/useCotizaciones'
import { useClientes } from '../../hooks/useClientes'
import { useProductos } from '../../hooks/useProductos'

function nextCotizacionId() {
  try {
    const raw = localStorage.getItem('evita-cotizacion-seq')
    const current = raw ? parseInt(raw, 10) : 0
    const next = isNaN(current) ? 1 : current + 1
    localStorage.setItem('evita-cotizacion-seq', String(next))
    return `COT-${String(next).padStart(6, '0')}`
  } catch {
    return `COT-${Date.now()}`
  }
}

export default function Cotizaciones() {
  const { data: cotizaciones = [], addCotizacion } = useCotizaciones()
  const { data: clientes = [] } = useClientes()
  const { data: productos = [] } = useProductos()

  const [customer, setCustomer] = useState({ nombre: '', email: '' })
  const [meta, setMeta] = useState({ fecha: new Date().toISOString().slice(0,10), validezDias: 15, notas: '' })
  const [items, setItems] = useState([{ id: 1, nombre: '', cantidad: 1, precio: 0 }])

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
    const id = nextCotizacionId()
    const payload = { id, cliente: customer, fecha: meta.fecha, validezDias: meta.validezDias, notas: meta.notas, items, totales: totals }
    await addCotizacion(payload)
    alert(`Cotización ${id} guardada`)
  }

  async function handlePDF() {
    const id = nextCotizacionId()
    const head = ['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']
    const body = items.map(it => [it.nombre || '-', String(it.cantidad||0), `$ ${Number(it.precio||0).toFixed(2)}`, `$ ${(Number(it.cantidad||0)*Number(it.precio||0)).toFixed(2)}`])
    body.push([{ text: 'Subtotal', colSpan: 3, alignment: 'right' }, {}, {}, `$ ${totals.subtotal.toFixed(2)}`])
    body.push([{ text: 'IVA 21%', colSpan: 3, alignment: 'right' }, {}, {}, `$ ${totals.iva.toFixed(2)}`])
    body.push([{ text: 'TOTAL', colSpan: 3, alignment: 'right', bold: true }, {}, {}, { text: `$ ${totals.total.toFixed(2)}`, bold: true }])

    await exportSectionsToPDF({
      title: `Cotización ${id}`,
      sections: [
        { title: `Cliente: ${customer.nombre || '-'}`, head: [], body: [
          [{ text: `Email: ${customer.email || '-'}` }],
          [{ text: `Fecha: ${meta.fecha}` }],
          [{ text: `Validez: ${meta.validezDias} días` }],
          ...(meta.notas ? [[{ text: `Notas: ${meta.notas}` }]] : [])
        ] },
        { title: 'Detalle', head, body }
      ],
      filename: `${id}.pdf`,
      brand: 'EVITA',
      subtitle: 'Cotización de productos'
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5"/> Cotizaciones</h1>
        <div className="flex gap-2">
          <button onClick={handleGuardar} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"><Save className="h-4 w-4"/>Guardar</button>
          <button onClick={handlePDF} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"><Download className="h-4 w-4"/>PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
          <h2 className="font-medium mb-3">Cliente</h2>
          <div className="space-y-3">
            <input list="clientes-list" className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700" placeholder="Buscar cliente" value={customer.nombre}
              onChange={e=>{
                const nombre = e.target.value
                const found = clientes.find(c=>c.name===nombre)
                setCustomer(v=>({ ...v, nombre, email: found?.email || v.email }))
              }} />
            <datalist id="clientes-list">
              {clientes.map(c=> <option key={c.id} value={c.name} />)}
            </datalist>
            <input className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700" placeholder="Email" value={customer.email}
              onChange={e=>setCustomer(v=>({ ...v, email: e.target.value }))} />
          </div>
        </div>
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
          <h2 className="font-medium mb-3">Datos</h2>
          <div className="space-y-3">
            <input type="date" className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700" value={meta.fecha} onChange={e=>setMeta(v=>({ ...v, fecha: e.target.value }))} />
            <input type="number" className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700" placeholder="Validez (días)" value={meta.validezDias} onChange={e=>setMeta(v=>({ ...v, validezDias: Number(e.target.value) }))} />
            <textarea className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700" placeholder="Notas" value={meta.notas} onChange={e=>setMeta(v=>({ ...v, notas: e.target.value }))} />
          </div>
        </div>
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
          <h2 className="font-medium mb-3">Totales</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between"><span>Subtotal</span><span>$ {totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>IVA (21%)</span><span>$ {totals.iva.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-white"><span>Total</span><span>$ {totals.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Ítems</h2>
          <button onClick={addItem} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 hover:bg-gray-800"><Plus className="h-4 w-4"/>Agregar</button>
        </div>

        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <input list="productos-list" className="md:col-span-6 px-3 py-2 rounded-md bg-gray-900 border border-gray-700" placeholder="Producto" value={it.nombre}
                onChange={e=>{
                  const nombre = e.target.value
                  const p = productos.find(pr=>pr.name===nombre)
                  updateItem(it.id,{ nombre, precio: p?.price ?? it.precio })
                }} />
              <datalist id="productos-list">
                {productos.map(p=> <option key={p.id} value={p.name} />)}
              </datalist>
              <input type="number" min="1" className="md:col-span-2 px-3 py-2 rounded-md bg-gray-900 border border-gray-700" placeholder="Cantidad" value={it.cantidad} onChange={e=>updateItem(it.id,{ cantidad: Number(e.target.value) })} />
              <input type="number" step="0.01" className="md:col-span-2 px-3 py-2 rounded-md bg-gray-900 border border-gray-700" placeholder="Precio" value={it.precio} onChange={e=>updateItem(it.id,{ precio: Number(e.target.value) })} />
              <div className="md:col-span-1 text-right text-sm">$ {((Number(it.cantidad)||0)*(Number(it.precio)||0)).toFixed(2)}</div>
              <button onClick={()=>removeItem(it.id)} className="md:col-span-1 w-full md:w-auto inline-flex items-center justify-center p-2 rounded-md border border-gray-700 hover:bg-gray-800 text-red-400"><Trash2 className="h-4 w-4"/></button>
            </div>
          ))}
        </div>
      </div>

      {cotizaciones.length > 0 && (
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
          <h2 className="font-medium mb-2">Últimas cotizaciones</h2>
          <div className="text-sm text-gray-300 space-y-1">
            {cotizaciones.slice(-5).reverse().map(c => (
              <div key={c.id} className="flex justify-between border-b border-gray-800 pb-1">
                <span>{c.id} · {c.cliente?.nombre || '-'} · {c.fecha}</span>
                <span>$ {Number(c.totales?.total||0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

