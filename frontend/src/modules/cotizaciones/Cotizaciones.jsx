import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Plus, Trash2, Download, Save, FileText, Search, Loader2, History, SlidersHorizontal, XCircle } from 'lucide-react'
import { exportSectionsToPDF } from '../../common'
import { useCotizaciones } from '../../hooks/useCotizaciones'
import { useClientes } from '../../hooks/useClientes'
import { searchProducts, getProductoFilters } from '../../services/productos'
import { saveCotizacion } from '../../services/cotizacionesService'
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

const RECENT_SEARCHES_KEY = 'evita-cotizaciones-recent-searches'
const MAX_RECENT_SEARCHES = 8

const createEmptyItem = (id) => ({
  id,
  nombre: '',
  cantidad: 1,
  precio: 0,
  searchResults: [],
  searchStatus: 'idle',
  searchError: null,
  hasMore: false,
  lastQuery: '',
  offset: 0,
  loadingMore: false,
})

export default function Cotizaciones() {
  const { data: cotizaciones = [], addCotizacion } = useCotizaciones()
  const { data: clientes = [] } = useClientes()
  const { theme } = useTheme()

  const [customer, setCustomer] = useState({ nombre: '', email: '' })
  const [meta, setMeta] = useState({ fecha: new Date().toISOString().slice(0,10), validezDias: 15, notas: '' })
  const [items, setItems] = useState([createEmptyItem(1)])
  const itemsRef = useRef(items)
  const [activeSearch, setActiveSearch] = useState(null)
  const [filters, setFilters] = useState({ category: 'all', priceRange: [0, 0], stock: 'all' })
  const [filtersMeta, setFiltersMeta] = useState({ categories: [], priceRange: [0, 0], maxStock: 0 })
  const [filtersLoading, setFiltersLoading] = useState(true)
  const [filtersError, setFiltersError] = useState(null)
  const [filtersReady, setFiltersReady] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [recentQueries, setRecentQueries] = useState([])
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }), [])
  const minAvailablePrice = filtersMeta.priceRange?.[0] ?? 0
  const maxAvailablePrice = filtersMeta.priceRange?.[1] ?? 0
  const maxAvailableStock = filtersMeta.maxStock ?? 0
  const isAnySearchLoading = useMemo(() => items.some(item => item.searchStatus === 'loading'), [items])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setRecentQueries(parsed.filter((entry) => typeof entry === 'string'))
        }
      }
    } catch (error) {
      console.warn('Unable to load recent searches', error)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadFilters() {
      setFiltersLoading(true)
      setFiltersError(null)
      const { data, error } = await getProductoFilters()
      if (!isMounted) return
      if (error) {
        setFiltersError('No se pudieron obtener los filtros disponibles')
        setFiltersReady(true)
      } else if (data) {
        setFiltersMeta(data)
        if (Array.isArray(data.priceRange) && data.priceRange.length === 2) {
          setFilters((prev) => ({
            ...prev,
            priceRange: [data.priceRange[0], data.priceRange[1]]
          }))
        }
        setFiltersReady(true)
      }
      setFiltersLoading(false)
    }
    loadFilters()
    return () => {
      isMounted = false
    }
  }, [])

  const updateRecentQueries = useCallback((query) => {
    const normalized = query?.trim()
    if (!normalized) return
    setRecentQueries((prev) => {
      const next = [normalized, ...prev.filter((entry) => entry !== normalized)].slice(0, MAX_RECENT_SEARCHES)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      } catch (error) {
        console.warn('Unable to persist recent searches', error)
      }
      return next
    })
  }, [])

  const performSearch = useCallback(async (rawQuery, itemId, { append = false } = {}) => {
    const queryValue = rawQuery?.trim() ?? ''

    if (!append) {
      setItems(prev => prev.map(item => {
        if (item.id !== itemId) return item
        if (!queryValue) {
          return {
            ...item,
            searchResults: [],
            searchStatus: 'idle',
            searchError: null,
            hasMore: false,
            lastQuery: '',
            offset: 0,
            loadingMore: false,
          }
        }
        return {
          ...item,
          searchStatus: 'loading',
          searchError: null,
          loadingMore: false,
        }
      }))
    } else {
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, loadingMore: true } : item))
    }

    if (!queryValue) {
      return
    }

    try {
      const currentItem = itemsRef.current.find(item => item.id === itemId)
      const currentOffset = append && currentItem ? currentItem.offset : 0

      const payloadFilters = {
        category: filters.category !== 'all' ? filters.category : null,
        priceRange: filters.priceRange,
        stock: filters.stock,
      }

      const { data, error, hasMore } = await searchProducts({
        query: queryValue,
        limit: 12,
        offset: currentOffset,
        filters: payloadFilters,
      })

      if (error) {
        throw error
      }

      setItems(prev => prev.map(item => {
        if (item.id !== itemId) return item
        const nextResults = append ? [...item.searchResults, ...(data || [])] : (data || [])
        return {
          ...item,
          searchResults: nextResults,
          searchStatus: nextResults.length === 0 ? 'empty' : 'success',
          searchError: null,
          hasMore,
          offset: currentOffset + (data?.length ?? 0),
          lastQuery: queryValue,
          loadingMore: false,
        }
      }))

      if (data?.length) {
        updateRecentQueries(queryValue)
      }
    } catch (error) {
      console.error('Error searching products:', error)
      setItems(prev => prev.map(item => item.id === itemId ? {
        ...item,
        searchStatus: 'error',
        searchError: 'No pudimos obtener los productos. Intenta nuevamente.',
        loadingMore: false,
      } : item))
    }
  }, [filters, updateRecentQueries])

  const debouncedSearch = useMemo(() => debounce((value, itemId) => {
    performSearch(value, itemId)
  }, 300), [performSearch])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleSearchChange = useCallback((value, itemId) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, nombre: value } : item))
    setActiveSearch(itemId)
    debouncedSearch(value, itemId)
  }, [debouncedSearch])

  const handleLoadMore = useCallback((itemId) => {
    const currentItem = itemsRef.current.find(item => item.id === itemId)
    if (!currentItem || !currentItem.hasMore || currentItem.loadingMore || !currentItem.lastQuery) {
      return
    }
    performSearch(currentItem.lastQuery, itemId, { append: true })
  }, [performSearch])

  useEffect(() => {
    if (!filtersReady || !activeSearch) return
    const activeItem = itemsRef.current.find(item => item.id === activeSearch)
    if (!activeItem?.lastQuery) return
    performSearch(activeItem.lastQuery, activeSearch)
  }, [filtersReady, filters, activeSearch, performSearch])

  const handleSelectProduct = useCallback((itemId, product) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const price = Number(product.price ?? 0)
      return {
        ...item,
        nombre: product.name || item.nombre,
        precio: price,
        searchResults: [],
        searchStatus: 'success',
        searchError: null,
        hasMore: false,
        lastQuery: product.name || item.lastQuery,
        offset: 0,
        loadingMore: false,
      }
    }))
    updateRecentQueries(product.name)
    setActiveSearch(null)
  }, [updateRecentQueries])

  const handleRecentQueryClick = useCallback((query, itemId) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, nombre: query } : item))
    setActiveSearch(itemId)
    performSearch(query, itemId)
  }, [performSearch])

  const handlePriceRangeChange = useCallback((index, rawValue) => {
    const numeric = Number(rawValue)
    setFilters(prev => {
      const nextRange = [...prev.priceRange]
      if (Number.isNaN(numeric)) {
        nextRange[index] = index === 0 ? minAvailablePrice : maxAvailablePrice
      } else {
        const clamped = Math.min(Math.max(numeric, minAvailablePrice), maxAvailablePrice)
        nextRange[index] = clamped
      }
      if (nextRange[0] > nextRange[1]) {
        if (index === 0) {
          nextRange[1] = nextRange[0]
        } else {
          nextRange[0] = nextRange[1]
        }
      }
      return { ...prev, priceRange: nextRange }
    })
  }, [minAvailablePrice, maxAvailablePrice])

  const resetFilters = useCallback(() => {
    setFilters({
      category: 'all',
      priceRange: [minAvailablePrice, maxAvailablePrice],
      stock: 'all',
    })
  }, [minAvailablePrice, maxAvailablePrice])

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.cantidad)||0) * (Number(it.precio)||0), 0)
    const iva = +(subtotal * 0.21).toFixed(2)
    const total = +(subtotal + iva).toFixed(2)
    return { subtotal, iva, total }
  }, [items])

  function addItem() {
    setItems(prev => [...prev, createEmptyItem(Date.now())])
  }
  function removeItem(id) {
    setItems(prev => {
      if (prev.length <= 1) return prev
      const filtered = prev.filter(i => i.id !== id)
      if (activeSearch === id) {
        setActiveSearch(null)
      }
      return filtered.length ? filtered : prev
    })
  }
  function updateItem(id, patch) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  async function handleGuardar() {
    try {
      const id = nextCotizacionId()
      const simplifiedItems = items.map(({ id: itemId, nombre, cantidad, precio }) => ({
        id: itemId,
        nombre,
        cantidad,
        precio,
      }))
      
      const payload = {
        id,
        cliente_nombre: customer.nombre,
        cliente_email: customer.email,
        fecha: meta.fecha,
        validez_dias: meta.validezDias,
        notas: meta.notas,
        items: simplifiedItems,
        subtotal: totals.subtotal,
        iva: totals.iva,
        total: totals.total
      }
      
      const { data, error } = await saveCotizacion(payload)
      
      if (error) {
        console.error('Error al guardar cotización:', error)
        alert('Error al guardar la cotización. Por favor, intenta nuevamente.')
        return
      }
      
      // También guardar en el hook local para compatibilidad
      await addCotizacion(payload)
      
      alert(`Cotización ${id} guardada exitosamente`)
      
      // Opcional: limpiar el formulario
      // setCustomer({ nombre: '', email: '' })
      // setItems([createEmptyItem(1)])
      // setMeta({ fecha: new Date().toISOString().slice(0,10), validezDias: 15, notas: '' })
    } catch (err) {
      console.error('Error inesperado:', err)
      alert('Error al guardar la cotización. Por favor, intenta nuevamente.')
    }
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
      </div>

      {/* Main Content Grid - Reestructurado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Client Information Card - Más compacto */}
        <div className={cn('lg:col-span-1 p-3 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
          <h2 className={cn('font-semibold text-base mb-3 flex items-center gap-2', `text-${theme.colors.text}`)}>
            <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
            Cliente
          </h2>
          <div className="space-y-3">
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

        {/* Metadata and Totals Cards - Reestructurado */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata Card - Más compacto */}
          <div className={cn('p-3 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <h2 className={cn('font-semibold text-base mb-3 flex items-center gap-2', `text-${theme.colors.text}`)}>
              <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
              Datos de la cotización
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  style={{ minHeight: '80px' }}
                  placeholder="Notas adicionales"
                  value={meta.notas}
                  onChange={e => setMeta(v => ({ ...v, notas: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className={cn('p-3 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="space-y-1">
            <h2 className={cn('font-semibold text-base flex items-center gap-2', `text-${theme.colors.text}`)}>
              <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
              Productos
            </h2>
            <p className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
              Busca y agrega productos del catálogo en tiempo real mientras ajustas filtros inteligentes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(prev => !prev)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors lg:hidden',
                `border-${theme.colors.border} text-${theme.colors.text} bg-${theme.colors.background}`,
                `hover:border-${theme.colors.primary} hover:text-${theme.colors.primaryText}`
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
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
        </div>

        {isAnySearchLoading && (
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-slate-700/40">
            <div className="h-full w-full origin-left animate-pulse bg-green-500/80"></div>
          </div>
        )}

        {filtersError && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <XCircle className="h-4 w-4" />
            <span>{filtersError}</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className={cn(
              'rounded-xl border px-3 py-3 shadow-sm backdrop-blur-sm transition-all',
              `bg-${theme.colors.background}`,
              `border-${theme.colors.border}`,
              showMobileFilters ? 'block' : 'hidden',
              'lg:block'
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className={cn('text-[10px] font-semibold uppercase tracking-wide', `text-${theme.colors.textSecondary}`)}>
                Filtros avanzados
              </h3>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-semibold text-green-400 transition-colors hover:text-green-300"
              >
                Restablecer
              </button>
            </div>

            {filtersLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 rounded-lg bg-slate-700/40" />
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-700/40" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 rounded-lg bg-slate-700/40" />
                    <div className="h-10 rounded-lg bg-slate-700/40" />
                  </div>
                </div>
                <div className="h-10 rounded-lg bg-slate-700/40" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wide', `text-${theme.colors.textMuted}`)}>
                    Categoría
                  </p>
                  <select
                    value={filters.category}
                    onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className={cn(
                      'w-full rounded-lg border px-2 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2',
                      `bg-${theme.colors.surface}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      `focus-visible:ring-${theme.colors.primary}`
                    )}
                  >
                    <option value="all">Todas las categorías</option>
                    {filtersMeta.categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-[10px] font-semibold uppercase tracking-wide', `text-${theme.colors.textMuted}`)}>
                      Rango de precio
                    </p>
                    <span className={cn('text-[9px] font-medium', `text-${theme.colors.textSecondary}`)}>
                      {currencyFormatter.format(minAvailablePrice)} - {currencyFormatter.format(maxAvailablePrice)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={cn('text-[9px] uppercase tracking-wide', `text-${theme.colors.textMuted}`)}>Mín</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={filters.priceRange[0] ?? ''}
                        min={minAvailablePrice}
                        max={filters.priceRange[1] ?? maxAvailablePrice}
                        onChange={e => handlePriceRangeChange(0, e.target.value)}
                        className={cn(
                          'mt-0.5 w-full rounded-lg border px-2 py-1 text-xs focus:outline-none focus-visible:ring-2',
                          `bg-${theme.colors.surface}`,
                          `border-${theme.colors.border}`,
                          `text-${theme.colors.text}`,
                          `focus-visible:ring-${theme.colors.primary}`
                        )}
                      />
                    </div>
                    <div>
                      <label className={cn('text-[9px] uppercase tracking-wide', `text-${theme.colors.textMuted}`)}>Máx</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={filters.priceRange[1] ?? ''}
                        min={filters.priceRange[0] ?? minAvailablePrice}
                        max={maxAvailablePrice}
                        onChange={e => handlePriceRangeChange(1, e.target.value)}
                        className={cn(
                          'mt-0.5 w-full rounded-lg border px-2 py-1 text-xs focus:outline-none focus-visible:ring-2',
                          `bg-${theme.colors.surface}`,
                          `border-${theme.colors.border}`,
                          `text-${theme.colors.text}`,
                          `focus-visible:ring-${theme.colors.primary}`
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wide', `text-${theme.colors.textMuted}`)}>
                    Estado de stock
                  </p>
                  <select
                    value={filters.stock}
                    onChange={e => setFilters(prev => ({ ...prev, stock: e.target.value }))}
                    className={cn(
                      'w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus-visible:ring-2 transition-colors',
                      `bg-${theme.colors.surface}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      `focus-visible:ring-${theme.colors.primary}`
                    )}
                  >
                    <option value="all">Cualquier estado</option>
                    <option value="available">Disponible (+)</option>
                    <option value="low">Stock bajo (≤5)</option>
                    <option value="out_of_stock">Agotado</option>
                  </select>
                  <p className={cn('text-[9px]', `text-${theme.colors.textSecondary}`)}>
                    Stock máximo registrado: {maxAvailableStock}
                  </p>
                </div>

                {!!recentQueries.length && (
                  <div className="space-y-1.5">
                    <p className={cn('text-[10px] font-semibold uppercase tracking-wide', `text-${theme.colors.textMuted}`)}>
                      Búsquedas recientes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentQueries.map((query) => (
                        <button
                          type="button"
                          key={query}
                          onClick={() => handleRecentQueryClick(query, activeSearch ?? items[0]?.id ?? 1)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                            `bg-${theme.colors.background}`,
                            `text-${theme.colors.textSecondary}`,
                            `hover:text-${theme.colors.text}`,
                            `hover:border-${theme.colors.primary}`,
                            `border border-${theme.colors.border}`
                          )}
                        >
                          <History className="h-3.5 w-3.5" />
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          <div className="space-y-4">
            {items.map((it) => {
              const dropdownScrollHandler = (event) => {
                const target = event.currentTarget
                if (target.scrollHeight - target.scrollTop - target.clientHeight < 48) {
                  handleLoadMore(it.id)
                }
              }
              const queryIsEmpty = !it.nombre?.trim()
              const showRecentSuggestions = queryIsEmpty && recentQueries.length > 0

              return (
                <div
                  key={it.id}
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-12 gap-2 items-start rounded-xl border p-3 transition-colors',
                    `bg-${theme.colors.background}/60 border-${theme.colors.border}`,
                    `hover:border-${theme.colors.primary}`
                  )}
                >
                  <div className="md:col-span-6 relative">
                    <label className={cn('text-[10px] mb-0.5 block', `text-${theme.colors.textMuted}`)}>Producto</label>
                    <div className="relative">
                      <Search
                        className={cn(
                          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4',
                          `text-${theme.colors.textMuted}`
                        )}
                      />
                      <input
                        autoComplete="off"
                        className={cn(
                          'input pl-10 transition-all focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
                          `bg-${theme.colors.surface}`,
                          `border-${theme.colors.border}`,
                          `text-${theme.colors.text}`,
                          `focus-visible:ring-${theme.colors.primary}`
                        )}
                        placeholder="Buscar por nombre, SKU, descripción o categoría"
                        value={it.nombre}
                        onChange={e => handleSearchChange(e.target.value, it.id)}
                        onFocus={() => {
                          setActiveSearch(it.id)
                          if (it.nombre?.trim() && it.searchResults.length === 0) {
                            performSearch(it.nombre, it.id)
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            const currentItem = itemsRef.current.find(item => item.id === it.id)
                            if (currentItem?.searchResults?.length) {
                              handleSelectProduct(it.id, currentItem.searchResults[0])
                            }
                          }
                          if (event.key === 'Escape') {
                            setActiveSearch(null)
                          }
                        }}
                        onBlur={() => setTimeout(() => setActiveSearch(prev => (prev === it.id ? null : prev)), 200)}
                      />
                    </div>

                    {activeSearch === it.id && (
                      <div
                        className={cn(
                          'absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-sm',
                          `bg-${theme.colors.surface}`,
                          `border-${theme.colors.border}`
                        )}
                      >
                        <div className={cn('flex items-center justify-between gap-2 px-4 py-2 text-xs uppercase tracking-wide', `border-b border-${theme.colors.border}`)}>
                          <span className={cn('font-semibold', `text-${theme.colors.textSecondary}`)}>Sugerencias</span>
                          {(it.searchStatus === 'loading' || it.loadingMore) && (
                            <Loader2 className={cn('h-4 w-4 animate-spin', `text-${theme.colors.primary}`)} />
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto" onScroll={dropdownScrollHandler}>
                          {it.searchStatus === 'error' && (
                            <div className="flex items-start gap-3 px-4 py-4 text-sm text-red-300">
                              <XCircle className="mt-0.5 h-4 w-4" />
                              <div>
                                <p className="font-semibold">Hubo un problema</p>
                                <p>Intenta nuevamente o ajusta los filtros aplicados.</p>
                              </div>
                            </div>
                          )}

                          {it.searchStatus === 'loading' && (
                            <div className="space-y-3 px-4 py-4">
                              {[1, 2, 3].map((skeleton) => (
                                <div key={skeleton} className="animate-pulse space-y-2 rounded-lg bg-slate-700/30 p-3">
                                  <div className="h-3 w-3/4 rounded bg-slate-600/40" />
                                  <div className="h-3 w-1/2 rounded bg-slate-600/30" />
                                </div>
                              ))}
                            </div>
                          )}

                          {it.searchStatus === 'empty' && (
                            <div className="px-4 py-5 text-sm">
                              <p className={cn('font-medium', `text-${theme.colors.text}`)}>No encontramos coincidencias</p>
                              <p className={cn('mt-1 text-xs', `text-${theme.colors.textSecondary}`)}>
                                Ajusta tus filtros o prueba con otro término de búsqueda.
                              </p>
                            </div>
                          )}

                          {showRecentSuggestions && it.searchStatus !== 'loading' && (
                            <div className="px-4 py-4">
                              <p className={cn('text-xs font-semibold uppercase tracking-wide mb-3', `text-${theme.colors.textMuted}`)}>Búsquedas recientes</p>
                              <div className="flex flex-wrap gap-2">
                                {recentQueries.map((query) => (
                                  <button
                                    type="button"
                                    key={query}
                                    onMouseDown={() => handleRecentQueryClick(query, it.id)}
                                    className={cn(
                                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                                      `bg-${theme.colors.background}`,
                                      `text-${theme.colors.textSecondary}`,
                                      `hover:text-${theme.colors.text}`,
                                      `hover:border-${theme.colors.primary}`,
                                      `border border-${theme.colors.border}`
                                    )}
                                  >
                                    <History className="h-3.5 w-3.5" />
                                    {query}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {it.searchResults.length > 0 && (
                            <div className="space-y-2 px-4 py-3">
                              {it.searchResults.map((product) => {
                                const stockBadge = (() => {
                                  const stock = Number(product.stock ?? 0)
                                  if (stock <= 0) return 'bg-red-500/20 text-red-400'
                                  if (stock <= 5) return 'bg-orange-500/20 text-orange-400'
                                  return 'bg-emerald-500/20 text-emerald-400'
                                })()
                                return (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onMouseDown={() => handleSelectProduct(it.id, product)}
                                    className={cn(
                                      'group w-full rounded-lg border px-4 py-3 text-left transition-all hover:-translate-y-0.5',
                                      `bg-${theme.colors.surface}`,
                                      `border-${theme.colors.border}`,
                                      `hover:border-${theme.colors.primary}`,
                                      `hover:shadow-lg`
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-1">
                                        <p className={cn('font-semibold leading-tight', `text-${theme.colors.text}`)}>{product.name}</p>
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                          {product.category_name && (
                                            <span className={cn('rounded-full bg-slate-700/40 px-2 py-0.5', `text-${theme.colors.textSecondary}`)}>
                                              {product.category_name}
                                            </span>
                                          )}
                                          {product.sku && (
                                            <span className={cn('rounded-full bg-slate-700/40 px-2 py-0.5 font-mono', `text-${theme.colors.textSecondary}`)}>
                                              SKU {product.sku}
                                            </span>
                                          )}
                                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', stockBadge)}>
                                            {Number(product.stock ?? 0) <= 0 ? 'Sin stock' : `${product.stock} en stock`}
                                          </span>
                                        </div>
                                        {product.description && (
                                          <p
                                            className={cn('text-xs overflow-hidden text-ellipsis', `text-${theme.colors.textSecondary}`)}
                                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                                          >
                                            {product.description}
                                          </p>
                                        )}
                                        {product.supplier_name && (
                                          <p className={cn('text-[11px] uppercase tracking-wide', `text-${theme.colors.textMuted}`)}>
                                            Proveedor: {product.supplier_name}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-emerald-300">
                                          {currencyFormatter.format(product.price || 0)}
                                        </p>
                                        {product.cost ? (
                                          <p className={cn('text-[11px]', `text-${theme.colors.textMuted}`)}>
                                            Costo base {currencyFormatter.format(product.cost)}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {it.loadingMore && (
                            <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-slate-300">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Cargando más resultados…
                            </div>
                          )}
                        </div>

                        {it.hasMore && !it.loadingMore && (
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              handleLoadMore(it.id)
                            }}
                            className={cn(
                              'flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors',
                              `text-${theme.colors.primaryText}`,
                              `hover:bg-${theme.colors.primaryLight}`
                            )}
                          >
                            Ver más resultados
                          </button>
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
                    <div className={cn('text-sm font-semibold', `text-${theme.colors.text}`)}>
                      {currencyFormatter.format(((Number(it.cantidad) || 0) * (Number(it.precio) || 0))) }
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end items-start md:items-center md:mt-7">
                    <button
                      onClick={() => removeItem(it.id)}
                      className={cn(
                        'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors',
                        `border-${theme.colors.border}`,
                        `text-${theme.colors.textSecondary}`,
                        `hover:text-red-400 hover:border-red-500`
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Resumen de Totales - Movido al final */}
      <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h2 className={cn('font-semibold text-lg mb-3 flex items-center gap-2', `text-${theme.colors.text}`)}>
              <div className={cn('w-2 h-2 rounded-full', `bg-${theme.colors.primary}`)}></div>
              Resumen
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGuardar}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2',
                `bg-slate-800 text-white hover:bg-slate-700 focus:ring-green-500`
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Subtotal</p>
            <p className="font-medium text-lg">$ {totals.subtotal.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>IVA (21%)</p>
            <p className="font-medium text-lg">$ {totals.iva.toFixed(2)}</p>
          </div>
          <div className="text-center border-t pt-3 md:border-t-0 md:pt-0 md:border-l border-slate-700">
            <p className={cn('text-sm font-semibold', `text-${theme.colors.text}`)}>Total</p>
            <p className={cn('font-bold text-xl', `text-${theme.colors.primaryText}`)}>$ {totals.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

