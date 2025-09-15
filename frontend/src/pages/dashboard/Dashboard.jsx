import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Package, 
  Users, 
  ShoppingCart,
  AlertTriangle,
  Plus,
  ExternalLink,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../../lib/utils'

const stats = [
  {
    name: 'Ventas Totales (Mes)',
    value: 25450,
    change: '+15%',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'bg-green-500/10 text-green-400'
  },
  {
    name: 'Compras Totales (Mes)',
    value: 12300,
    change: '+5%',
    changeType: 'positive',
    icon: TrendingDown,
    color: 'bg-orange-500/10 text-orange-400'
  },
  {
    name: 'Flujo de Caja Disponible',
    value: 13150,
    change: 'Actualizado hoy',
    changeType: 'neutral',
    icon: Wallet,
    color: 'bg-blue-500/10 text-blue-400'
  },
  {
    name: 'Productos en Stock',
    value: 1547,
    change: '-3%',
    changeType: 'negative',
    icon: Package,
    color: 'bg-purple-500/10 text-purple-400'
  }
]

const topProducts = [
  { name: 'Limpiador Multiuso EVITA Pro', category: 'Limpieza', units: 150, revenue: 3000 },
  { name: 'Detergente Ecológico Concentrado', category: 'Limpieza', units: 120, revenue: 2400 },
  { name: 'Desinfectante Antibacterial', category: 'Limpieza', units: 110, revenue: 2200 },
  { name: 'Bombillas LED Ahorro Energía', category: 'Electricidad', units: 100, revenue: 1500 },
  { name: 'Jabón Líquido para Manos', category: 'Limpieza', units: 85, revenue: 850 }
]

const recentActivities = [
  { type: 'sale', description: 'Nueva venta #INV-001234', amount: 450, time: '2 min' },
  { type: 'purchase', description: 'Orden de compra #PO-005678', amount: 1200, time: '15 min' },
  { type: 'payment', description: 'Pago recibido - Cliente ABC', amount: 850, time: '1 hora' },
  { type: 'alert', description: 'Stock bajo: Jabón para platos', amount: null, time: '2 horas' }
]

const lowStockAlerts = [
  { product: 'Jabón para Platos EVITA', current: 20, minimum: 50, category: 'Limpieza' },
  { product: 'Desinfectante de Superficies', current: 15, minimum: 40, category: 'Limpieza' },
  { product: 'Cable Eléctrico 2.5mm', current: 8, minimum: 25, category: 'Electricidad' },
  { product: 'Bolsas Basura Biodegradables', current: 12, minimum: 30, category: 'Artículos Generales' }
]

export default function Dashboard() {
  const { theme } = useTheme()
  const [dateRange, setDateRange] = useState('month')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold", `text-${theme.colors.text}`)}>Panel de Control - EVITA</h1>
          <p className={cn("mt-1", `text-${theme.colors.textSecondary}`)}>
            Artículos de Limpieza y Electricidad - Resumen Empresarial
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={cn(
              "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2",
              `bg-${theme.colors.surface}`,
              `border-${theme.colors.border}`,
              `text-${theme.colors.text}`,
              `focus:ring-${theme.colors.primary}`
            )}
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
          <button className={cn(
            "flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium transition-colors",
            `bg-${theme.colors.primary}`,
            `hover:bg-${theme.colors.primaryHover}`
          )}>
            <Plus className="h-4 w-4" />
            Nueva Entrada
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className={cn("border rounded-xl p-6", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-lg", stat.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  {stat.changeType === 'positive' && (
                    <div className="flex items-center text-green-400 text-sm">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </div>
                  )}
                  {stat.changeType === 'negative' && (
                    <div className="flex items-center text-red-400 text-sm">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {stat.change}
                    </div>
                  )}
                  {stat.changeType === 'neutral' && (
                    <div className="text-gray-400 text-sm">
                      {stat.change}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className={cn("text-2xl font-bold", `text-${theme.colors.text}`)}>
                  {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
                </p>
                <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>{stat.name}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className={cn("border rounded-xl", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className={cn("p-6 border-b flex items-center justify-between", `border-${theme.colors.border}`)}>
            <h3 className={cn("text-xl font-semibold", `text-${theme.colors.text}`)}>Productos Más Vendidos</h3>
            <Link 
              to="/products"
              className={cn("text-sm font-medium flex items-center gap-1 transition-colors", `text-${theme.colors.primaryText}`, `hover:text-${theme.colors.primary}`)}
            >
              Ver todos
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={cn("bg-opacity-50", `bg-${theme.colors.background}`)}
              >
                <tr>
                  <th className={cn("p-4 text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>Producto</th>
                  <th className={cn("p-4 text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>Categoría</th>
                  <th className={cn("p-4 text-sm font-semibold text-right", `text-${theme.colors.textSecondary}`)}>Unidades</th>
                  <th className={cn("p-4 text-sm font-semibold text-right", `text-${theme.colors.textSecondary}`)}>Ingresos</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", `divide-${theme.colors.border}`)}>
                {topProducts.map((product, index) => (
                  <tr key={index} className={cn("hover:bg-opacity-30 transition-colors", `hover:bg-${theme.colors.background}`)}>
                    <td className={cn("p-4 font-medium", `text-${theme.colors.text}`)}>{product.name}</td>
                    <td className={cn("p-4", `text-${theme.colors.textSecondary}`)}>{product.category}</td>
                    <td className={cn("p-4 text-right font-mono", `text-${theme.colors.text}`)}>{product.units}</td>
                    <td className={cn("p-4 text-right font-mono", `text-${theme.colors.text}`)}>{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={cn("border rounded-xl", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className={cn("p-6 border-b", `border-${theme.colors.border}`)}>
            <h3 className={cn("text-xl font-semibold", `text-${theme.colors.text}`)}>Actividad Reciente</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  activity.type === 'sale' && "bg-green-500/10 text-green-400",
                  activity.type === 'purchase' && "bg-blue-500/10 text-blue-400",
                  activity.type === 'payment' && "bg-purple-500/10 text-purple-400",
                  activity.type === 'alert' && "bg-yellow-500/10 text-yellow-400"
                )}>
                  {activity.type === 'sale' && <TrendingUp className="h-4 w-4" />}
                  {activity.type === 'purchase' && <ShoppingCart className="h-4 w-4" />}
                  {activity.type === 'payment' && <Wallet className="h-4 w-4" />}
                  {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", `text-${theme.colors.text}`)}>{activity.description}</p>
                  <p className={cn("text-xs", `text-${theme.colors.textSecondary}`)}>Hace {activity.time}</p>
                </div>
                {activity.amount && (
                  <p className={cn("font-mono text-sm", `text-${theme.colors.text}`)}>{formatCurrency(activity.amount)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className={cn("border rounded-xl", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
        <div className={cn("p-6 border-b flex items-center gap-2", `border-${theme.colors.border}`)}>
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <h3 className={cn("text-xl font-semibold", `text-${theme.colors.text}`)}>Alertas de Stock Bajo</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lowStockAlerts.map((alert, index) => (
              <div key={index} className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={cn("font-medium", `text-${theme.colors.text}`)}>{alert.product}</h4>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                    {alert.category}
                  </span>
                </div>
                <p className={cn("text-sm mb-2", `text-${theme.colors.textSecondary}`)}>
                  Stock actual: <span className="text-yellow-400 font-medium">{alert.current}</span>
                </p>
                <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                  Mínimo requerido: <span className={cn("font-medium", `text-${theme.colors.text}`)}>{alert.minimum}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
