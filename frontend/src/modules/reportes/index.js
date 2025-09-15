// Lazy loading for the reportes module
import { lazy } from 'react'

const VentasReport = lazy(() => import('./VentasReport'))
const ComprasReport = lazy(() => import('./ComprasReport'))
const StockReport = lazy(() => import('./StockReport'))
const DashboardReport = lazy(() => import('./DashboardReport'))

export { VentasReport, ComprasReport, StockReport, DashboardReport }
