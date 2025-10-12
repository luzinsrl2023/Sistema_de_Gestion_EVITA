import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  ChevronDown,
  X,
  Import,
  Download,
  FileSpreadsheet,
  FileText,
  Loader,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  Users,
  Package,
  TrendingUp
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../../lib/utils'
import { DataTable, exportToExcel, exportTableToPDF } from '../../common'
import * as XLSX from 'xlsx'
import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from '../../services/proveedores'
import { updateProductosPorProveedor } from '../../services/productos'

const paymentTermsOptions = ['15 días', '20 días', '30 días', '60 días', '90 días', 'Contado']
const paymentMethods = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Cheque']

export default function ProveedoresListOptimized() {
  const [suppliers, setSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showEditSupplier, setShowEditSupplier] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [selectedSuppliers, setSelectedSuppliers] = useState([])
  
  // Estados para UX mejorada
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Estados para actualización de precios
  const [showMarginUpdate, setShowMarginUpdate] = useState(false)
  const [selectedSupplierForMargin, setSelectedSupplierForMargin] = useState('')
  const [marginPercentage, setMarginPercentage] = useState(0)
  const [isUpdatingMargin, setIsUpdatingMargin] = useState(false)

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '30 días',
    paymentMethod: 'Efectivo',
    notes: '',
    margin: 0
  })

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

  // Cargar proveedores
  const loadSuppliers = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getProveedores()
      if (error) throw error
      setSuppliers(data || [])
      setFilteredSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
      showNotification('Error al cargar los proveedores', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  // Filtrar proveedores
  const filteredData = useMemo(() => {
    let filtered = suppliers

    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === statusFilter)
    }

    return filtered
  }, [suppliers, searchTerm, statusFilter])

  // Estadísticas
  const stats = useMemo(() => {
    const total = suppliers.length
    const active = suppliers.filter(s => s.status === 'activo').length
    const totalOrders = suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0)
    const totalValue = suppliers.reduce((sum, s) => sum + (s.totalValue || 0), 0)
    
    return { total, active, totalOrders, totalValue }
  }, [suppliers])

  // Funciones de manejo
  const handleAddSupplier = useCallback(async () => {
    if (!newSupplier.name.trim()) {
      showNotification('El nombre del proveedor es requerido', 'error')
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await createProveedor(newSupplier)
      if (error) throw error
      
      setSuppliers(prev => [...prev, data])
      setNewSupplier({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        paymentTerms: '30 días',
        paymentMethod: 'Efectivo',
        notes: '',
        margin: 0
      })
      setShowAddSupplier(false)
      showNotification(`Proveedor ${data.name} creado exitosamente`)
    } catch (error) {
      showNotification('Error al crear el proveedor', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [newSupplier, showNotification])

  const handleDeleteSupplier = useCallback(async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) return

    setIsDeleting(true)
    try {
      const { error } = await deleteProveedor(id)
      if (error) throw error
      
      setSuppliers(prev => prev.filter(s => s.id !== id))
      showNotification('Proveedor eliminado exitosamente')
    } catch (error) {
      showNotification('Error al eliminar el proveedor', 'error')
    } finally {
      setIsDeleting(false)
    }
  }, [showNotification])

  const handleUpdateSupplierMargin = useCallback(async () => {
    if (!selectedSupplierForMargin || marginPercentage <= 0) {
      showNotification('Por favor seleccione un proveedor y un porcentaje válido', 'error')
      return
    }

    setIsUpdatingMargin(true)
    try {
      const { data, updated, error } = await updateProductosPorProveedor(selectedSupplierForMargin, marginPercentage)
      if (error) throw error

      if (!updated) {
        showNotification('No se encontraron productos asociados a este proveedor', 'error')
      } else {
        const supplierName = suppliers.find((s) => s.id === selectedSupplierForMargin)?.name || 'el proveedor'
        showNotification(`Se actualizaron los precios de ${updated} productos de ${supplierName} aplicando un aumento del ${marginPercentage}%`)
      }

      setSelectedSupplierForMargin('')
      setMarginPercentage(0)
      setShowMarginUpdate(false)
    } catch (error) {
      showNotification('Error al actualizar precios', 'error')
    } finally {
      setIsUpdatingMargin(false)
    }
  }, [selectedSupplierForMargin, marginPercentage, suppliers, showNotification])

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
        {/* Header Mejorado */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Gestión de Proveedores</h1>
                <p className="text-slate-300">Administra tu red de proveedores y sus condiciones comerciales</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMarginUpdate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all duration-200 facturador-button"
              >
                <TrendingUp className="h-4 w-4" />
                Actualizar Precios por Proveedor
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200 facturador-button"
              >
                <Import className="h-4 w-4" />
                Importar Excel
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200 facturador-button"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </button>
              <button
                onClick={() => setShowAddSupplier(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all duration-200 facturador-button"
              >
                <Plus className="h-4 w-4" />
                Nuevo Proveedor
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Proveedores</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Activos</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Package className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Órdenes Totales</p>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Valor Total</p>
                <p className="text-2xl font-bold text-white">$ {stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar proveedor por nombre o ID"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent facturador-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="lg:w-64">
              <select
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent facturador-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Proveedores */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <span className="ml-3 text-white">Cargando proveedores...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No se encontraron proveedores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">PROVEEDOR</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">CONTACTO</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">TÉRMINOS</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">MÉTODO</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">ÓRDENES</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">TOTAL</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">ESTADO</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-white">{supplier.name}</div>
                          {supplier.address && (
                            <div className="text-sm text-slate-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {supplier.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          {supplier.contactName && (
                            <div className="text-white">{supplier.contactName}</div>
                          )}
                          {supplier.email && (
                            <div className="text-sm text-slate-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="text-sm text-slate-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{supplier.paymentTerms}</td>
                      <td className="py-4 px-4 text-slate-300">{supplier.paymentMethod}</td>
                      <td className="py-4 px-4 text-slate-300">{supplier.totalOrders || 0}</td>
                      <td className="py-4 px-4 text-slate-300">$ {formatCurrency(supplier.totalValue || 0)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          supplier.status === 'activo' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {supplier.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSupplier(supplier)
                              setShowEditSupplier(true)
                            }}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            disabled={isDeleting}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Actualizar Precios */}
        {showMarginUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Actualizar Precios por Proveedor</h2>
                <button
                  onClick={() => setShowMarginUpdate(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Seleccionar Proveedor
                  </label>
                  <select
                    value={selectedSupplierForMargin}
                    onChange={(e) => setSelectedSupplierForMargin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccione un proveedor</option>
                    {suppliers.filter(s => s.status === 'activo').map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Porcentaje de Aumento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={marginPercentage}
                    onChange={(e) => setMarginPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ingrese el porcentaje de aumento"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMarginUpdate(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateSupplierMargin}
                    disabled={isUpdatingMargin}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isUpdatingMargin
                        ? 'bg-yellow-500/80 text-white cursor-not-allowed'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    {isUpdatingMargin ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Aplicar Aumento'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

