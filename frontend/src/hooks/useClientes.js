import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listClientes, createCliente, updateCliente, deleteCliente } from '../services/clientes'

const KEY = ['clientes']

export function useClientes() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: KEY, queryFn: listClientes })

  const add = useMutation({ mutationFn: createCliente, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) })
  const upd = useMutation({ mutationFn: ({ id, patch }) => updateCliente(id, patch), onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) })
  const del = useMutation({ mutationFn: deleteCliente, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) })

  return {
    ...query,
    addCliente: add.mutateAsync,
    updateCliente: upd.mutateAsync,
    removeCliente: del.mutateAsync,
  }
}

