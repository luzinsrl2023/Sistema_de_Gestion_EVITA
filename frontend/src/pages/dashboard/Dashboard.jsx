import React, { useState, useEffect } from 'react'
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
  ArrowDown,
  FileText,
  CreditCard,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../../lib/utils'
import { getEstadisticasVentas } from '../../services/ventas'
import { getClientes } from '../../services/clientes'
import { getProductosStockBajo } from '../../services/productos'
import { getFacturasByEstado } from '../../services/facturas'
import { getCobranzasDelDia, getResumenCobranzas } from '../../services/cobranzas'
import { getProveedores } from '../../services/proveedores'

// Datos dummy que serán reemplazados por datos reales
const defaultStats = [
  {
    name: 'Ventas del Mes',
    value: 0,
    change: 'Cargando...',
    changeType: 'neutral',
    icon: TrendingUp,
    color: 'bg-green-500/10 text-green-400'
  },
  {
    name: 'Facturas Pendientes',
    value: 0,
    change: 'Cargando...',
    changeType: 'neutral',
    icon: FileText,
    color: 'bg-orange-500/10 text-orange-400'
  },
  {
    name: 'Cobranzas de Hoy',
    value: 0,
    change: 'Cargando...',
    changeType: 'neutral',
    icon: CreditCard,
    color: 'bg-blue-500/10 text-blue-400'
  },
  {
    name: 'Clientes Registrados',
    value: 0,
    change: 'Cargando...',
    changeType: 'neutral',
    icon: Users,
    color: 'bg-purple-500/10 text-purple-400'
  }
]

export default function Dashboard() {
  const { theme } = useTheme()
  const [dateRange, setDateRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(defaultStats)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [error, setError] = useState(null)

  // Función para cargar todos los datos del dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar datos en paralelo
      const [
        estadisticasVentas,
        clientes,
        productosStockBajo,
        facturasPendientes,
        cobranzasHoy
      ] = await Promise.all([
        getEstadisticasVentas(),
        getClientes(),
        getProductosStockBajo(10),
        getFacturasByEstado('emitida'),
        getCobranzasDelDia()
      ])

      // Actualizar estadísticas
      const newStats = [
        {
          name: 'Ventas del Mes',
          value: estadisticasVentas.data?.totalMes || 0,
          change: `${estadisticasVentas.data?.cantidadVentasMes || 0} ventas`,
          changeType: estadisticasVentas.data?.totalMes > 0 ? 'positive' : 'neutral',
          icon: TrendingUp,
          color: 'bg-green-500/10 text-green-400'
        },
        {
          name: 'Facturas Pendientes',
          value: facturasPendientes.data?.length || 0,
          change: 'Sin pagar',
          changeType: (facturasPendientes.data?.length || 0) > 0 ? 'negative' : 'positive',
          icon: FileText,
          color: 'bg-orange-500/10 text-orange-400'
        },
        {
          name: 'Cobranzas de Hoy',
          value: cobranzasHoy.data?.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0) || 0,
          change: `${cobranzasHoy.data?.length || 0} pagos`,
          changeType: (cobranzasHoy.data?.length || 0) > 0 ? 'positive' : 'neutral',
          icon: CreditCard,
          color: 'bg-blue-500/10 text-blue-400'
        },
        {
          name: 'Clientes Registrados',
          value: clientes.data?.length || 0,
          change: 'Total activos',
          changeType: 'neutral',
          icon: Users,
          color: 'bg-purple-500/10 text-purple-400'
        }
      ]

      setStats(newStats)
      setLowStockProducts(productosStockBajo.data || [])

      // Generar actividades recientes basadas en datos reales
      const activities = []
      
      // Añadir cobranzas de hoy
      cobranzasHoy.data?.slice(0, 2).forEach(cobranza => {
        activities.push({
          type: 'payment',
          description: `Pago recibido - ${cobranza.clientes?.nombre || 'Cliente'}`,
          amount: parseFloat(cobranza.monto || 0),
          time: 'Hoy'
        })
      })

      // Añadir alertas de stock bajo
      if (productosStockBajo.data?.length > 0) {
        activities.push({
          type: 'alert',
          description: `Stock bajo: ${productosStockBajo.data[0].nombre}`,
          amount: null,
          time: 'Ahora'
        })
      }

      // Completar con actividades dummy si no hay suficientes
      while (activities.length < 4) {
        activities.push({
          type: 'sale',
          description: 'Sistema funcionando correctamente',
          amount: null,
          time: 'Activo'
        })
      }

      setRecentActivities(activities.slice(0, 4))
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Función para refrescar datos
  const handleRefresh = () => {
    loadDashboardData()
  }

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
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50",
              `bg-${theme.colors.primary}`,
              `hover:bg-${theme.colors.primaryHover}`
            )}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? 'Cargando...' : 'Actualizar'}
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
        {/* Productos con Stock Bajo */}
        <div className={cn("border rounded-xl", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className={cn("p-6 border-b flex items-center justify-between", `border-${theme.colors.border}`)}>
            <h3 className={cn("text-xl font-semibold", `text-${theme.colors.text}`)}>Productos con Stock Bajo</h3>
            <Link 
              to="/inventario"
              className={cn("text-sm font-medium flex items-center gap-1 transition-colors", `text-${theme.colors.primaryText}`, `hover:text-${theme.colors.primary}`)}
            >
              Ver inventario
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                <p className={cn("mt-2 text-sm", `text-${theme.colors.textSecondary}`)}>Cargando productos...</p>
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className={cn("h-12 w-12 mx-auto mb-4", `text-${theme.colors.textSecondary}`)} />
                <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>No hay productos con stock bajo</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className={cn("bg-opacity-50", `bg-${theme.colors.background}`)}
                >
                  <tr>
                    <th className={cn("p-4 text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>Producto</th>
                    <th className={cn("p-4 text-sm font-semibold", `text-${theme.colors.textSecondary}`)}>Stock Actual</th>
                    <th className={cn("p-4 text-sm font-semibold text-right", `text-${theme.colors.textSecondary}`)}>Precio</th>
                    <th className={cn("p-4 text-sm font-semibold text-center", `text-${theme.colors.textSecondary}`)}>Estado</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", `divide-${theme.colors.border}`)}>
                  {lowStockProducts.slice(0, 5).map((product, index) => (
                    <tr key={index} className={cn("hover:bg-opacity-30 transition-colors", `hover:bg-${theme.colors.background}`)}>
                      <td className={cn("p-4", `text-${theme.colors.text}`)}>
                        <div>
                          <p className="font-medium">{product.nombre}</p>
                          {product.proveedores && (
                            <p className={cn("text-xs", `text-${theme.colors.textSecondary}`)}>
                              Proveedor: {product.proveedores.nombre}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={cn("p-4 font-mono", `text-${theme.colors.text}`)}>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          product.stock <= 5 ? "bg-red-500/20 text-red-400" : 
                          product.stock <= 10 ? "bg-yellow-500/20 text-yellow-400" : 
                          "bg-orange-500/20 text-orange-400"
                        )}>
                          {product.stock} unidades
                        </span>
                      </td>
                      <td className={cn("p-4 text-right font-mono", `text-${theme.colors.text}`)}>
                        {formatCurrency(product.precio)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          product.stock <= 5 ? "bg-red-500/20 text-red-400" : 
                          "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {product.stock <= 5 ? 'Crítico' : 'Bajo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className={cn("font-semibold", `text-red-400`)}>Error al cargar datos</h3>
              <p className={cn("text-sm mt-1", `text-${theme.colors.textSecondary}`)}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resumen General */}
      <div className={cn("border rounded-xl", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
        <div className={cn("p-6 border-b", `border-${theme.colors.border}`)}>
          <h3 className={cn("text-xl font-semibold flex items-center gap-2", `text-${theme.colors.text}`)}>
            <Calendar className="h-5 w-5" />
            Estado del Sistema EVITA
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={cn("text-2xl font-bold mb-1", `text-${theme.colors.text}`)}>
                {lowStockProducts.length}
              </div>
              <div className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>Productos con stock bajo</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold mb-1", stats.find(s => s.name.includes('Facturas'))?.value > 0 ? 'text-orange-400' : 'text-green-400')}>
                {stats.find(s => s.name.includes('Facturas'))?.value || 0}
              </div>
              <div className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>Facturas pendientes</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold mb-1 text-blue-400")}>
                {stats.find(s => s.name.includes('Clientes'))?.value || 0}
              </div>
              <div className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>Clientes activos</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>Sistema operativo</span>
              </div>
              <div className={cn("text-xs", `text-${theme.colors.textSecondary}`)}>
                Última actualización: {loading ? 'Actualizando...' : 'Ahora'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
