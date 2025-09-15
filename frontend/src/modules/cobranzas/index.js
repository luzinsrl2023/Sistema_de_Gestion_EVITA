// Lazy loading for the cobranzas module
import { lazy } from 'react'

const CuentasCorrientes = lazy(() => import('./CuentasCorrientes'))
const ComposicionSaldos = lazy(() => import('./ComposicionSaldos'))
const CobranzaForm = lazy(() => import('./CobranzaForm'))
const RecibosList = lazy(() => import('./RecibosList'))

export { CuentasCorrientes, ComposicionSaldos, CobranzaForm, RecibosList }