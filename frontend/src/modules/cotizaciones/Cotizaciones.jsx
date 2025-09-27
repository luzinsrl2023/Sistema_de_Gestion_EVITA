import React, { useMemo, useState, useCallback } from 'react'
import { Plus, Trash2, Download, Save, FileText } from 'lucide-react'
import { exportSectionsToPDF } from '../../common'
import { useCotizaciones } from '../../hooks/useCotizaciones'
import { useClientes } from '../../hooks/useClientes'
import { searchProducts } from '../../services/productos'
import debounce from 'lodash.debounce'

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

  const [customer, setCustomer] = useState({ nombre: '', email: '' })
  const [meta, setMeta] = useState({ fecha: new Date().toISOString().slice(0,10), validezDias: 15, notas: '' })
  const [items, setItems] = useState([{ id: 1, nombre: '', cantidad: 1, precio: 0, searchResults: [] }])
  const [activeSearch, setActiveSearch] = useState(null)

  const handleSearch = useCallback(
    debounce(async (query, itemId) => {
      if (query.length < 2) {
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, searchResults: [] } : item))
        return
      }
      const { data } = await searchProducts(query)
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, searchResults: data || [] } : item))
      setActiveSearch(itemId)
    }, 300),
    []
  )

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.cantidad)||0) * (Number(it.precio)||0), 0)
    const iva = +(subtotal * 0.21).toFixed(2)
    const total = +(subtotal + iva).toFixed(2)
    return { subtotal, iva, total }
  }, [items])

  function addItem() {
    setItems(prev => [...prev, { id: Date.now(), nombre: '', cantidad: 1, precio: 0, searchResults: [] }])
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-badge">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="section-title">Cotizaciones</h1>
            <p className="section-subtitle">Gestiona tus cotizaciones comerciales</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGuardar} 
            className="btn-secondary"
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
          <button 
            onClick={handlePDF} 
            className="btn-primary"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information Card */}
        <div className="lg:col-span-1 card p-5">
          <h2 className="font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            Cliente
          </h2>
          <div className="space-y-4">
            <div className="form-group">
              <label className="label">Nombre del cliente</label>
              <input 
                list="clientes-list" 
                className="input" 
                placeholder="Buscar cliente" 
                value={customer.nombre}
                onChange={e=>{
                  const nombre = e.target.value
                  const found = clientes.find(c=>c.name===nombre)
                  setCustomer(v=>({ ...v, nombre, email: found?.email || v.email }))
                }} 
              />
              <datalist id="clientes-list">
                {clientes.map(c=> <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label className="label">Correo electrónico</label>
              <input 
                className="input" 
                placeholder="Email" 
                value={customer.email}
                onChange={e=>setCustomer(v=>({ ...v, email: e.target.value }))} 
              />
            </div>
          </div>
        </div>

        {/* Metadata and Totals Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="card p-5">
            <h2 className="font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              Datos de la cotización
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="label">Fecha</label>
                <input 
                  type="date" 
                  className="input" 
                  value={meta.fecha} 
                  onChange={e=>setMeta(v=>({ ...v, fecha: e.target.value }))} 
                />
              </div>
              <div className="form-group">
                <label className="label">Validez (días)</label>
                <input 
                  type="number" 
                  className="input" 
                  placeholder="Validez (días)" 
                  value={meta.validezDias} 
                  onChange={e=>setMeta(v=>({ ...v, validezDias: Number(e.target.value) }))} 
                />
              </div>
              <div className="form-group md:col-span-3">
                <label className="label">Notas</label>
                <textarea 
                  className="input" 
                  style={{ minHeight: '100px' }}
                  placeholder="Notas adicionales" 
                  value={meta.notas} 
                  onChange={e=>setMeta(v=>({ ...v, notas: e.target.value }))} 
                />
              </div>
            </div>
          </div>

          {/* Totals Card */}
          <div className="card p-5">
            <h2 className="font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              Resumen
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="font-medium">$ {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>IVA (21%)</span>
                <span className="font-medium">$ {totals.iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-semibold text-text-primary">Total</span>
                <span className="font-bold text-lg text-accent">$ {totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="font-semibold text-lg text-text-primary flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            Productos
          </h2>
          <button 
            onClick={addItem} 
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Agregar producto
          </button>
        </div>

        <div className="space-y-4">
          {items.map((it, index) => (
            <div key={it.id} className="product-row">
              <div className="md:col-span-6 relative">
                <label className="text-xs text-text-muted mb-1 block">Producto</label>
                <input
                  autoComplete="off"
                  className="input"
                  placeholder="Buscar por nombre o SKU"
                  value={it.nombre}
                  onChange={e => {
                    const nombre = e.target.value
                    updateItem(it.id, { nombre })
                    handleSearch(nombre, it.id)
                  }}
                  onFocus={() => setActiveSearch(it.id)}
                />
                {activeSearch === it.id && it.searchResults?.length > 0 && (
                  <div className="absolute z-10 w-full bg-bg-primary border border-border rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {it.searchResults.map(p => (
                      <div
                        key={p.id}
                        onMouseDown={() => {
                          updateItem(it.id, { nombre: p.name, precio: p.price, searchResults: [] })
                          setActiveSearch(null)
                        }}
                        className="px-4 py-2 hover:bg-bg-secondary cursor-pointer text-sm text-text-secondary"
                      >
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-text-muted">SKU: {p.sku}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-text-muted mb-1 block">Cantidad</label>
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
                <label className="text-xs text-text-muted mb-1 block">Precio</label>
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
                <label className="text-xs text-text-muted mb-1 block">Total</label>
                <div className="text-text-primary font-medium">$ {((Number(it.cantidad)||0)*(Number(it.precio)||0)).toFixed(2)}</div>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button 
                  onClick={()=>removeItem(it.id)} 
                  className="p-2 rounded-md border border-border hover:bg-error/10 hover:border-error/30 text-error hover:opacity-90 transition-colors"
                  aria-label="Eliminar producto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-border">
        <button
          onClick={handleGuardar}
          className="btn-primary"
        >
          <Save className="h-4 w-4" />
          Guardar Cotización
        </button>
        <button
          onClick={handlePDF}
          className="btn-primary"
        >
          <Download className="h-4 w-4" />
          Generar PDF
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimir
        </button>
      </div>

      {/* Recent Quotations */}
      {cotizaciones.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            Últimas cotizaciones
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-text-muted text-sm border-b border-border">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cotizaciones.slice(-5).reverse().map(c => (
                  <tr key={c.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="py-3 text-sm text-text-secondary">{c.id}</td>
                    <td className="py-3 text-sm text-text-secondary">{c.cliente?.nombre || '-'}</td>
                    <td className="py-3 text-sm text-text-secondary">{c.fecha}</td>
                    <td className="py-3 text-sm text-right font-medium text-text-primary">$ {Number(c.totales?.total||0).toFixed(2)}</td>
                    <td className="py-3 text-sm text-right">
                      <button 
                        onClick={() => {
                          // Set the current quotation as the one to view
                          setCustomer({ nombre: c.cliente?.nombre || '', email: c.cliente?.email || '' });
                          setMeta({
                            fecha: c.fecha || new Date().toISOString().slice(0,10),
                            validezDias: c.validezDias || 15,
                            notas: c.notas || ''
                          });
                          setItems(c.items || [{ id: 1, nombre: '', cantidad: 1, precio: 0 }]);
                          // Trigger print after a short delay to allow state update
                          setTimeout(() => window.print(), 100);
                        }}
                        className="btn-secondary text-xs"
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