import React, { useState, useEffect, useRef } from 'react'
import { Search, Package, Plus, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useProductos } from '../../hooks/useProductos'

const ProductSearch = ({ 
  onProductSelect, 
  placeholder = "Buscar productos...",
  className = "",
  showAddButton = true,
  disabled = false 
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Hook para obtener productos
  const { data: productos = [], isLoading } = useProductos()

  // Filtrar productos basado en la query
  const filteredProducts = productos.filter(product => {
    if (!query.trim()) return false
    const searchTerm = query.toLowerCase()
    return (
      product.name?.toLowerCase().includes(searchTerm) ||
      product.sku?.toLowerCase().includes(searchTerm) ||
      product.code?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    )
  }).slice(0, 10) // Limitar a 10 resultados

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Manejar teclas de navegación
  const handleKeyDown = (e) => {
    if (!isOpen && filteredProducts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setSelectedIndex(0)
      }
      return
    }

    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredProducts.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
            handleSelectProduct(filteredProducts[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }
  }

  // Manejar cambios en el input
  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    
    if (value.trim()) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  // Seleccionar producto
  const handleSelectProduct = (product) => {
    if (onProductSelect) {
      onProductSelect(product)
    }
    setQuery(product.name || product.sku || '')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Limpiar búsqueda
  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Formatear precio
  const formatPrice = (price) => {
    if (!price) return 'Sin precio'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() && filteredProducts.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            query && "pr-16"
          )}
        />
        
        {/* Botones de acción */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showAddButton && (
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-green-400 transition-colors"
              title="Agregar nuevo producto"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Cargando productos...
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="p-2 border-b border-gray-700">
                <span className="text-xs text-gray-400">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id || product.sku}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className={cn(
                    "w-full p-3 text-left hover:bg-gray-700 transition-colors",
                    "border-b border-gray-700/50 last:border-b-0",
                    index === selectedIndex && "bg-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-700 rounded-lg">
                        <Package className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {product.name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <span>SKU: {product.sku || 'N/A'}</span>
                          {product.code && (
                            <>
                              <span>•</span>
                              <span>Código: {product.code}</span>
                            </>
                          )}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {formatPrice(product.price)}
                      </div>
                      {product.stock !== undefined && (
                        <div className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          product.stock > 10 
                            ? "bg-green-500/10 text-green-400"
                            : product.stock > 0
                              ? "bg-yellow-500/10 text-yellow-400" 
                              : "bg-red-500/10 text-red-400"
                        )}>
                          Stock: {product.stock}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {filteredProducts.length === 10 && (
                <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-700">
                  Mostrando primeros 10 resultados. Refina tu búsqueda para ver más.
                </div>
              )}
            </>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No se encontraron productos</div>
              <div className="text-xs mt-1">
                Intenta con otro término de búsqueda
              </div>
              {showAddButton && (
                <button
                  type="button"
                  className="mt-3 text-xs text-green-400 hover:text-green-300 underline"
                >
                  ¿Crear nuevo producto "{query}"?
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Lista de productos para datalist (fallback) */}
      <datalist id={`productos-list-${Math.random().toString(36).substr(2, 9)}`}>
        {productos.map((product) => (
          <option 
            key={product.id || product.sku} 
            value={`${product.name} - ${product.sku}`}
          />
        ))}
      </datalist>
    </div>
  )
}

export default ProductSearch