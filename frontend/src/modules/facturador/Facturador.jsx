import React, { useMemo, useState } from 'react'
import { Plus, Trash2, Download, Save, FileText } from 'lucide-react'
import { exportSectionsToPDF } from '../../common'
import { useFacturas } from '../../hooks/useFacturas'
import { useClientes } from '../../hooks/useClientes'
import { useProductos } from '../../hooks/useProductos'
import { useCotizaciones } from '../../hooks/useCotizaciones'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'


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
  const { theme } = useTheme()
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
          <div className={cn('p-2 rounded-lg', `bg-${theme.colors.primaryLight}`)}>
            <FileText className={cn('h-6 w-6', `text-${theme.colors.primaryText}`)} />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>Facturador</h1>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Genera facturas para tus clientes</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGuardar}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2',
              `bg-${theme.colors.surface} text-${theme.colors.text} hover:bg-${theme.colors.border}`,
              `focus:ring-${theme.colors.primary}`
            )}
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
          <button
            onClick={handlePDF}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2',
              `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`,
              `focus:ring-${theme.colors.primary}`
            )}
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Import from Quotation */}
      <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Importar desde Cotización</label>
            <div className="relative">
              <input
                list="cotizaciones-list"
                className={cn('input pr-10', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text} placeholder-${theme.colors.textMuted}`)}
                placeholder="Buscar por ID de cotización (ej: COT-000001)"
                value={selectedCotId}
                onChange={e => setSelectedCotId(e.target.value)}
              />
              <datalist id="cotizaciones-list">
                {cotizaciones.map(c => <option key={c.id} value={c.id} />)}
              </datalist>
              {selectedCotId && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => importFromCotizacion(selectedCotId)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              `bg-${theme.colors.primary} text-white hover:bg-${theme.colors.primaryHover}`
            )}
          >
            <Download className="h-4 w-4" /> Importar
          </button>
        </div>
      </div>

      {/* Client Information */}
      <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <h2 className={cn('font-semibold text-lg mb-5 flex items-center gap-2', `text-${theme.colors.text}`)}>
          <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
          Información del Cliente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-group">
            <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Nombre del Cliente</label>
            <input
              list="clientes-list"
              className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text} placeholder-${theme.colors.textMuted}`)}
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
            <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Email</label>
            <input
              type="email"
              className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text} placeholder-${theme.colors.textMuted}`)}
              placeholder="email@ejemplo.com"
              value={customer.email}
              onChange={e => setCustomer(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Invoice Information */}
      <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <h2 className={cn('font-semibold text-lg mb-5 flex items-center gap-2', `text-${theme.colors.text}`)}>
          <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
          Información de la Factura
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="form-group">
            <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Fecha</label>
            <input
              type="date"
              className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
              value={meta.fecha}
              onChange={e => setMeta(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Vencimiento</label>
            <input
              type="date"
              className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
              value={meta.vencimiento}
              onChange={e => setMeta(prev => ({ ...prev, vencimiento: e.target.value }))}
            />
          </div>
          <div className="form-group md:col-span-2">
            <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Plazo de pago</label>
            <select
              defaultValue="30"
              onChange={e => {
                const v = e.target.value
                const days = v === 'contado' ? 0 : Number(v)
                setMeta(prev => ({
                  ...prev,
                  vencimiento: days === 0
                    ? prev.fecha
                    : new Date(new Date(prev.fecha).getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                }))
              }}
              className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
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
            <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Notas</label>
            <input
              className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
              placeholder="Notas adicionales"
              value={meta.notas}
              onChange={e => setMeta(prev => ({ ...prev, notas: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className={cn('font-semibold text-lg flex items-center gap-2', `text-${theme.colors.text}`)}>
            <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
            Productos
          </h2>
          <button
            onClick={addItem}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              `bg-${theme.colors.primary} text-white hover:bg-${theme.colors.primaryHover}`
            )}
          >
            <Plus className="h-4 w-4" />
            Agregar Producto
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {items.map((it, index) => (
            <div key={it.id} className={cn('grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg transition-colors', `bg-${theme.colors.background}/50 hover:bg-${theme.colors.background}`)}>
              <div className="md:col-span-6">
                <label className={cn('text-xs mb-1 block', `text-${theme.colors.textMuted}`)}>Producto</label>
                <input
                  list={`productos-list-${it.id}`}
                  className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                  placeholder="Producto"
                  value={it.nombre}
                  onChange={e => {
                    const nombre = e.target.value
                    const p = productos.find(pr => pr.name === nombre)
                    updateItem(it.id, { nombre, precio: p?.price ?? it.precio })
                  }}
                />
                <datalist id={`productos-list-${it.id}`}>
                  {productos.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <label className={cn('text-xs mb-1 block', `text-${theme.colors.textMuted}`)}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                  placeholder="Cantidad"
                  value={it.cantidad}
                  onChange={e => updateItem(it.id, { cantidad: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2">
                <label className={cn('text-xs mb-1 block', `text-${theme.colors.textMuted}`)}>Precio</label>
                <input
                  type="number"
                  step="0.01"
                  className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                  placeholder="Precio"
                  value={it.precio}
                  onChange={e => updateItem(it.id, { precio: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-1 text-right">
                <label className={cn('text-xs mb-1 block', `text-${theme.colors.textMuted}`)}>Total</label>
                <div className={cn('font-medium', `text-${theme.colors.text}`)}>$ {(Number(it.cantidad || 0) * Number(it.precio || 0)).toFixed(2)}</div>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button
                  onClick={() => removeItem(it.id)}
                  className={cn(
                    'p-2 rounded-md border transition-colors',
                    `border-${theme.colors.border} hover:bg-${theme.colors.error}/10 hover:border-${theme.colors.error}/30 text-${theme.colors.error} hover:text-${theme.colors.error}`
                  )}
                  aria-label="Eliminar producto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <div className={cn('rounded-lg p-4 md:p-5', `bg-${theme.colors.background}/50`)}>
          <div className="space-y-3 max-w-xs ml-auto">
            <div className={cn('flex justify-between', `text-${theme.colors.textSecondary}`)}>
              <span>Subtotal:</span>
              <span className="font-medium">$ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className={cn('flex justify-between', `text-${theme.colors.textSecondary}`)}>
              <span>IVA (21%):</span>
              <span className="font-medium">$ {totals.iva.toFixed(2)}</span>
            </div>
            <div className={cn('flex justify-between pt-3', `border-t border-${theme.colors.border}`)}>
              <span className={cn('font-semibold', `text-${theme.colors.text}`)}>Total:</span>
              <span className={cn('font-bold text-lg', `text-${theme.colors.primaryText}`)}>$ {totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={cn('flex flex-col sm:flex-row gap-3 mt-6 pt-5', `border-t border-${theme.colors.border}`)}>
          <button
            onClick={handleGuardar}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
              `bg-${theme.colors.primary} hover:bg-${theme.colors.primaryHover} text-white`
            )}
          >
            <Save className="h-4 w-4" />
            Guardar Factura
          </button>
          <button
            onClick={handlePDF}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
              `bg-${theme.colors.primary} hover:bg-${theme.colors.primaryHover} text-white`
            )}
          >
            <Download className="h-4 w-4" />
            Generar PDF
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
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
        <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
          <h2 className={cn('font-semibold text-lg mb-4 flex items-center gap-2', `text-${theme.colors.text}`)}>
            <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
            Últimas facturas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('text-left text-sm', `text-${theme.colors.textMuted} border-b border-${theme.colors.border}`)}>
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', `divide-${theme.colors.border}`)}>
                {facturas.slice(-5).reverse().map(f => (
                  <tr key={f.id} className={cn('transition-colors', `hover:bg-${theme.colors.background}/50`)}>
                    <td className={cn('py-3 text-sm', `text-${theme.colors.textSecondary}`)}>{f.id}</td>
                    <td className={cn('py-3 text-sm', `text-${theme.colors.textSecondary}`)}>{f.client || '-'}</td>
                    <td className={cn('py-3 text-sm', `text-${theme.colors.textSecondary}`)}>{f.date}</td>
                    <td className={cn('py-3 text-sm text-right font-medium', `text-${theme.colors.text}`)}>$ {Number(f.total || 0).toFixed(2)}</td>
                    <td className="py-3 text-sm text-right">
                      <button
                        onClick={() => {
                          setCustomer({ nombre: f.client || '', email: f.cliente?.email || '' });
                          setMeta({
                            fecha: f.date || new Date().toISOString().slice(0, 10),
                            vencimiento: f.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                            notas: f.notas || ''
                          });
                          setItems(f.productos || [{ id: 1, nombre: '', cantidad: 1, precio: 0 }]);
                          setTimeout(() => window.print(), 100);
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
                          `bg-${theme.colors.surface} hover:bg-${theme.colors.border} text-${theme.colors.text}`
                        )}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
