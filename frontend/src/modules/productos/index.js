// Lazy loading for the productos module
import { lazy } from 'react'

const ProductosList = lazy(() => import('./ProductosList'))
const ProductoForm = lazy(() => import('./ProductoForm'))

export { ProductosList, ProductoForm }