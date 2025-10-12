import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { exportPurchaseOrderPDF } from '../../common'
import { 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  FileText, 
  Calendar, 
  Building2, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X,
  ShoppingCart,
  DollarSign,
  Clock
} from 'lucide-react'

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
  const m = t.match(/(\d+)\s*días/)
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
    'TecnoGlobal S.A.': '30 días',
    'Soluciones de Oficina Ltda.': '15 días',
    'Componentes & Cia.': '60 días',
    'Distribuidora Norte': 'Contado'
  }
  return parseDaysFromTerms(fallback[name] || '30 días')
}

function addDays(dateStr, days) {
  if (!dateStr) return ''
  const dt = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(dt.getTime())) return ''
  dt.setDate(dt.getDate() + Number(days || 0))
  return dt.toISOString().slice(0,10)
}

export default function OrdenFormOptimized() {
  const { user } = useAuth()
  
  // Estados principales
  const [orderId] = useState(nextOrderId())
  const [supplier, setSupplier] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10))
  const [vencimiento, setVencimiento] = useState(addDays(new Date().toISOString().slice(0,10), 30))
  const [items, setItems] = useState([{ id: 1, producto: '', cantidad: 1, precio: 0 }])
  
  // Estados para UX mejorada
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(true)

  // Funciones para UX mejorada
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

  // Cálculo de totales
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.cantidad) || 0) * (Number(item.precio) || 0), 0)
    const iva = +(subtotal * 0.21).toFixed(2)
    const total = +(subtotal + iva).toFixed(2)
    return { subtotal, iva, total }
  }, [items])

  // Funciones de manejo de items
  const addItem = useCallback(() => {
    setItems(prev => [...prev, { 
      id: Date.now(), 
      producto: '', 
      cantidad: 1, 
      precio: 0 
    }])
  }, [])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev)
  }, [])

  const updateItem = useCallback((id, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }, [])

  // Manejar cambio de proveedor
  const handleSupplierChange = useCallback((value) => {
    setSupplier(value)
    const days = getSupplierTermsDays(value)
    setVencimiento(addDays(fecha, days))
  }, [fecha])

  // Funciones de guardado y PDF
  const handleSave = useCallback(async () => {
    if (isDemoMode) {
      showNotification('Modo Demo: Las funciones de guardado están deshabilitadas', 'error')
      return
    }

    setIsSaving(true)
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      showNotification(`Orden ${orderId} guardada exitosamente`)
    } catch (error) {
      showNotification('Error al guardar la orden', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [isDemoMode, orderId, showNotification])

  const handlePDF = useCallback(async () => {
    setIsGeneratingPDF(true)
    try {
      await exportPurchaseOrderPDF({
        orderId,
        supplier,
        fecha,
        vencimiento,
        items,
        totals
      })
      showNotification(`PDF de orden ${orderId} generado exitosamente`)
    } catch (error) {
      showNotification('Error al generar PDF', 'error')
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [orderId, supplier, fecha, vencimiento, items, totals, showNotification])

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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner Demo Mode */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Modo Demo: Las funciones de guardado están deshabilitadas</span>
          </div>
        )}

        {/* Header Mejorado */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Nueva Orden de Compra</h1>
                <p className="text-slate-300">Crea una nueva orden de compra para tus proveedores</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving || isDemoMode}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 facturador-button',
                  isSaving || isDemoMode
                    ? 'bg-slate-600 text-slate-300 cursor-not-allowed' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500'
                )}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar Orden'}
              </button>
              <button
                onClick={handlePDF}
                disabled={isGeneratingPDF}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 facturador-button',
                  isGeneratingPDF 
                    ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white focus:ring-blue-500'
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
          
          {/* Panel Izquierdo - Información de la Orden */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Detalles de la Orden */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Detalles de la Orden</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ID de Orden
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    readOnly
                    className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-4 py-3 text-white cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Proveedor
                  </label>
                  <div className="relative">
                    <select
                      value={supplier}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent facturador-input"
                    >
                      <option value="">Seleccionar proveedor</option>
                      <option value="TecnoGlobal S.A.">TecnoGlobal S.A.</option>
                      <option value="Soluciones de Oficina Ltda.">Soluciones de Oficina Ltda.</option>
                      <option value="Componentes & Cia.">Componentes & Cia.</option>
                      <option value="Distribuidora Norte">Distribuidora Norte</option>
                    </select>
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Fechas</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent facturador-input"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent facturador-input"
                      value={vencimiento}
                      onChange={(e) => setVencimiento(e.target.value)}
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Productos */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Package className="h-5 w-5 text-orange-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Productos</h2>
                </div>
                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium transition-all duration-200 facturador-button"
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
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Producto
                        </label>
                        <select
                          className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm facturador-input"
                          value={item.producto}
                          onChange={(e) => updateItem(item.id, 'producto', e.target.value)}
                        >
                          <option value="">Seleccionar producto</option>
                          <option value="Limpiador Multiuso EVITA Pro">Limpiador Multiuso EVITA Pro</option>
                          <option value="Detergente Concentrado">Detergente Concentrado</option>
                          <option value="Desinfectante de Superficies">Desinfectante de Superficies</option>
                          <option value="Papel Higiénico Industrial">Papel Higiénico Industrial</option>
                          <option value="Toallas de Papel">Toallas de Papel</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm facturador-input"
                          value={item.cantidad}
                          onChange={(e) => updateItem(item.id, 'cantidad', Number(e.target.value))}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Precio
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm facturador-input"
                          value={item.precio}
                          onChange={(e) => updateItem(item.id, 'precio', Number(e.target.value))}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
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
                          <span className="text-blue-400">$ {totals.total.toFixed(2)}</span>
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
    </div>
  )
}

