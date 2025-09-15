// Lazy loading for the clientes module
import { lazy } from 'react'

const ClientesList = lazy(() => import('./ClientesList'))
const ClienteForm = lazy(() => import('./ClienteForm'))

export { ClientesList, ClienteForm }