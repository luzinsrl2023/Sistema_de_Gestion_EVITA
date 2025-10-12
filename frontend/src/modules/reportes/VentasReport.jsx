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
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Download, FileSpreadsheet, FileText, RefreshCw, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { exportToExcel, exportTableToPDF } from '../../common'
import { TimeSeriesChart, PieChart as CustomPieChart } from '../../components/charts'
import { useVentasReport } from '../../hooks'
import { useChartTheme } from '../../hooks/useChartTheme'

export default function VentasReport() {
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('report:ventas:timeRange') || 'yearly')
  
  // Hooks personalizados optimizados
  const { 
    estadisticas, 
    ventasMes, 
    productosTop, 
    loading, 
    error, 
    refresh 
  } = useVentasReport(timeRange)
  
  const { colors, seriesColors, getColorByIndex } = useChartTheme()

  // Efecto para guardar preferencias
  React.useEffect(() => { 
    localStorage.setItem('report:ventas:timeRange', timeRange) 
  }, [timeRange])

  // Handlers optimizados con useCallback
  const handleExportExcel = useCallback(() => {
    if (!ventasMes) return
    
    const data = ventasMes.map(item => ({
      Mes: item.mes,
      Ventas: item.ventas,
      Cantidad: item.cantidad,
    }))
    exportToExcel({ filename: 'reporte_ventas_evita.xlsx', sheetName: 'ReporteVentas', data })
  }, [ventasMes])

  const handleExportPDF = useCallback(() => {
    if (!ventasMes) return
    
    const head = ['Mes', 'Ventas', 'Cantidad']
    const body = ventasMes.map(item => [
      item.mes,
      formatCurrency(item.ventas),
      item.cantidad,
    ])
    exportTableToPDF({ title: 'Reporte de Ventas - EVITA', head, body, filename: 'reporte_ventas_evita.pdf' })
  }, [ventasMes])

  // Datos procesados para gráficos con useMemo
  const chartData = useMemo(() => {
    if (!ventasMes) return []
    
    return ventasMes.map(item => ({
      mes: item.mes,
      ventas: item.ventas,
      cantidad: item.cantidad
    }))
  }, [ventasMes])

  const pieChartData = useMemo(() => {
    if (!productosTop) return []
    
    return productosTop.map(item => ({
      name: item.name,
      value: item.value
    }))
  }, [productosTop])

  // Estados de carga y error
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Reporte de Ventas</h1>
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
            <h1 className="text-3xl font-bold text-white">Reporte de Ventas</h1>
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
          <h1 className="text-3xl font-bold text-white">Reporte de Ventas</h1>
          <p className="text-gray-400 mt-1">
            Análisis de ventas mensuales y comparativo con compras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"
            >
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
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
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {estadisticas?.totalVentas || '$0'}
              </p>
              <p className="text-sm text-gray-400">Ventas Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {estadisticas?.cantidadVentas || 0}
              </p>
              <p className="text-sm text-gray-400">Cantidad de Ventas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {estadisticas?.promedioVenta || '$0'}
              </p>
              <p className="text-sm text-gray-400">Promedio por Venta</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {estadisticas?.totalMes || '$0'}
              </p>
              <p className="text-sm text-gray-400">Ventas del Mes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ventas Mensuales con TradingView */}
        <TimeSeriesChart
          data={chartData.map(item => ({
            time: item.mes,
            value: item.ventas
          }))}
          height={320}
          title="Ventas Mensuales"
          subtitle="Evolución de ventas por mes"
          className="lg:col-span-2"
        />
        
        {/* Gráfico de Productos Top con PieChart */}
        <CustomPieChart
          data={pieChartData}
          height={320}
          title="Productos Más Vendidos"
          subtitle="Distribución por ingresos generados"
          colorScheme="default"
        />
      </div>
    </div>
  )
}