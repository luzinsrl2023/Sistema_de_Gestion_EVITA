import { useState, useEffect, useCallback } from 'react'
import {
  getEstadisticasVentas,
  getVentas,
} from '../services/ventas'
import { getClientes } from '../services/clientes'
import { getProductos, getProductosStockBajo } from '../services/productos'
import { getCobranzasDelDia } from '../services/cobranzas'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export const useDashboardData = () => {
  const [stats, setStats] = useState({
    totalRevenue: { value: 0, trend: 0 },
    newCustomers: { value: 0, trend: 0 },
    orders: { value: 0, trend: 0 },
    products: { value: 0, trend: 0 },
  })
  const [bestSellingProducts, setBestSellingProducts] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const today = new Date()
      const startDate = format(startOfMonth(today), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd')

      const [
        salesStatsData,
        customersData,
        productsData,
        ventasData,
        cobranzasData,
        lowStockData,
      ] = await Promise.all([
        getEstadisticasVentas(),
        getClientes(),
        getProductos(),
        getVentas(),
        getCobranzasDelDia(),
        getProductosStockBajo(),
      ])

      // Process stats
      const totalRevenue = salesStatsData.data?.totalMonto || 0
      const monthlySales = salesStatsData.data?.totalMes || 0
      const lastMonthSales = 0 // Placeholder for last month's sales
      const revenueTrend = lastMonthSales > 0 ? ((monthlySales - lastMonthSales) / lastMonthSales) * 100 : 100

      const allCustomers = customersData.data || []
      const newCustomers = allCustomers.filter(c => new Date(c.created_at) >= new Date(startDate)).length
      const totalCustomers = allCustomers.length
      const customerTrend = totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 100

      const totalOrders = salesStatsData.data?.cantidadVentas || 0
      const monthlyOrders = salesStatsData.data?.cantidadVentasMes || 0
      const orderTrend = totalOrders > 0 ? (monthlyOrders / totalOrders) * 100 : 0

      const totalProducts = productsData.data?.length || 0

      setStats({
        totalRevenue: { value: totalRevenue, trend: revenueTrend },
        newCustomers: { value: newCustomers, trend: customerTrend },
        orders: { value: totalOrders, trend: orderTrend },
        products: { value: totalProducts, trend: 5.4 }, // Placeholder trend
      })

      // Process best selling products
      const sales = ventasData.data || []
      const productSales = sales.reduce((acc, venta) => {
        venta.venta_detalle?.forEach(detail => {
          const product = detail.productos;
          if (product && product.id) {
            if (!acc[product.id]) {
              acc[product.id] = {
                name: product.nombre,
                category: product.categoria || 'General',
                units: 0,
                revenue: 0
              };
            }
            acc[product.id].units += detail.cantidad;
            acc[product.id].revenue += detail.cantidad * detail.precio_unitario;
          }
        });
        return acc;
      }, {});

      const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.units - a.units)
        .slice(0, 4);

      setBestSellingProducts(sortedProducts);

      // Process recent activity
      const cobranzas = (cobranzasData.data || []).map(c => ({
        person: c.clientes?.nombre || 'Cliente Anónimo',
        action: 'Pago recibido',
        amount: c.monto,
        time: format(new Date(c.created_at), 'p'),
      }))

      const ventasRecientes = (sales.slice(0, 2)).map(v => ({
        person: v.clientes?.nombre || 'Cliente Anónimo',
        action: 'Nuevo pedido',
        amount: v.total,
        time: format(new Date(v.created_at), 'p'),
      }))

      setRecentActivity([...cobranzas, ...ventasRecientes].slice(0, 4))

      // Low stock products
      setLowStockProducts(lowStockData.data || [])

    } catch (err) {
      setError(err)
      console.error("Error fetching dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return { stats, bestSellingProducts, recentActivity, lowStockProducts, loading, error, refetch: fetchDashboardData }
}