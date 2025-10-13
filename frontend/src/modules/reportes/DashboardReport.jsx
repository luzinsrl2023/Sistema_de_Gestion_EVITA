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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Download, FileSpreadsheet, FileText, RefreshCw, TrendingUp, Users, ShoppingCart, Package } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { exportMultipleSheetsToExcel, exportSectionsToPDF } from '../../common'
import { TimeSeriesChart, PieChart as CustomPieChart } from '../../components/charts'
import { useDashboardData } from '../../hooks'
import { useChartTheme } from '../../hooks/useChartTheme'

export default function DashboardReport() {
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('report:dashboard:timeRange') || 'monthly')
  
  // Hooks personalizados optimizados
  const { 
    stats, 
    ventasComprasData, 
    productosTop, 
    actividadReciente, 
    loading, 
    error, 
    refresh 
  } = useDashboardData()
  
  const { colors, seriesColors, getColorByIndex } = useChartTheme()

  // Efecto para guardar preferencias
  React.useEffect(() => {
    localStorage.setItem('report:dashboard:timeRange', timeRange)
  }, [timeRange])

  // Handlers optimizados con useCallback
  const handleExportExcel = useCallback(() => {
    if (!ventasComprasData || !productosTop) return
    
    exportMultipleSheetsToExcel({
      filename: 'dashboard_reporte_evita.xlsx',
      sheets: [
        { sheetName: 'VentasCompras', data: ventasComprasData },
        { sheetName: 'ProductosTop', data: productosTop },
        { sheetName: 'ActividadReciente', data: actividadReciente || [] },
      ],
    })
  }, [ventasComprasData, productosTop, actividadReciente])

  const handleExportPDF = useCallback(() => {
    if (!ventasComprasData || !productosTop) return
    
    const sections = [
      {
        title: 'Ventas vs Compras',
        head: ['Mes', 'Ventas', 'Compras'],
        body: ventasComprasData.map(item => [item.mes, formatCurrency(item.ventas), formatCurrency(item.compras)])
      },
      {
        title: 'Productos Más Vendidos',
        head: ['Producto', 'Unidades', 'Ingresos'],
        body: productosTop.map(p => [p.name, p.cantidad, formatCurrency(p.value)])
      }
    ]
    exportSectionsToPDF({ title: 'Dashboard Reporte - EVITA', sections, filename: 'dashboard_reporte_evita.pdf' })
  }, [ventasComprasData, productosTop])

  // Datos procesados para gráficos con useMemo
  const chartData = useMemo(() => {
    if (!ventasComprasData) return []
    
    return ventasComprasData.map(item => ({
      mes: item.mes,
      ventas: item.ventas,
      compras: item.compras
    }))
  }, [ventasComprasData])

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
            <h1 className="text-3xl font-bold text-white">Dashboard de Reportes</h1>
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
            <h1 className="text-3xl font-bold text-white">Dashboard de Reportes</h1>
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
          <h1 className="text-3xl font-bold text-white">Dashboard de Reportes</h1>
          <p className="text-gray-400 mt-1">
            Resumen ejecutivo de métricas clave
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.ingresosTotales || '$0'}
              </p>
              <p className="text-sm text-gray-400">Ingresos Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.nuevosClientes || 0}
              </p>
              <p className="text-sm text-gray-400">Nuevos Clientes</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.totalProductos || 0}
              </p>
              <p className="text-sm text-gray-400">Productos Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.valorInventario || '$0'}
              </p>
              <p className="text-sm text-gray-400">Valor Inventario</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Ventas vs Compras con TradingView */}
        <TimeSeriesChart
          data={chartData.map(item => ({
            time: item.mes,
            value: item.ventas
          }))}
          height={280}
          title="Ventas vs Compras"
          subtitle="Comparativa mensual de ingresos y gastos"
          className="lg:col-span-2"
        />
        
        {/* Gráfico de Productos Top con PieChart */}
        <CustomPieChart
          data={pieChartData}
          height={280}
          title="Productos Más Vendidos"
          subtitle="Distribución por ingresos generados"
          colorScheme="default"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">Actividad Reciente</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {actividadReciente && actividadReciente.length > 0 ? (
            actividadReciente.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-800/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{activity.cliente}</p>
                    <p className="text-sm text-gray-400">
                      {activity.tipo === 'venta' ? 'Nueva venta' : 'Pago recibido'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{formatCurrency(activity.monto)}</p>
                    <p className="text-sm text-gray-400">{activity.tiempo}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-400">No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}