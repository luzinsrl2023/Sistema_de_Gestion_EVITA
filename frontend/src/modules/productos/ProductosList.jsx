import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  ChevronDown,
  Import,
  Download,
  FileSpreadsheet,
  FileText,
  X
} from 'lucide-react'
import { formatCurrency, getStatusColor, cn } from '../../lib/utils'
import { useLocation } from 'react-router-dom'

import * as XLSX from 'xlsx'

const mockProducts = [
  {
    id: 'EVT001',
    name: 'Limpiador Multiuso EVITA Pro',
    category: 'Limpieza',
    sku: 'LMP-EVT-001',
    stock: 150,
    minStock: 50,
    price: 5.99,
    cost: 3.50,
    status: 'activo',
    supplier: 'Distribuidora Norte' // Add supplier field
  },
  {
    id: 'EVT002',
    name: 'Desinfectante Antibacterial EVITA',
    category: 'Limpieza',
    sku: 'DES-EVT-002',
    stock: 120,
    minStock: 30,
    price: 8.99,
    cost: 5.20,
    status: 'activo',
    supplier: 'TecnoGlobal S.A.' // Add supplier field
  },
  {
    id: 'EVT003',
    name: 'Jabón Líquido para Manos EVITA',
    category: 'Limpieza',
    sku: 'JAB-EVT-003',
    stock: 20,
    minStock: 50,
    price: 3.99,
    cost: 2.20,
    status: 'activo',
    supplier: 'Componentes & Cia.' // Add supplier field
  },
  {
    id: 'EVT004',
    name: 'Detergente en Polvo Concentrado',
    category: 'Limpieza',
    sku: 'DET-EVT-004',
    stock: 80,
    minStock: 25,
    price: 12.99,
    cost: 8.50,
    status: 'activo',
    supplier: 'Soluciones de Oficina Ltda.' // Add supplier field
  },
  {
    id: 'EVT005',
    name: 'Limpiavidrios Profesional EVITA',
    category: 'Limpieza',
    sku: 'LVD-EVT-005',
    stock: 90,
    minStock: 30,
    price: 4.49,
    cost: 2.80,
    status: 'activo',
    supplier: 'Distribuidora Norte' // Add supplier field
  },
  {
    id: 'EVT006',
    name: 'Bombillas LED Eco 12W',
    category: 'Electricidad',
    sku: 'LED-ECO-012',
    stock: 180,
    minStock: 50,
    price: 3.49,
    cost: 2.10,
    status: 'activo',
    supplier: 'Componentes & Cia.' // Add supplier field
  },
  {
    id: 'EVT007',
    name: 'Cable Eléctrico Flexible 2.5mm',
    category: 'Electricidad',
    sku: 'CAB-FLX-25',
    stock: 45,
    minStock: 25,
    price: 2.99,
    cost: 1.80,
    status: 'activo',
    supplier: 'TecnoGlobal S.A.' // Add supplier field
  },
  {
    id: 'EVT008',
    name: 'Enchufe Universal con Toma Tierra',
    category: 'Electricidad',
    sku: 'ENC-UNI-TT',
    stock: 200,
    minStock: 75,
    price: 4.79,
    cost: 3.20,
    status: 'activo',
    supplier: 'Soluciones de Oficina Ltda.' // Add supplier field
  },
  {
    id: 'EVT009',
    name: 'Bolsas Basura Biodegradables 50L',
    category: 'Artículos Generales',
    sku: 'BOL-BIO-50',
    stock: 250,
    minStock: 100,
    price: 1.99,
    cost: 1.20,
    status: 'activo',
    supplier: 'Distribuidora Norte' // Add supplier field
  },
  {
    id: 'EVT010',
    name: 'Papel Higiénico Suave 4 Rollos',
    category: 'Artículos Generales',
    sku: 'PAP-HIG-4R',
    stock: 300,
    minStock: 150,
    price: 2.99,
    cost: 1.80,
    status: 'activo',
    supplier: 'TecnoGlobal S.A.' // Add supplier field
  }
]

const categories = ['Todos', 'Limpieza', 'Artículos Generales', 'Electricidad']

// Add import for ProductoForm
import ProductoForm from './ProductoForm'

export default function ProductosList() {
  const [products, setProducts] = useState(() => {
    try {
      const raw = localStorage.getItem('evita-productos')
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return mockProducts
  })
  
  const [filteredProducts, setFilteredProducts] = useState(() => {
    try {
      const raw = localStorage.getItem('evita-productos')
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return mockProducts
  })
  
  // Add missing states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [stockFilter, setStockFilter] = useState('all')
  const [showAddProduct, setShowAddProduct] = useState(false) // Add missing state for the "Nuevo Producto" button
  const [editingProduct, setEditingProduct] = useState(null) // Add state for editing product
  
  // Persist products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('evita-productos', JSON.stringify(products))
    } catch (_) {}
  }, [products])

	// Prefill search from global query parameter
	const location = useLocation()
	useEffect(() => {
	  const q = new URLSearchParams(location.search).get('q') || ''
	  setSearchTerm(q)
	}, [location.search])

  const [selectedProducts, setSelectedProducts] = useState([])
  const fileInputRef = useRef(null)

  // Filter products
  useEffect(() => {
    let filtered = products

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryFilter !== 'Todos') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Apply stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.stock <= product.minStock)
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.stock === 0)
    }

    setFilteredProducts(filtered)
  }, [searchTerm, categoryFilter, stockFilter, products])

  const getStockStatus = (product) => {
    if (product.stock === 0) {
      return { label: 'Agotado', color: 'bg-red-500/10 text-red-400' }
    } else if (product.stock <= product.minStock) {
      return { label: `${product.stock} (Bajo)`, color: 'bg-yellow-500/10 text-yellow-400' }
    } else {
      return { label: product.stock.toString(), color: 'bg-green-500/10 text-green-400' }
    }
  }

  const getMargin = (product) => {
    const margin = ((product.price - product.cost) / product.price * 100).toFixed(1)
    return `${margin}%`
  }

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id))
    }
  }

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  // Export functionality
  const handleExportExcel = () => {
    const exportData = filteredProducts.map(product => ({
      'ID': product.id,
      'Nombre': product.name,
      'Categoría': product.category,
      'SKU': product.sku,
      'Stock': product.stock,
      'Stock Mínimo': product.minStock,
      'Precio': product.price,
      'Costo': product.cost,
      'Margen': getMargin(product),
      'Estado': product.status
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, 'productos_evita.xlsx')
  }

  // Import functionality
  const handleImportExcel = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          const newProducts = jsonData.map((row, index) => ({
            id: row.ID || row.id || `EVT${(products.length + index + 1).toString().padStart(3, '0')}`,
            name: row.Nombre || row.name || row['Name'] || '',
            category: row.Categoría || row.category || row['Category'] || 'Artículos Generales',
            sku: row.SKU || row.sku || row['SKU'] || `SKU-${Date.now()}-${index}`,
            stock: parseInt(row.Stock || row.stock || row['Stock'] || 0),
            minStock: parseInt(row['Stock Mínimo'] || row.minStock || row['Min Stock'] || 10),
            price: parseFloat(row.Precio || row.price || row['Price'] || 0),
            cost: parseFloat(row.Costo || row.cost || row['Cost'] || 0),
            status: row.Estado || row.status || row['Status'] || 'activo'
          }))

          setProducts(prev => [...prev, ...newProducts])
          alert(`Se importaron ${newProducts.length} productos exitosamente`)
        } catch (error) {
          alert('Error al procesar los datos del archivo Excel')
          console.error('Import error:', error)
        }
      }
      reader.readAsArrayBuffer(file)
    }
    // Reset file input
    event.target.value = ''
  }

  // Add function to handle adding a new product
  const handleAddProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: `EVT${(products.length + 1).toString().padStart(3, '0')}`,
      status: 'activo'
    }
    setProducts([...products, newProduct])
    setShowAddProduct(false)
  }

  // Add function to handle editing a product
  const handleEditProduct = (product) => {
    setEditingProduct(product)
  }

  // Add function to handle updating a product
  const handleUpdateProduct = (productData) => {
    setProducts(products.map(product => 
      product.id === editingProduct.id 
        ? { ...product, ...productData } 
        : product
    ))
    setEditingProduct(null)
  }

  // Add function to handle deleting a product
  const handleDeleteProduct = (productId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
      setProducts(products.filter(product => product.id !== productId))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Catálogo EVITA</h1>
          <p className="text-gray-400 mt-1">
            Artículos de Limpieza, Electricidad y Mercancía General
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleImportExcel}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Import className="h-4 w-4" />
            Importar Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{products.length}</p>
              <p className="text-sm text-gray-400">Total Productos</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lowStockCount}</p>
              <p className="text-sm text-gray-400">Stock Bajo</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{outOfStockCount}</p>
              <p className="text-sm text-gray-400">Agotado</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(products.reduce((acc, p) => acc + (p.stock * p.price), 0))}</p>
              <p className="text-sm text-gray-400">Valor Inventario</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-8800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar productos por nombre o SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent input"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8 input"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Stock Filter */}
            <div className="relative">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8 input"
              >
                <option value="all">Todo el stock</option>
                <option value="low">Stock bajo</option>
                <option value="out">Agotado</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={handleExportExcel}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Exportar productos seleccionados"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hidden file input for Excel import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Producto</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">SKU</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Categoría</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Stock</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Costo</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Precio</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Margen</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <tr key={product.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-600 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-white">{product.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-400 font-mono">{product.sku}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', stockStatus.color)}>
                        {product.stock <= product.minStock && (
                          <span className="w-2 h-2 mr-1.5 rounded-full bg-current"></span>
                        )}
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400 text-right font-mono">{formatCurrency(product.cost)}</td>
                    <td className="px-4 py-4 text-sm text-white text-right font-mono font-medium">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4 text-sm text-gray-400 text-right font-mono">{getMargin(product)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Mostrando <span className="font-medium text-white">1</span> a{' '}
            <span className="font-medium text-white">{filteredProducts.length}</span> de{' '}
            <span className="font-medium text-white">{products.length}</span> productos
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors" disabled>
              Anterior
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 rounded transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <ProductoForm
          onClose={() => setShowAddProduct(false)}
          onSubmit={handleAddProduct}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductoForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleUpdateProduct}
        />
      )}

    </div>
  )
}