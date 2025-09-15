import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCompras, createCompra, updateCompra, deleteCompra } from '../services/compras'

const KEY = ['compras']

export function useCompras() {
  const qc = useQueryClient()

  const query = useQuery({ queryKey: KEY, queryFn: listCompras })

  const addMutation = useMutation({
    mutationFn: createCompra,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => updateCompra(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCompra(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  return {
    ...query,
    addCompra: addMutation.mutateAsync,
    updateCompra: updateMutation.mutateAsync,
    deleteCompra: deleteMutation.mutateAsync,
  }
}

