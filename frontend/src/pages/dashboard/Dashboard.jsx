import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  BarChart3,
  Bell
} from 'lucide-react'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency } from '../../lib/utils'

// Componente de tarjeta de estadística
const StatCard = ({ icon, title, value, trend, trendType }) => {
  const Icon = icon
  return (
    <div className="border rounded-xl p-4 bg-gray-900 border-gray-800">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
          <Icon className="h-5 w-5" />
        </div>
        <div className={`flex items-center text-sm font-medium ${trendType === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {trendType === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          {trend.toFixed(1)}%
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm mt-1 text-gray-400">{title}</p>
      </div>
    </div>
  )
}

// Componente de producto más vendido
const BestSellingProduct = ({ name, category, units, revenue }) => (
  <tr className="hover:bg-opacity-30 transition-colors hover:bg-gray-950">
    <td className="p-4 font-medium text-white">{name}</td>
    <td className="p-4 text-gray-400">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
        {category || 'General'}
      </span>
    </td>
    <td className="p-4 text-right font-mono text-gray-400">{units}</td>
    <td className="p-4 text-right font-medium font-mono text-white">{formatCurrency(revenue)}</td>
  </tr>
)

// Componente de actividad reciente
const RecentActivity = ({ person, action, amount, time }) => (
  <div className="p-4 hover:bg-gray-800/20 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-white">{person}</p>
        <p className="text-sm text-gray-400">{action}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-white">{formatCurrency(amount)}</p>
        <p className="text-sm text-gray-400">{time}</p>
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const { stats, bestSellingProducts, recentActivity, lowStockProducts, loading, error } = useDashboardData()
  const [showLowStock, setShowLowStock] = useState(false)

  if (loading) {
    return <div className="p-6 text-white">Cargando dashboard...</div>
  }

  if (error) {
    return <div className="p-6 text-red-400">Error al cargar el dashboard: {error.message}</div>
  }

  const statCards = [
    { icon: DollarSign, title: 'Ingresos Totales', value: formatCurrency(stats.totalRevenue.value), trend: stats.totalRevenue.trend, trendType: 'up' },
    { icon: Users, title: 'Nuevos Clientes', value: stats.newCustomers.value, trend: stats.newCustomers.trend, trendType: 'up' },
    { icon: ShoppingCart, title: 'Pedidos', value: stats.orders.value, trend: stats.orders.trend, trendType: 'down' },
    { icon: Package, title: 'Productos', value: stats.products.value, trend: stats.products.trend, trendType: 'up' }
  ]

  return (
    <main className="p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-gray-400">Resumen de actividad y métricas clave</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/reports" className="flex items-center gap-2 p-2 hover:text-white transition-colors text-gray-300">
              <BarChart3 className="h-5 w-5" />
              <span>Reportes</span>
            </Link>
            <div className="relative">
              <button onClick={() => setShowLowStock(!showLowStock)} className="relative p-2 hover:text-white transition-colors text-gray-300">
                <Bell className="h-5 w-5" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full ring-2 bg-red-500 ring-gray-900/20"></span>
                )}
              </button>
              {showLowStock && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-4 border-b border-gray-700">
                    <h4 className="font-semibold text-white">Productos con Stock Bajo</h4>
                  </div>
                  <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map(product => (
                        <div key={product.id} className="p-4 text-sm">
                          <p className="font-medium text-white">{product.nombre}</p>
                          <p className="text-gray-400">Stock actual: <span className="font-bold text-red-400">{product.stock}</span></p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-gray-400">No hay alertas de stock.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => <StatCard key={index} {...stat} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sección de productos más vendidos */}
          <div className="border rounded-xl bg-gray-900 border-gray-800">
            <div className="p-6 border-b flex items-center justify-between border-gray-800">
              <h3 className="text-xl font-semibold text-white">Productos Más Vendidos</h3>
              <Link to="/products" className="text-sm font-medium flex items-center gap-1 transition-colors text-green-400 hover:text-green-300">
                Ver todos
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-opacity-50 bg-gray-950">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-400">Producto</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Categoría</th>
                    <th className="p-4 text-sm font-semibold text-right text-gray-400">Unidades</th>
                    <th className="p-4 text-sm font-semibold text-right text-gray-400">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {bestSellingProducts.map((product, index) => <BestSellingProduct key={index} {...product} />)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sección de actividad reciente */}
          <div className="border rounded-xl bg-gray-900 border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold text-white">Actividad Reciente</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {recentActivity.map((activity, index) => <RecentActivity key={index} {...activity} />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}