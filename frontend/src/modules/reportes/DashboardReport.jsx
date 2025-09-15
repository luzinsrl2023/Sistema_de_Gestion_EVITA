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
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { exportMultipleSheetsToExcel, exportSectionsToPDF } from '../../common'

const dashboardData = {
  sales: [
    { month: 'Ene', sales: 4000, purchases: 2400 },
    { month: 'Feb', sales: 3000, purchases: 1398 },
    { month: 'Mar', sales: 2000, purchases: 9800 },
    { month: 'Abr', sales: 2780, purchases: 3908 },
    { month: 'May', sales: 1890, purchases: 4800 },
    { month: 'Jun', sales: 2390, purchases: 3800 }
  ],
  topProducts: [
    { name: 'Limpiador Multiuso EVITA Pro', sales: 1240, revenue: 7440 },
    { name: 'Jabón Líquido para Manos EVITA', sales: 980, revenue: 3920 },
    { name: 'Desinfectante Antibacterial EVITA', sales: 756, revenue: 6790 },
    { name: 'Papel Higiénico Suave 4 Rollos', sales: 620, revenue: 1860 }
  ],
  recentActivity: [
    { id: 1, type: 'order', customer: 'Juan Pérez', amount: 1250, time: 'Hace 5 min' },
    { id: 2, type: 'payment', customer: 'Ana Gómez', amount: 875, time: 'Hace 12 min' },
    { id: 3, type: 'order', customer: 'Carlos Rodríguez', amount: 2100, time: 'Hace 25 min' },
    { id: 4, type: 'payment', customer: 'Laura Fernández', amount: 550, time: 'Hace 1 hora' }
  ]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function DashboardReport() {
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('report:dashboard:timeRange') || 'monthly')
  React.useEffect(() => {
    localStorage.setItem('report:dashboard:timeRange', timeRange)
  }, [timeRange])

  const handleExportExcel = () => {
    exportMultipleSheetsToExcel({
      filename: 'dashboard_reporte_evita.xlsx',
      sheets: [
        { sheetName: 'Ventas', data: dashboardData.sales },
        { sheetName: 'ProductosTop', data: dashboardData.topProducts },
      ],
    })
  }

  const handleExportPDF = () => {
    const sections = [
      {
        title: 'Ventas vs Compras',
        head: ['Mes', 'Ventas', 'Compras'],
        body: dashboardData.sales.map(item => [item.month, formatCurrency(item.sales), formatCurrency(item.purchases)])
      },
      {
        title: 'Productos Más Vendidos',
        head: ['Producto', 'Unidades', 'Ingresos'],
        body: dashboardData.topProducts.map(p => [p.name, p.sales, formatCurrency(p.revenue)])
      }
    ]
    exportSectionsToPDF({ title: 'Dashboard Reporte - EVITA', sections, filename: 'dashboard_reporte_evita.pdf' })
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(15430)}</p>
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
              <p className="text-2xl font-bold text-white">142</p>
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
              <p className="text-2xl font-bold text-white">245</p>
              <p className="text-sm text-gray-400">Pedidos</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">89</p>
              <p className="text-sm text-gray-400">Productos</p>
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
                data={dashboardData.sales}
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
          <h3 className="text-xl font-semibold text-white mb-4">Productos Más Vendidos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                  itemStyle={{ color: '#F9FAFB' }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value) => [formatCurrency(value), 'Ingresos']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">Actividad Reciente</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {dashboardData.recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-800/20 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{activity.customer}</p>
                  <p className="text-sm text-gray-400">
                    {activity.type === 'order' ? 'Nuevo pedido' : 'Pago recibido'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">{formatCurrency(activity.amount)}</p>
                  <p className="text-sm text-gray-400">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Icons
function DollarSign() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )
}

function Users() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  )
}

function ShoppingCart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  )
}

function Package() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5"></path>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
      <path d="m3.3 7 8.7 5 8.7-5"></path>
      <path d="M12 22V12"></path>
    </svg>
  )
}