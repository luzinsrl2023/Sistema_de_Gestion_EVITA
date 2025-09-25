// Lazy loading for the productos module with error handling
import { lazy } from 'react'

const ProductosList = lazy(() => 
  import('./ProductosList')
    .catch(() => import('../common/ErrorComponent'))
    .then(module => module)
    .catch(() => ({ default: () => <div className="p-4 text-center text-red-500">Error al cargar ProductosList</div> }))
)

const ProductoForm = lazy(() => 
  import('./ProductoForm')
    .catch(() => import('../common/ErrorComponent'))
    .then(module => module)
    .catch(() => ({ default: () => <div className="p-4 text-center text-red-500">Error al cargar ProductoForm</div> }))
)

export { ProductosList, ProductoForm }