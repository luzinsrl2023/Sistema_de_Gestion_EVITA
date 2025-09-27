import React, { useMemo, useState, useCallback } from 'react'
import { Plus, Trash2, Download, Save, FileText, Search } from 'lucide-react'
import { exportSectionsToPDF } from '../../common'
import { useCotizaciones } from '../../hooks/useCotizaciones'
import { useClientes } from '../../hooks/useClientes'
import { searchProducts } from '../../services/productos'
import debounce from 'lodash.debounce'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

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
  const { theme } = useTheme()

  const [customer, setCustomer] = useState({ nombre: '', email: '' })
  const [meta, setMeta] = useState({ fecha: new Date().toISOString().slice(0,10), validezDias: 15, notas: '' })
  const [items, setItems] = useState([{ id: 1, nombre: '', cantidad: 1, precio: 0, searchResults: [] }])
  const [activeSearch, setActiveSearch] = useState(null)

  const handleSearch = useCallback(
    debounce(async (query, itemId) => {
      if (query.length < 1) {
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
          <div className={cn('p-2 rounded-lg', `bg-${theme.colors.primaryLight}`)}>
            <FileText className={cn('h-6 w-6', `text-${theme.colors.primaryText}`)} />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>Cotizaciones</h1>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Gestiona tus cotizaciones comerciales</p>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information Card */}
        <div className={cn('lg:col-span-1 p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
          <h2 className={cn('font-semibold text-lg mb-4 flex items-center gap-2', `text-${theme.colors.text}`)}>
            <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
            Cliente
          </h2>
          <div className="space-y-4">
            <div className="form-group">
              <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Nombre del cliente</label>
              <input
                list="clientes-list"
                className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text} placeholder-${theme.colors.textMuted}`)}
                placeholder="Buscar cliente"
                value={customer.nombre}
                onChange={e => {
                  const nombre = e.target.value
                  const found = clientes.find(c => c.name === nombre)
                  setCustomer(v => ({ ...v, nombre, email: found?.email || v.email }))
                }}
              />
              <datalist id="clientes-list">
                {clientes.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Correo electrónico</label>
              <input
                className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text} placeholder-${theme.colors.textMuted}`)}
                placeholder="Email"
                value={customer.email}
                onChange={e => setCustomer(v => ({ ...v, email: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Metadata and Totals Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <h2 className={cn('font-semibold text-lg mb-4 flex items-center gap-2', `text-${theme.colors.text}`)}>
              <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
              Datos de la cotización
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Fecha</label>
                <input
                  type="date"
                  className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                  value={meta.fecha}
                  onChange={e => setMeta(v => ({ ...v, fecha: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Validez (días)</label>
                <input
                  type="number"
                  className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                  placeholder="Validez (días)"
                  value={meta.validezDias}
                  onChange={e => setMeta(v => ({ ...v, validezDias: Number(e.target.value) }))}
                />
              </div>
              <div className="form-group md:col-span-3">
                <label className={cn('label', `text-${theme.colors.textSecondary}`)}>Notas</label>
                <textarea
                  className={cn('input', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                  style={{ minHeight: '100px' }}
                  placeholder="Notas adicionales"
                  value={meta.notas}
                  onChange={e => setMeta(v => ({ ...v, notas: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Totals Card */}
          <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <h2 className={cn('font-semibold text-lg mb-4 flex items-center gap-2', `text-${theme.colors.text}`)}>
              <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
              Resumen
            </h2>
            <div className="space-y-3">
              <div className={cn('flex justify-between', `text-${theme.colors.textSecondary}`)}>
                <span>Subtotal</span>
                <span className="font-medium">$ {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className={cn('flex justify-between', `text-${theme.colors.textSecondary}`)}>
                <span>IVA (21%)</span>
                <span className="font-medium">$ {totals.iva.toFixed(2)}</span>
              </div>
              <div className={cn('flex justify-between pt-3', `border-t border-${theme.colors.border}`)}>
                <span className={cn('font-semibold', `text-${theme.colors.text}`)}>Total</span>
                <span className={cn('font-bold text-lg', `text-${theme.colors.primaryText}`)}>$ {totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
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
              `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
            )}
          >
            <Plus className="h-4 w-4" />
            Agregar producto
          </button>
        </div>

        <div className="space-y-4">
          {items.map((it, index) => (
            <div key={it.id} className={cn('grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg transition-colors', `bg-${theme.colors.background}/50 hover:bg-${theme.colors.background}`)}>
              <div className="md:col-span-6 relative">
                <label className={cn('text-xs mb-1 block', `text-${theme.colors.textMuted}`)}>Producto</label>
                <div className="relative">
                  <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', `text-${theme.colors.textMuted}`)} />
                  <input
                    autoComplete="off"
                    className={cn('input pl-10', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                    placeholder="Buscar por nombre, SKU, descripción o categoría"
                  value={it.nombre}
                  onChange={e => {
                    const nombre = e.target.value
                    updateItem(it.id, { nombre })
                    handleSearch(nombre, it.id)
                  }}
                  onFocus={() => setActiveSearch(it.id)}
                  onBlur={() => setTimeout(() => setActiveSearch(null), 200)}
                  />
                </div>
                {activeSearch === it.id && it.searchResults && (
                  <div className={cn('absolute z-10 w-full rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
                    {it.searchResults.length > 0 ? (
                      it.searchResults.map(p => (
                        <div
                          key={p.id}
                          onMouseDown={() => {
                            updateItem(it.id, { nombre: p.name, precio: p.price, searchResults: [] })
                            setActiveSearch(null)
                          }}
                          className={cn('px-4 py-2 cursor-pointer', `hover:bg-${theme.colors.background}`)}
                        >
                          <p className={cn('font-semibold', `text-${theme.colors.text}`)}>{p.name}</p>
                          {p.sku && <p className={cn('text-xs', `text-${theme.colors.textMuted}`)}>SKU: {p.sku}</p>}
                          {p.description && <p className={cn('text-sm truncate', `text-${theme.colors.textSecondary}`)}>{p.description}</p>}
                          {p.category_name && <p className={cn('text-xs', `text-${theme.colors.textMuted}`)}>Categoría: {p.category_name}</p>}
                        </div>
                      ))
                    ) : (
                      <div className={cn('px-4 py-3 text-sm', `text-${theme.colors.textMuted}`)}>
                        No se encontraron productos. Prueba con otra palabra o revisa la ortografía.
                      </div>
                    )}
                  </div>
                )}
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
                <div className={cn('font-medium', `text-${theme.colors.text}`)}>$ {((Number(it.cantidad) || 0) * (Number(it.precio) || 0)).toFixed(2)}</div>
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
      </div>

      {/* Action Buttons */}
      <div className={cn('flex flex-col sm:flex-row gap-3 mt-6 pt-5', `border-t border-${theme.colors.border}`)}>
        <button
          onClick={handleGuardar}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
            `bg-${theme.colors.primary} hover:bg-${theme.colors.primaryHover} text-${theme.colors.text}`
          )}
        >
          <Save className="h-4 w-4" />
          Guardar Cotización
        </button>
        <button
          onClick={handlePDF}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
            `bg-${theme.colors.primary} hover:bg-${theme.colors.primaryHover} text-${theme.colors.text}`
          )}
        >
          <Download className="h-4 w-4" />
          Generar PDF
        </button>
        <button
          onClick={() => window.print()}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
            `bg-purple-600 hover:bg-purple-500 text-white`
          )}
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
        <div className={cn('p-5 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
          <h2 className={cn('font-semibold text-lg mb-4 flex items-center gap-2', `text-${theme.colors.text}`)}>
            <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
            Últimas cotizaciones
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
                {cotizaciones.slice(-5).reverse().map(c => (
                  <tr key={c.id} className={cn('transition-colors', `hover:bg-${theme.colors.background}/50`)}>
                    <td className={cn('py-3 text-sm', `text-${theme.colors.textSecondary}`)}>{c.id}</td>
                    <td className={cn('py-3 text-sm', `text-${theme.colors.textSecondary}`)}>{c.cliente?.nombre || '-'}</td>
                    <td className={cn('py-3 text-sm', `text-${theme.colors.textSecondary}`)}>{c.fecha}</td>
                    <td className={cn('py-3 text-sm text-right font-medium', `text-${theme.colors.text}`)}>$ {Number(c.totales?.total || 0).toFixed(2)}</td>
                    <td className="py-3 text-sm text-right">
                      <button
                        onClick={() => {
                          setCustomer({ nombre: c.cliente?.nombre || '', email: c.cliente?.email || '' });
                          setMeta({
                            fecha: c.fecha || new Date().toISOString().slice(0, 10),
                            validezDias: c.validezDias || 15,
                            notas: c.notas || ''
                          });
                          setItems(c.items || [{ id: 1, nombre: '', cantidad: 1, precio: 0 }]);
                          setTimeout(() => window.print(), 100);
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
                          `bg-${theme.colors.surface} hover:bg-${theme.colors.border} text-${theme.colors.text}`
                        )}
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