import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Plus, Trash2, Download, Save, FileText, Search, Calendar, User, Mail, FileCheck, AlertCircle, CheckCircle, Loader2, X, Package, DollarSign } from 'lucide-react'
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

export default function FacturadorOptimized() {
  const { data: facturas = [], addFactura } = useFacturas()
  const { data: clientes = [] } = useClientes()
  const { data: productos = [] } = useProductos()
  const { data: cotizaciones = [] } = useCotizaciones()
  const { theme } = useTheme()
  
  // Estados principales
  const [selectedCotId, setSelectedCotId] = useState('')
  const [customer, setCustomer] = useState({ nombre: '', email: '' })
  const [meta, setMeta] = useState({
    fecha: new Date().toISOString().slice(0,10),
    vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10),
    notas: ''
  })
  const [items, setItems] = useState([{ id: 1, nombre: '', cantidad: 1, precio: 0 }])
  
  // Estados para UX mejorada
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredClientes, setFilteredClientes] = useState([])
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Funciones mejoradas para UX
  const showNotification = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    } else {
      setErrorMessage(message)
      setShowError(true)
      setTimeout(() => setShowError(false), 4000)
    }
  }, [])

  const filterClientes = useCallback((query) => {
    if (!query.trim()) {
      setFilteredClientes([])
      return
    }
    const filtered = clientes.filter(cliente => 
      cliente.name.toLowerCase().includes(query.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredClientes(filtered.slice(0, 5))
  }, [clientes])

  useEffect(() => {
    filterClientes(searchQuery)
  }, [searchQuery, filterClientes])

  const importFromCotizacion = useCallback(async (id) => {
    setIsImporting(true)
    try {
      const c = cotizaciones.find(x => x.id === id)
      if (!c) {
        showNotification('Cotización no encontrada', 'error')
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
      showNotification(`Cotización ${id} importada exitosamente`)
    } catch (error) {
      showNotification('Error al importar cotización', 'error')
    } finally {
      setIsImporting(false)
    }
  }, [cotizaciones, showNotification])

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
    if (selectedCotId) {
      const yaExiste = facturas.some(f => f.cotizacionId === selectedCotId)
      if (yaExiste) {
        showNotification(`Esta cotización (${selectedCotId}) ya fue facturada`, 'error')
        return
      }
    }

    setIsSaving(true)
    try {
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
        cotizacionId: selectedCotId
      }
      
      await addFactura(payload)
      showNotification(`Factura ${id} guardada exitosamente`)
    } catch (error) {
      showNotification('Error al guardar la factura', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePDF() {
    setIsGeneratingPDF(true)
    try {
      const id = nextFacturaId()
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
        brand: 'EVITA',
        subtitle: 'Factura de venta'
      })
      showNotification(`PDF de factura ${id} generado exitosamente`)
    } catch (error) {
      showNotification('Error al generar PDF', 'error')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Notificaciones */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
            <button onClick={() => setShowSuccess(false)} className="ml-2 hover:bg-green-700 rounded p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {showError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
            <button onClick={() => setShowError(false)} className="ml-2 hover:bg-red-700 rounded p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Mejorado */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Facturador</h1>
                <p className="text-slate-300">Genera facturas profesionales para tus clientes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGuardar}
                disabled={isSaving}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800',
                  isSaving 
                    ? 'bg-slate-600 text-slate-300 cursor-not-allowed' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500'
                )}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handlePDF}
                disabled={isGeneratingPDF}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800',
                  isGeneratingPDF 
                    ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white focus:ring-emerald-500'
                )}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGeneratingPDF ? 'Generando...' : 'Generar PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Izquierdo - Información */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Importar desde Cotización */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileCheck className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Importar desde Cotización</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Buscar por ID de cotización
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="COT-000001"
                      className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedCotId}
                      onChange={(e) => setSelectedCotId(e.target.value)}
                    />
                    <button
                      onClick={() => importFromCotizacion(selectedCotId)}
                      disabled={isImporting || !selectedCotId}
                      className={cn(
                        'px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800',
                        isImporting || !selectedCotId
                          ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                      )}
                    >
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <User className="h-5 w-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Información del Cliente</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre del Cliente
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nombre del cliente"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={customer.nombre}
                      onChange={(e) => {
                        setCustomer(prev => ({ ...prev, nombre: e.target.value }))
                        setSearchQuery(e.target.value)
                        setShowClientDropdown(true)
                      }}
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                  
                  {/* Dropdown de clientes */}
                  {showClientDropdown && filteredClientes.length > 0 && (
                    <div className="mt-2 bg-slate-700 rounded-lg border border-slate-600 shadow-lg">
                      {filteredClientes.map((cliente) => (
                        <button
                          key={cliente.id}
                          onClick={() => {
                            setCustomer({ nombre: cliente.name, email: cliente.email || '' })
                            setSearchQuery('')
                            setShowClientDropdown(false)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-600 text-white border-b border-slate-600 last:border-b-0"
                        >
                          <div className="font-medium">{cliente.name}</div>
                          {cliente.email && (
                            <div className="text-sm text-slate-400">{cliente.email}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="email@ejemplo.com"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={customer.email}
                      onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la Factura */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Información de la Factura</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={meta.fecha}
                        onChange={(e) => setMeta(prev => ({ ...prev, fecha: e.target.value }))}
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Vencimiento
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={meta.vencimiento}
                        onChange={(e) => setMeta(prev => ({ ...prev, vencimiento: e.target.value }))}
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    placeholder="Notas adicionales"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    value={meta.notas}
                    onChange={(e) => setMeta(prev => ({ ...prev, notas: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Productos */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Package className="h-5 w-5 text-orange-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Productos</h2>
                </div>
                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </button>
              </div>

              {/* Tabla de Productos */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-6">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Producto
                        </label>
                        <input
                          type="text"
                          placeholder="Nombre del producto"
                          className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          value={item.nombre}
                          onChange={(e) => updateItem(item.id, { nombre: e.target.value })}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          value={item.cantidad}
                          onChange={(e) => updateItem(item.id, { cantidad: Number(e.target.value) })}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Precio
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          value={item.precio}
                          onChange={(e) => updateItem(item.id, { precio: Number(e.target.value) })}
                        />
                      </div>
                      
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Total
                        </label>
                        <div className="text-sm font-semibold text-white">
                          $ {((Number(item.cantidad) || 0) * (Number(item.precio) || 0)).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de Totales */}
              <div className="mt-6 pt-6 border-t border-slate-600">
                <div className="flex justify-end">
                  <div className="bg-slate-700/50 rounded-lg p-6 min-w-[300px]">
                    <div className="space-y-3">
                      <div className="flex justify-between text-slate-300">
                        <span>Subtotal:</span>
                        <span className="font-medium">$ {totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>IVA (21%):</span>
                        <span className="font-medium">$ {totals.iva.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-600 pt-3">
                        <div className="flex justify-between text-lg font-bold text-white">
                          <span>Total:</span>
                          <span className="text-emerald-400">$ {totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
