import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listProductos, upsertProducto, deleteProducto } from '../services/productos'

const KEY = ['productos']

export function useProductos() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: KEY, queryFn: listProductos })

  const upsert = useMutation({
    mutationFn: upsertProducto,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
  const del = useMutation({
    mutationFn: deleteProducto,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  return {
    ...query,
    saveProducto: upsert.mutateAsync,
    removeProducto: del.mutateAsync,
  }
}

