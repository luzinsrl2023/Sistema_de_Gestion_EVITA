import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load all modules
const { Dashboard } = await import('../modules/dashboard')
const { ProductosList, ProductoForm } = await import('../modules/productos')
const { ClientesList, ClienteForm } = await import('../modules/clientes')
const { ProveedoresList } = await import('../modules/proveedores')
const { OrdenesList, OrdenForm } = await import('../modules/compras')
const { FacturasList, FacturaForm, FacturaView } = await import('../modules/facturas')
const { CuentasCorrientes, ComposicionSaldos, CobranzaForm } = await import('../modules/cobranzas')
const { VentasReport, ComprasReport, StockReport, DashboardReport } = await import('../modules/reportes')

// Loading component for Suspense
const LoadingComponent = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
  </div>
)

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Productos */}
        <Route path="/productos" element={<ProductosList />} />
        <Route path="/productos/nuevo" element={<ProductoForm />} />
        <Route path="/productos/:id/editar" element={<ProductoForm />} />
        
        {/* Clientes */}
        <Route path="/clientes" element={<ClientesList />} />
        <Route path="/clientes/nuevo" element={<ClienteForm />} />
        <Route path="/clientes/:id/editar" element={<ClienteForm />} />
        
        {/* Proveedores */}
        <Route path="/proveedores" element={<ProveedoresList />} />
        
        {/* Compras */}
        <Route path="/compras" element={<OrdenesList />} />
        <Route path="/compras/nueva" element={<OrdenForm />} />
        <Route path="/compras/:id/editar" element={<OrdenForm />} />
        
        {/* Facturas */}
        <Route path="/facturas" element={<FacturasList />} />
        <Route path="/facturas/nueva" element={<FacturaForm />} />
        <Route path="/facturas/:id" element={<FacturaView />} />
        <Route path="/facturas/:id/editar" element={<FacturaForm />} />
        
        {/* Cobranzas */}
        <Route path="/cobranzas/cuentas-corrientes" element={<CuentasCorrientes />} />
        <Route path="/cobranzas/composicion-saldos/:id" element={<ComposicionSaldos />} />
        <Route path="/cobranzas/pagos/:id" element={<CobranzaForm />} />
        
        {/* Reportes */}
        <Route path="/reportes/dashboard" element={<DashboardReport />} />
        <Route path="/reportes/ventas" element={<VentasReport />} />
        <Route path="/reportes/compras" element={<ComprasReport />} />
        <Route path="/reportes/stock" element={<StockReport />} />
      </Routes>
    </Suspense>
  )
}import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load all modules
const { Dashboard } = await import('../modules/dashboard')
const { ProductosList, ProductoForm } = await import('../modules/productos')
const { ClientesList, ClienteForm } = await import('../modules/clientes')
const { ProveedoresList } = await import('../modules/proveedores')
const { OrdenesList, OrdenForm } = await import('../modules/compras')
const { FacturasList, FacturaForm, FacturaView } = await import('../modules/facturas')
const { CuentasCorrientes, ComposicionSaldos, CobranzaForm } = await import('../modules/cobranzas')
const { VentasReport, ComprasReport, StockReport, DashboardReport } = await import('../modules/reportes')

// Loading component for Suspense
const LoadingComponent = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
  </div>
)

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Productos */}
        <Route path="/productos" element={<ProductosList />} />
        <Route path="/productos/nuevo" element={<ProductoForm />} />
        <Route path="/productos/:id/editar" element={<ProductoForm />} />
        
        {/* Clientes */}
        <Route path="/clientes" element={<ClientesList />} />
        <Route path="/clientes/nuevo" element={<ClienteForm />} />
        <Route path="/clientes/:id/editar" element={<ClienteForm />} />
        
        {/* Proveedores */}
        <Route path="/proveedores" element={<ProveedoresList />} />
        
        {/* Compras */}
        <Route path="/compras" element={<OrdenesList />} />
        <Route path="/compras/nueva" element={<OrdenForm />} />
        <Route path="/compras/:id/editar" element={<OrdenForm />} />
        
        {/* Facturas */}
        <Route path="/facturas" element={<FacturasList />} />
        <Route path="/facturas/nueva" element={<FacturaForm />} />
        <Route path="/facturas/:id" element={<FacturaView />} />
        <Route path="/facturas/:id/editar" element={<FacturaForm />} />
        
        {/* Cobranzas */}
        <Route path="/cobranzas/cuentas-corrientes" element={<CuentasCorrientes />} />
        <Route path="/cobranzas/composicion-saldos/:id" element={<ComposicionSaldos />} />
        <Route path="/cobranzas/pagos/:id" element={<CobranzaForm />} />
        
        {/* Reportes */}
        <Route path="/reportes/dashboard" element={<DashboardReport />} />
        <Route path="/reportes/ventas" element={<VentasReport />} />
        <Route path="/reportes/compras" element={<ComprasReport />} />
        <Route path="/reportes/stock" element={<StockReport />} />
      </Routes>
    </Suspense>
  )
}