import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  TrendingDown,
  ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency, cn } from '../../lib/utils'

// Mock data - in a real app, this would come from an API
const mockStats = [
  { name: 'Ingresos Totales', value: 125430, change: 12.5, icon: DollarSign, color: 'green' },
  { name: 'Nuevos Clientes', value: 142, change: 8.2, icon: Users, color: 'blue' },
  { name: 'Pedidos', value: 245, change: -3.1, icon: ShoppingCart, color: 'yellow' },
  { name: 'Productos', value: 89, change: 5.4, icon: Package, color: 'purple' }
]

const mockTopProducts = [
  { id: 1, name: 'Limpiador Multiuso EVITA Pro', category: 'Limpieza', units: 1240, revenue: 7440 },
  { id: 2, name: 'Jabón Líquido para Manos EVITA', category: 'Limpieza', units: 980, revenue: 3920 },
  { id: 3, name: 'Desinfectante Antibacterial EVITA', category: 'Limpieza', units: 756, revenue: 6790 },
  { id: 4, name: 'Papel Higiénico Suave 4 Rollos', category: 'Artículos Generales', units: 620, revenue: 1860 }
]

const mockRecentActivity = [
  { id: 1, type: 'order', customer: 'Juan Pérez', amount: 1250, time: 'Hace 5 min' },
  { id: 2, type: 'payment', customer: 'Ana Gómez', amount: 875, time: 'Hace 12 min' },
  { id: 3, type: 'order', customer: 'Carlos Rodríguez', amount: 2100, time: 'Hace 25 min' },
  { id: 4, type: 'payment', customer: 'Laura Fernández', amount: 550, time: 'Hace 1 hora' }
]

export default function Dashboard() {
  const { theme, getThemeClasses } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${getThemeClasses('text')}`}>Dashboard</h1>
        <p className={`mt-1 ${getThemeClasses('textSecondary')}`}>
          Resumen de actividad y métricas clave
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change > 0
          return (
            <div
              key={index}
              className={`border rounded-xl p-4 ${getThemeClasses('surface')} ${getThemeClasses('border')}`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={cn("flex items-center text-sm font-medium", isPositive ? 'text-green-400' : 'text-red-400')}>
                  {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-2xl font-bold ${getThemeClasses('text')}`}>
                  {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
                </p>
                <p className={`text-sm mt-1 ${getThemeClasses('textSecondary')}`}>{stat.name}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className={`border rounded-xl ${getThemeClasses('surface')} ${getThemeClasses('border')}`}>
          <div className={`p-6 border-b flex items-center justify-between ${getThemeClasses('border')}`}>
            <h3 className={`text-xl font-semibold ${getThemeClasses('text')}`}>Productos Más Vendidos</h3>
            <Link
              to="/products"
              className={`text-sm font-medium flex items-center gap-1 transition-colors ${getThemeClasses('primaryText')} hover:${getThemeClasses('primaryText')}`}
            >
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
                {mockTopProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-opacity-30 transition-colors hover:bg-gray-950">
                    <td className="p-4 font-medium text-white">{product.name}</td>
                    <td className="p-4 text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-400">{product.units}</td>
                    <td className="p-4 text-right font-medium font-mono text-white">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border rounded-xl bg-gray-900 border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-semibold text-white">Actividad Reciente</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {mockRecentActivity.map((activity) => (
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
    </div>
  )
}