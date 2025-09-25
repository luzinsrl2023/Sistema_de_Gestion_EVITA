import React, { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// Function to get suppliers from localStorage
function getSuppliers() {
  try {
    const raw = localStorage.getItem('evita-suppliers')
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) return arr
    }
  } catch (_) {}
  return []
}

const categories = [
  'Limpieza',
  'Artículos Generales',
  'Electricidad',
  'Herramientas',
  'Equipos de Seguridad'
]

export default function ProductoForm({ onClose, onSubmit, product }) {
  const { user } = useAuth()
  const isDemoMode = user?.demo === true

  // Get suppliers for the select dropdown
  const suppliers = getSuppliers()

  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'Limpieza',
    sku: product?.sku || '',
    stock: product?.stock || 0,
    minStock: product?.minStock || 10,
    price: product?.price || 0,
    cost: product?.cost || 0,
    description: product?.description || '',
    supplier: product?.supplier || '' // Add supplier field
  })

  const [margin, setMargin] = useState(() => {
    if (product?.price > 0) {
      return ((product.price - product.cost) / product.price * 100)
    }
    return 0
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const numValue = parseFloat(value) || 0
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'minStock' || name === 'price' || name === 'cost' 
        ? numValue 
        : value
    }))
    
    // Update margin when price or cost changes
    if (name === 'price' || name === 'cost') {
      const updatedData = { ...formData, [name]: numValue }
      if (updatedData.price > 0) {
        const newMargin = ((updatedData.price - updatedData.cost) / updatedData.price * 100)
        setMargin(isNaN(newMargin) ? 0 : newMargin)
      }
    }
  }

  const handleMarginChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setMargin(value)
    
    // Update price based on cost and margin
    if (formData.cost > 0 && value >= 0) {
      const newPrice = formData.cost / (1 - (value / 100))
      setFormData(prev => ({ ...prev, price: isNaN(newPrice) ? 0 : newPrice }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isDemoMode) {
      alert('Acción no permitida en modo demo.')
      return
    }
    onSubmit({
      ...formData,
      id: product?.id || `EVT${Date.now().toString().slice(-6)}`,
      status: product?.status || 'activo'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {isDemoMode && (
            <div className="p-3 mb-4 text-sm text-yellow-300 bg-yellow-900/30 rounded-lg" role="alert">
              <span className="font-medium">Modo Demo:</span> Las funciones de guardado están deshabilitadas.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej. Limpiador Multiuso EVITA Pro"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Proveedor
              </label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccione un proveedor</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id || supplier.name} value={supplier.name}>{supplier.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej. LMP-EVT-001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Stock Actual
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Stock Mínimo
              </label>
              <input
                type="number"
                name="minStock"
                min="0"
                value={formData.minStock}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Costo ($)
              </label>
              <input
                type="number"
                name="cost"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Margen (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={margin}
                onChange={handleMarginChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Precio de Venta ($)
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Información adicional sobre el producto"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDemoMode}
              className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
                isDemoMode
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {product ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
