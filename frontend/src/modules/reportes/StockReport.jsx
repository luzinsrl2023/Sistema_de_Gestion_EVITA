import React, { useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { exportToExcel, exportTableToPDF } from '../../common'

const stockData = [
  { product: 'Producto A', stock: 120, minStock: 50, category: 'Limpieza' },
  { product: 'Producto B', stock: 80, minStock: 30, category: 'Limpieza' },
  { product: 'Producto C', stock: 25, minStock: 50, category: 'Limpieza' },
  { product: 'Producto D', stock: 200, minStock: 75, category: 'Electricidad' },
  { product: 'Producto E', stock: 150, minStock: 100, category: 'Artículos Generales' },
  { product: 'Producto F', stock: 45, minStock: 25, category: 'Electricidad' },
  { product: 'Producto G', stock: 10, minStock: 50, category: 'Limpieza' },
  { product: 'Producto H', stock: 300, minStock: 150, category: 'Artículos Generales' }
]

const categoryData = [
  { name: 'Limpieza', value: 400 },
  { name: 'Electricidad', value: 300 },
  { name: 'Artículos Generales', value: 300 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28']

export default function StockReport() {
  const [filter, setFilter] = useState(() => localStorage.getItem('report:stock:filter') || 'all')
  React.useEffect(() => { localStorage.setItem('report:stock:filter', filter) }, [filter])

  const handleExportExcel = () => {
    const data = stockData.map(item => ({
      Producto: item.product,
      Stock: item.stock,
      'Stock Mínimo': item.minStock,
      'Categoría': item.category,
      Estado: item.stock <= item.minStock ? 'Bajo' : 'Normal',
    }))
    exportToExcel({ filename: 'reporte_stock_evita.xlsx', sheetName: 'ReporteStock', data })
  }

  const handleExportPDF = () => {
    const head = ['Producto', 'Stock', 'Stock Mínimo', 'Categoría', 'Estado']
    const body = stockData.map(item => [
      item.product,
      item.stock,
      item.minStock,
      item.category,
      item.stock <= item.minStock ? 'Bajo' : 'Normal',
    ])
    exportTableToPDF({ title: 'Reporte de Stock - EVITA', head, body, filename: 'reporte_stock_evita.pdf' })
  }

  // Filter data based on selection
  const filteredData = filter === 'low' 
    ? stockData.filter(item => item.stock <= item.minStock)
    : stockData

  const lowStockCount = stockData.filter(item => item.stock <= item.minStock).length
  const outOfStockCount = stockData.filter(item => item.stock === 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reporte de Stock</h1>
          <p className="text-gray-400 mt-1">
            Análisis de inventario y niveles de stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"
            >
              <option value="all">Todos los productos</option>
              <option value="low">Stock bajo</option>
            </select>
          </div>
          <div className="relative group">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Exportar PDF
              </button>
            </div>
          </div>
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
              <p className="text-2xl font-bold text-white">{stockData.length}</p>
              <p className="text-sm text-gray-400">Total Productos</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <Package className="h-5 w-5" />
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
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{outOfStockCount}</p>
              <p className="text-sm text-gray-400">Agotados</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(125000)}</p>
              <p className="text-sm text-gray-400">Valor Inventario</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Niveles de Stock</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 50,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="product" stroke="#9CA3AF" angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                  itemStyle={{ color: '#F9FAFB' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Bar dataKey="stock" fill="#10B981" name="Stock Actual" />
                <Bar dataKey="minStock" fill="#EF4444" name="Stock Mínimo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Distribución por Categorías</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                  itemStyle={{ color: '#F9FAFB' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">Detalle de Inventario</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Producto</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Categoría</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Stock</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Stock Mínimo</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredData.map((item, index) => {
                const isLowStock = item.stock <= item.minStock
                const isOutOfStock = item.stock === 0
                
                return (
                  <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-white">{item.product}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOutOfStock ? 'bg-red-500/10 text-red-400' :
                        isLowStock ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400 text-center">{item.minStock}</td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOutOfStock ? 'bg-red-500/10 text-red-400' :
                        isLowStock ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {isOutOfStock ? 'Agotado' : isLowStock ? 'Bajo' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Icons
function Package() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15"></path>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
      <path d="m3.3 7 8.7 5 8.7-5"></path>
      <path d="M12 22V12"></path>
    </svg>
  )
}