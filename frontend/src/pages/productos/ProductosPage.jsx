import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Package, 
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { formatCurrency, cn } from '../../lib/utils'
import { getProductos, createProducto, updateProducto, deleteProducto, getProductosStockBajo } from '../../services/productos'
import { getProveedores } from '../../services/proveedores'
import ProductoForm from './ProductoForm'
import ProductoDetalle from './ProductoDetalle'

export default function ProductosPage() {
  const { theme } = useTheme()
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [filteredProductos, setFilteredProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [proveedorFilter, setProveedorFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showDetalle, setShowDetalle] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [error, setError] = useState(null)

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [productosRes, proveedoresRes] = await Promise.all([
        getProductos(),
        getProveedores()
      ])

      if (productosRes.error) throw productosRes.error
      if (proveedoresRes.error) throw proveedoresRes.error

      setProductos(productosRes.data || [])
      setProveedores(proveedoresRes.data || [])
      setFilteredProductos(productosRes.data || [])

    } catch (error) {
      console.error('Error loading data:', error)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtros
  useEffect(() => {
    let filtered = productos

    // Búsqueda por nombre
    if (searchTerm) {
      filtered = filtered.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por proveedor
    if (proveedorFilter !== 'all') {
      filtered = filtered.filter(producto => producto.proveedor_id === proveedorFilter)
    }

    // Filtro por stock
    if (stockFilter === 'bajo') {
      filtered = filtered.filter(producto => producto.stock <= 10)
    } else if (stockFilter === 'critico') {
      filtered = filtered.filter(producto => producto.stock <= 5)
    } else if (stockFilter === 'agotado') {
      filtered = filtered.filter(producto => producto.stock === 0)
    }

    setFilteredProductos(filtered)
  }, [searchTerm, proveedorFilter, stockFilter, productos])

  // Handlers
  const handleCreate = async (productoData) => {
    try {
      const { data, error } = await createProducto(productoData)
      if (error) throw error

      await loadData() // Recargar datos
      setShowForm(false)
      alert('Producto creado exitosamente')
    } catch (error) {
      console.error('Error creating producto:', error)
      alert('Error al crear el producto')
    }
  }

  const handleEdit = (producto) => {
    setSelectedProducto(producto)
    setShowForm(true)
  }

  const handleUpdate = async (productoData) => {
    try {
      const { data, error } = await updateProducto(selectedProducto.id, productoData)
      if (error) throw error

      await loadData() // Recargar datos
      setShowForm(false)
      setSelectedProducto(null)
      alert('Producto actualizado exitosamente')
    } catch (error) {
      console.error('Error updating producto:', error)
      alert('Error al actualizar el producto')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return

    try {
      const { error } = await deleteProducto(id)
      if (error) throw error

      await loadData() // Recargar datos
      alert('Producto eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting producto:', error)
      alert('Error al eliminar el producto')
    }
  }

  const handleView = (producto) => {
    setSelectedProducto(producto)
    setShowDetalle(true)
  }

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Agotado</span>
    } else if (stock <= 5) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Crítico</span>
    } else if (stock <= 10) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Bajo</span>
    } else {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Disponible</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold", `text-${theme.colors.text}`)}>
            Gestión de Productos
          </h1>
          <p className={cn("mt-1", `text-${theme.colors.textSecondary}`)}>
            Administra el inventario de productos EVITA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50",
              `bg-${theme.colors.surface}`,
              `border-${theme.colors.border}`,
              `text-${theme.colors.text}`,
              `hover:bg-${theme.colors.background}`
            )}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </button>
          <button
            onClick={() => {
              setSelectedProducto(null)
              setShowForm(true)
            }}
            className={cn(
              "flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium transition-colors",
              `bg-${theme.colors.primary}`,
              `hover:bg-${theme.colors.primaryHover}`
            )}
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={cn("border rounded-xl p-6", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", `text-${theme.colors.text}`)}>
                {productos.length}
              </p>
              <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                Total Productos
              </p>
            </div>
          </div>
        </div>

        <div className={cn("border rounded-xl p-6", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", `text-${theme.colors.text}`)}>
                {formatCurrency(productos.reduce((sum, p) => sum + (parseFloat(p.precio) || 0), 0))}
              </p>
              <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                Valor Inventario
              </p>
            </div>
          </div>
        </div>

        <div className={cn("border rounded-xl p-6", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", `text-${theme.colors.text}`)}>
                {productos.filter(p => p.stock <= 10).length}
              </p>
              <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                Stock Bajo
              </p>
            </div>
          </div>
        </div>

        <div className={cn("border rounded-xl p-6", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", `text-${theme.colors.text}`)}>
                {productos.filter(p => p.stock === 0).length}
              </p>
              <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                Agotados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={cn("border rounded-xl", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
        <div className={cn("p-4 border-b", `border-${theme.colors.border}`)}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar productos por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2",
                  `bg-${theme.colors.background}`,
                  `border-${theme.colors.border}`,
                  `text-${theme.colors.text}`,
                  `focus:ring-${theme.colors.primary}`
                )}
              />
            </div>

            {/* Proveedor Filter */}
            <select
              value={proveedorFilter}
              onChange={(e) => setProveedorFilter(e.target.value)}
              className={cn(
                "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2",
                `bg-${theme.colors.background}`,
                `border-${theme.colors.border}`,
                `text-${theme.colors.text}`,
                `focus:ring-${theme.colors.primary}`
              )}
            >
              <option value="all">Todos los proveedores</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={cn(
                "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2",
                `bg-${theme.colors.background}`,
                `border-${theme.colors.border}`,
                `text-${theme.colors.text}`,
                `focus:ring-${theme.colors.primary}`
              )}
            >
              <option value="all">Todos los stocks</option>
              <option value="critico">Stock crítico (≤5)</option>
              <option value="bajo">Stock bajo (≤10)</option>
              <option value="agotado">Agotados (0)</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={cn("bg-opacity-50", `bg-${theme.colors.background}`)}>
              <tr>
                <th className={cn("p-4 text-left text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>
                  Producto
                </th>
                <th className={cn("p-4 text-left text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>
                  Proveedor
                </th>
                <th className={cn("p-4 text-right text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>
                  Precio
                </th>
                <th className={cn("p-4 text-center text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>
                  Stock
                </th>
                <th className={cn("p-4 text-center text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>
                  Estado
                </th>
                <th className={cn("p-4 text-center text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", `divide-${theme.colors.border}`)}>
              {filteredProductos.map((producto) => (
                <tr 
                  key={producto.id} 
                  className={cn("hover:bg-opacity-50 transition-colors", `hover:bg-${theme.colors.background}`)}
                >
                  <td className="p-4">
                    <div>
                      <p className={cn("font-medium", `text-${theme.colors.text}`)}>{producto.nombre}</p>
                      <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                        {producto.descripcion}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                      {producto.proveedores?.nombre || 'Sin proveedor'}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className={cn("font-mono", `text-${theme.colors.text}`)}>
                      {formatCurrency(producto.precio)}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "px-2 py-1 rounded text-sm font-medium",
                      producto.stock <= 5 ? "bg-red-500/20 text-red-400" :
                      producto.stock <= 10 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    )}>
                      {producto.stock}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {getStockBadge(producto.stock)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(producto)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(producto)}
                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProductos.length === 0 && !loading && (
            <div className="p-12 text-center">
              <Package className={cn("h-12 w-12 mx-auto mb-4", `text-${theme.colors.textSecondary}`)} />
              <p className={cn("text-lg font-medium mb-2", `text-${theme.colors.text}`)}>
                No se encontraron productos
              </p>
              <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                {searchTerm || proveedorFilter !== 'all' || stockFilter !== 'all'
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Agrega tu primer producto para comenzar'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <ProductoForm
          producto={selectedProducto}
          proveedores={proveedores}
          onSave={selectedProducto ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false)
            setSelectedProducto(null)
          }}
        />
      )}

      {showDetalle && selectedProducto && (
        <ProductoDetalle
          producto={selectedProducto}
          onClose={() => {
            setShowDetalle(false)
            setSelectedProducto(null)
          }}
          onEdit={() => {
            setShowDetalle(false)
            setShowForm(true)
          }}
        />
      )}
    </div>
  )
}