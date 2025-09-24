import React, { useState, useEffect } from 'react'
import { X, Package, DollarSign, Hash, FileText } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

export default function ProductoForm({ producto, proveedores, onSave, onClose }) {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    proveedor_id: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        stock: producto.stock || '',
        proveedor_id: producto.proveedor_id || ''
      })
    }
  }, [producto])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del producto es requerido'
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
    }

    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock debe ser un número positivo o cero'
    }

    if (!formData.proveedor_id) {
      newErrors.proveedor_id = 'Selecciona un proveedor'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      const dataToSave = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        proveedor_id: formData.proveedor_id
      }

      await onSave(dataToSave)
    } catch (error) {
      console.error('Error saving producto:', error)
      alert('Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={cn(
        "border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
        `bg-${theme.colors.surface}`,
        `border-${theme.colors.border}`
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <h2 className={cn("text-xl font-bold", `text-${theme.colors.text}`)}>
              {producto ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              `text-${theme.colors.textSecondary}`,
              `hover:text-${theme.colors.text}`,
              `hover:bg-${theme.colors.background}`
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
              Nombre del Producto *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                  `bg-${theme.colors.background}`,
                  `border-${errors.nombre ? 'red-500' : theme.colors.border}`,
                  `text-${theme.colors.text}`,
                  `focus:ring-${theme.colors.primary}`
                )}
                placeholder="Ej. Limpiador Multiuso EVITA Pro"
              />
            </div>
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-400">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
              Descripción
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none",
                  `bg-${theme.colors.background}`,
                  `border-${theme.colors.border}`,
                  `text-${theme.colors.text}`,
                  `focus:ring-${theme.colors.primary}`
                )}
                placeholder="Descripción detallada del producto..."
              />
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
              Precio *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                  `bg-${theme.colors.background}`,
                  `border-${errors.precio ? 'red-500' : theme.colors.border}`,
                  `text-${theme.colors.text}`,
                  `focus:ring-${theme.colors.primary}`
                )}
                placeholder="0.00"
              />
            </div>
            {errors.precio && (
              <p className="mt-1 text-sm text-red-400">{errors.precio}</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
              Stock Inicial *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                  `bg-${theme.colors.background}`,
                  `border-${errors.stock ? 'red-500' : theme.colors.border}`,
                  `text-${theme.colors.text}`,
                  `focus:ring-${theme.colors.primary}`
                )}
                placeholder="0"
              />
            </div>
            {errors.stock && (
              <p className="mt-1 text-sm text-red-400">{errors.stock}</p>
            )}
          </div>

          {/* Proveedor */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
              Proveedor *
            </label>
            <select
              name="proveedor_id"
              value={formData.proveedor_id}
              onChange={handleChange}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                `bg-${theme.colors.background}`,
                `border-${errors.proveedor_id ? 'red-500' : theme.colors.border}`,
                `text-${theme.colors.text}`,
                `focus:ring-${theme.colors.primary}`
              )}
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
            {errors.proveedor_id && (
              <p className="mt-1 text-sm text-red-400">{errors.proveedor_id}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                `bg-${theme.colors.background}`,
                `text-${theme.colors.textSecondary}`,
                `hover:bg-gray-600`
              )}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                `bg-${theme.colors.primary}`,
                `hover:bg-${theme.colors.primaryHover}`,
                "text-white"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </div>
              ) : (
                producto ? 'Actualizar Producto' : 'Crear Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}