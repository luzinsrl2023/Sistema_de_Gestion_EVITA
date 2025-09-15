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
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { exportToExcel, exportTableToPDF } from '../../common'

const salesData = [
  { month: 'Ene', sales: 4000, purchases: 2400 },
  { month: 'Feb', sales: 3000, purchases: 1398 },
  { month: 'Mar', sales: 2000, purchases: 9800 },
  { month: 'Abr', sales: 2780, purchases: 3908 },
  { month: 'May', sales: 1890, purchases: 4800 },
  { month: 'Jun', sales: 2390, purchases: 3800 },
  { month: 'Jul', sales: 3490, purchases: 4300 },
  { month: 'Ago', sales: 2000, purchases: 2400 },
  { month: 'Sep', sales: 3000, purchases: 1398 },
  { month: 'Oct', sales: 4000, purchases: 9800 },
  { month: 'Nov', sales: 2780, purchases: 3908 },
  { month: 'Dic', sales: 1890, purchases: 4800 }
]

const productData = [
  { name: 'Producto A', value: 400 },
  { name: 'Producto B', value: 300 },
  { name: 'Producto C', value: 300 },
  { name: 'Producto D', value: 200 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function VentasReport() {
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('report:ventas:timeRange') || 'monthly')
  React.useEffect(() => { localStorage.setItem('report:ventas:timeRange', timeRange) }, [timeRange])

  const handleExportExcel = () => {
    const data = salesData.map(item => ({
      Mes: item.month,
      Ventas: item.sales,
      Compras: item.purchases,
    }))
    exportToExcel({ filename: 'reporte_ventas_evita.xlsx', sheetName: 'ReporteVentas', data })
  }

  const handleExportPDF = () => {
    const head = ['Mes', 'Ventas', 'Compras']
    const body = salesData.map(item => [
      item.month,
      formatCurrency(item.sales),
      formatCurrency(item.purchases),
    ])
    exportTableToPDF({ title: 'Reporte de Ventas - EVITA', head, body, filename: 'reporte_ventas_evita.pdf' })
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
              <p className="text-2xl font-bold text-white">{formatCurrency(34000)}</p>
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
              <p className="text-2xl font-bold text-white">{formatCurrency(28000)}</p>
              <p className="text-sm text-gray-400">Compras Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(6000)}</p>
              <p className="text-sm text-gray-400">Utilidad Bruta</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">17.6%</p>
              <p className="text-sm text-gray-400">Margen Bruto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Ventas vs Compras</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                  itemStyle={{ color: '#F9FAFB' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Bar dataKey="sales" fill="#10B981" name="Ventas" />
                <Bar dataKey="purchases" fill="#3B82F6" name="Compras" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Distribución de Productos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {productData.map((entry, index) => (
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
    </div>
  )
}

// Icons
function TrendingUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  )
}