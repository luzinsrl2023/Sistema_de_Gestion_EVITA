import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listPagos, createPago } from '../services/pagos'

const KEY = ['pagos']

export function usePagos() {
  const qc = useQueryClient()

  const query = useQuery({ queryKey: KEY, queryFn: listPagos })

  const addMutation = useMutation({
    mutationFn: createPago,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  return {
    ...query,
    addPago: addMutation.mutateAsync,
  }
}

