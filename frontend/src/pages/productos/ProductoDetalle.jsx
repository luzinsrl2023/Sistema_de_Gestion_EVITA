import React from 'react'
import { X, Package, DollarSign, Hash, FileText, User, Calendar, Edit } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { formatCurrency, formatDate, cn } from '../../lib/utils'

export default function ProductoDetalle({ producto, onClose, onEdit }) {
  const { theme } = useTheme()

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { label: 'Agotado', color: 'bg-red-500/20 text-red-400' }
    } else if (stock <= 5) {
      return { label: 'Stock Crítico', color: 'bg-red-500/20 text-red-400' }
    } else if (stock <= 10) {
      return { label: 'Stock Bajo', color: 'bg-yellow-500/20 text-yellow-400' }
    } else {
      return { label: 'Disponible', color: 'bg-green-500/20 text-green-400' }
    }
  }

  const stockStatus = getStockStatus(producto.stock)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={cn(
        "border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto",
        `bg-${theme.colors.surface}`,
        `border-${theme.colors.border}`
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className={cn("text-xl font-bold", `text-${theme.colors.text}`)}>
                Detalles del Producto
              </h2>
              <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                Información completa del producto
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors",
                `bg-${theme.colors.primary}`,
                `hover:bg-${theme.colors.primaryHover}`,
                "text-white"
              )}
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
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
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className={cn("border rounded-xl p-6", `bg-${theme.colors.background}`, `border-${theme.colors.border}`)}>
            <h3 className={cn("text-lg font-semibold mb-4", `text-${theme.colors.text}`)}>
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <label className={cn("text-sm font-medium", `text-${theme.colors.textSecondary}`)}>
                    Nombre del Producto
                  </label>
                </div>
                <p className={cn("text-lg font-semibold", `text-${theme.colors.text}`)}>
                  {producto.nombre}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <label className={cn("text-sm font-medium", `text-${theme.colors.textSecondary}`)}>
                    Proveedor
                  </label>
                </div>
                <p className={cn("text-lg", `text-${theme.colors.text}`)}>
                  {producto.proveedores?.nombre || 'Sin proveedor asignado'}
                </p>
                {producto.proveedores?.email && (
                  <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                    {producto.proveedores.email}
                  </p>
                )}
              </div>
            </div>

            {producto.descripcion && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <label className={cn("text-sm font-medium", `text-${theme.colors.textSecondary}`)}>
                    Descripción
                  </label>
                </div>
                <p className={cn("text-base leading-relaxed", `text-${theme.colors.text}`)}>
                  {producto.descripcion}
                </p>
              </div>
            )}
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Precio */}
            <div className={cn("border rounded-xl p-6", `bg-${theme.colors.background}`, `border-${theme.colors.border}`)}>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <h3 className={cn("text-lg font-semibold", `text-${theme.colors.text}`)}>
                  Precio
                </h3>
              </div>
              <p className={cn("text-3xl font-bold text-green-400")}>
                {formatCurrency(producto.precio)}
              </p>
            </div>

            {/* Stock */}
            <div className={cn("border rounded-xl p-6", `bg-${theme.colors.background}`, `border-${theme.colors.border}`)}>
              <div className="flex items-center gap-2 mb-4">
                <Hash className="h-4 w-4 text-gray-400" />
                <h3 className={cn("text-lg font-semibold", `text-${theme.colors.text}`)}>
                  Inventario
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <p className={cn("text-3xl font-bold", `text-${theme.colors.text}`)}>
                  {producto.stock}
                </p>
                <span className={cn("px-3 py-1 rounded-full text-sm font-medium", stockStatus.color)}>
                  {stockStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className={cn("border rounded-xl p-6", `bg-${theme.colors.background}`, `border-${theme.colors.border}`)}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h3 className={cn("text-lg font-semibold", `text-${theme.colors.text}`)}>
                Información del Sistema
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={cn("text-sm font-medium", `text-${theme.colors.textSecondary}`)}>
                  ID del Producto
                </label>
                <p className={cn("text-sm font-mono", `text-${theme.colors.text}`)}>
                  {producto.id}
                </p>
              </div>

              <div>
                <label className={cn("text-sm font-medium", `text-${theme.colors.textSecondary}`)}>
                  Fecha de Creación
                </label>
                <p className={cn("text-sm", `text-${theme.colors.text}`)}>
                  {formatDate(producto.created_at)}
                </p>
              </div>
            </div>

            {/* Stock Status Info */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className={cn(theme.colors.textSecondary)}>Crítico (≤5)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className={cn(theme.colors.textSecondary)}>Bajo (≤10)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className={cn(theme.colors.textSecondary)}>Disponible (>10)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                `bg-${theme.colors.background}`,
                `text-${theme.colors.textSecondary}`,
                `hover:bg-gray-600`
              )}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}