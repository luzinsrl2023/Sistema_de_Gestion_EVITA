import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import RouteErrorBoundary from './RouteErrorBoundary'
import ModuleErrorBoundary from '../components/common/ModuleErrorBoundary'

// Import lazy components (they are already React.lazy in their index.js)
import ModularDashboard from '../modules/dashboard'
import { ProductosList } from '../modules/productos/index.jsx'
import { ClientesList } from '../modules/clientes'
import { ProveedoresList } from '../modules/proveedores'
import { OrdenesList, OrdenForm, ActualizacionProductos } from '../modules/compras'
import { FacturasList, FacturaForm, FacturaView } from '../modules/facturas'
import { CuentasCorrientes, ComposicionSaldos, CobranzaForm, RecibosList } from '../modules/cobranzas'
import { VentasReport, ComprasReport, StockReport, DashboardReport as ReportesDashboard } from '../modules/reportes'
import { Cotizaciones } from '../modules/cotizaciones'
import { Facturador } from '../modules/facturador'
import { AsientosContables, BalanceSumasYSaldos } from '../modules/contabilidad'
import CotizacionesGeneradas from '../pages/CotizacionesGeneradas'
import HistorialPrecios from '../pages/HistorialPrecios'
import PaginaProspectos from '../modules/prospectos/PaginaProspectos'
import PaginaDetalleProspecto from '../pages/PaginaDetalleProspecto'
import ConfiguracionPage from '../pages/configuracion/ConfiguracionPage'

// Loading component for Suspense
const LoadingComponent = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
      <p className="text-white text-lg">Cargando módulo...</p>
    </div>
  </div>
)

const AppRoutes = () => {
  return (
    <RouteErrorBoundary>
      <ModuleErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <Routes>
            <Route path="/" element={<Navigate to="/tablero" replace />} />

            <Route path="/tablero" element={<ModularDashboard />} />

            <Route path="/productos" element={<ProductosList />} />

            <Route path="/clientes" element={<ClientesList />} />

            <Route path="/proveedores" element={<ProveedoresList />} />

            {/* Prospectos (Leads) */}
            <Route path="/prospectos" element={<PaginaProspectos />} />
            <Route path="/prospectos/:id" element={<PaginaDetalleProspecto />} />

            {/* Ventas */}
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/cotizaciones-generadas" element={<CotizacionesGeneradas />} />
            <Route path="/facturador" element={<Facturador />} />

            {/* Compras */}
            <Route path="/compras" element={<OrdenesList />} />
            <Route path="/compras/nueva" element={<OrdenForm />} />
            <Route path="/compras/actualizacion-productos" element={<ActualizacionProductos />} />
            <Route path="/compras/historial-precios" element={<HistorialPrecios />} />

            {/* Facturacion */}
            <Route path="/facturas" element={<FacturasList />} />
            <Route path="/facturas/nueva" element={<FacturaForm />} />
            <Route path="/facturas/:id" element={<FacturaView />} />

            {/* Cobranzas */}
            <Route path="/cobranzas" element={<Navigate to="/cobranzas/cuentas-corrientes" replace />} />
            <Route path="/cobranzas/cuentas-corrientes" element={<CuentasCorrientes />} />
            <Route path="/cobranzas/recibos" element={<RecibosList />} />
            <Route path="/cobranzas/composicion-saldos/:clienteId" element={<ComposicionSaldos />} />
            <Route path="/cobranzas/pagos/:facturaId" element={<CobranzaForm />} />

            {/* Reportes */}
            <Route path="/reportes" element={<ReportesDashboard />} />
            <Route path="/reportes/ventas" element={<VentasReport />} />
            <Route path="/reportes/compras" element={<ComprasReport />} />
            <Route path="/reportes/stock" element={<StockReport />} />

            {/* Contabilidad */}
            <Route path="/contabilidad/asientos" element={<AsientosContables />} />
            <Route path="/contabilidad/balance" element={<BalanceSumasYSaldos />} />

            {/* Configuración */}
            <Route path="/configuracion" element={<ConfiguracionPage />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/tablero" replace />} />
          </Routes>
        </Suspense>
      </ModuleErrorBoundary>
    </RouteErrorBoundary>
  )
}

export default AppRoutes