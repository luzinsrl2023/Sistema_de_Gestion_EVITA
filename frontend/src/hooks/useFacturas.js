import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listFacturas, createFactura, updateFactura, deleteFactura } from '../services/facturas'

const KEY = ['facturas']

export function useFacturas() {
  const qc = useQueryClient()

  const query = useQuery({ queryKey: KEY, queryFn: listFacturas })

  const addMutation = useMutation({
    mutationFn: createFactura,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => updateFactura(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFactura(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  return {
    ...query,
    addFactura: addMutation.mutateAsync,
    updateFactura: updateMutation.mutateAsync,
    deleteFactura: deleteMutation.mutateAsync,
  }
}

