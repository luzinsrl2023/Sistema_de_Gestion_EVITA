import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listRecibos, createRecibo } from '../services/recibos'

const KEY = ['recibos']

export function useRecibos() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: KEY, queryFn: listRecibos })

  const add = useMutation({ mutationFn: createRecibo, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) })

  return {
    ...query,
    addRecibo: add.mutateAsync,
  }
}

