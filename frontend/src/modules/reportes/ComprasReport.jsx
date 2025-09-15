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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { exportToExcel, exportTableToPDF } from '../../common'

const purchasesData = [
  { month: 'Ene', purchases: 2400, suppliers: 5 },
  { month: 'Feb', purchases: 1398, suppliers: 3 },
  { month: 'Mar', purchases: 9800, suppliers: 8 },
  { month: 'Abr', purchases: 3908, suppliers: 6 },
  { month: 'May', purchases: 4800, suppliers: 7 },
  { month: 'Jun', purchases: 3800, suppliers: 4 },
  { month: 'Jul', purchases: 4300, suppliers: 6 },
  { month: 'Ago', purchases: 2400, suppliers: 5 },
  { month: 'Sep', purchases: 1398, suppliers: 3 },
  { month: 'Oct', purchases: 9800, suppliers: 8 },
  { month: 'Nov', purchases: 3908, suppliers: 6 },
  { month: 'Dic', purchases: 4800, suppliers: 7 }
]

const supplierData = [
  { name: 'Proveedor A', value: 400 },
  { name: 'Proveedor B', value: 300 },
  { name: 'Proveedor C', value: 300 },
  { name: 'Proveedor D', value: 200 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function ComprasReport() {
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('report:compras:timeRange') || 'monthly')
  React.useEffect(() => { localStorage.setItem('report:compras:timeRange', timeRange) }, [timeRange])

  const handleExportExcel = () => {
    const data = purchasesData.map(item => ({
      Mes: item.month,
      Compras: item.purchases,
      Proveedores: item.suppliers,
    }))
    exportToExcel({ filename: 'reporte_compras_evita.xlsx', sheetName: 'ReporteCompras', data })
  }

  const handleExportPDF = () => {
    const head = ['Mes', 'Compras', 'Proveedores']
    const body = purchasesData.map(item => [
      item.month,
      formatCurrency(item.purchases),
      item.suppliers,
    ])
    exportTableToPDF({ title: 'Reporte de Compras - EVITA', head, body, filename: 'reporte_compras_evita.pdf' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reporte de Compras</h1>
          <p className="text-gray-400 mt-1">
            Análisis de compras mensuales y distribución por proveedores
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
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(48000)}</p>
              <p className="text-sm text-gray-400">Compras Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">25</p>
              <p className="text-sm text-gray-400">Proveedores</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(1920)}</p>
              <p className="text-sm text-gray-400">Promedio Mensual</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">TecnoGlobal S.A.</p>
              <p className="text-sm text-gray-400">Proveedor Principal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Compras Mensuales</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={purchasesData}
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
                <Line type="monotone" dataKey="purchases" stroke="#3B82F6" name="Compras" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Distribución por Proveedores</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplierData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {supplierData.map((entry, index) => (
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
function ShoppingCart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  )
}
