import React, { useState, useMemo, useCallback } from 'react'
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
import { Download, FileSpreadsheet, FileText, RefreshCw, Package, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { exportToExcel, exportTableToPDF } from '../../common'
import { BarChart as CustomBarChart, PieChart as CustomPieChart } from '../../components/charts'
import { useStockReport } from '../../hooks'
import { useChartTheme } from '../../hooks/useChartTheme'

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
  
  // Hooks personalizados optimizados
  const { 
    estadisticas, 
    stockCritico, 
    distribucionCategoria, 
    loading, 
    error, 
    refresh 
  } = useStockReport()
  
  const { colors, seriesColors, getColorByIndex } = useChartTheme()

  // Efecto para guardar preferencias
  React.useEffect(() => { 
    localStorage.setItem('report:stock:filter', filter) 
  }, [filter])

  // Handlers optimizados con useCallback
  const handleExportExcel = useCallback(() => {
    if (!stockCritico) return
    
    const data = stockCritico.map(item => ({
      Producto: item.nombre,
      Stock: item.stock,
      Estado: item.estado,
      Valor: item.valor,
      Proveedor: item.proveedor,
    }))
    exportToExcel({ filename: 'reporte_stock_evita.xlsx', sheetName: 'ReporteStock', data })
  }, [stockCritico])

  const handleExportPDF = useCallback(() => {
    if (!stockCritico) return
    
    const head = ['Producto', 'Stock', 'Estado', 'Valor', 'Proveedor']
    const body = stockCritico.map(item => [
      item.nombre,
      item.stock,
      item.estado,
      formatCurrency(item.valor),
      item.proveedor,
    ])
    exportTableToPDF({ title: 'Reporte de Stock - EVITA', head, body, filename: 'reporte_stock_evita.pdf' })
  }, [stockCritico])

  // Datos procesados para gráficos con useMemo
  const barChartData = useMemo(() => {
    if (!stockCritico) return []
    
    return stockCritico.slice(0, 10).map(item => ({
      name: item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre,
      stock: item.stock,
      estado: item.estado
    }))
  }, [stockCritico])

  const pieChartData = useMemo(() => {
    if (!distribucionCategoria) return []
    
    return distribucionCategoria.map(item => ({
      name: item.name,
      value: item.value
    }))
  }, [distribucionCategoria])

  // Filtrar datos según selección
  const filteredData = useMemo(() => {
    if (!stockCritico) return []
    
    return filter === 'low' 
      ? stockCritico.filter(item => item.estado === 'bajo' || item.estado === 'crítico')
      : stockCritico
  }, [stockCritico, filter])

  // Estados de carga y error
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Reporte de Stock</h1>
            <p className="text-gray-400 mt-1">Cargando datos...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Reporte de Stock</h1>
            <p className="text-red-400 mt-1">Error al cargar datos: {error.message}</p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

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
              <p className="text-2xl font-bold text-white">
                {estadisticas?.totalProductos || 0}
              </p>
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
              <p className="text-2xl font-bold text-white">
                {estadisticas?.stockBajo || 0}
              </p>
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
              <p className="text-2xl font-bold text-white">
                {estadisticas?.stockCritico || 0}
              </p>
              <p className="text-sm text-gray-400">Stock Crítico</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {estadisticas?.valorInventario || '$0'}
              </p>
              <p className="text-sm text-gray-400">Valor Inventario</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Stock con TradingView BarChart */}
        <CustomBarChart
          data={barChartData}
          height={320}
          title="Niveles de Stock"
          subtitle="Top 10 productos con alertas de stock"
          xAxisLabel="Productos"
          yAxisLabel="Cantidad"
          colorScheme="default"
        />
        
        {/* Gráfico de Distribución por Categoría con PieChart */}
        <CustomPieChart
          data={pieChartData}
          height={320}
          title="Distribución por Categorías"
          subtitle="Stock distribuido por categorías"
          colorScheme="default"
        />
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
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Proveedor</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Stock</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Valor</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredData.map((item, index) => {
                const isLowStock = item.estado === 'bajo'
                const isCriticalStock = item.estado === 'crítico'
                
                return (
                  <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-white">{item.nombre}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        {item.proveedor}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isCriticalStock ? 'bg-red-500/10 text-red-400' :
                        isLowStock ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400 text-center">{formatCurrency(item.valor)}</td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isCriticalStock ? 'bg-red-500/10 text-red-400' :
                        isLowStock ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {item.estado}
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