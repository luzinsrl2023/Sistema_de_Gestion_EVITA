import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCotizaciones, createCotizacion, updateCotizacion, deleteCotizacion } from '../services/cotizaciones'

const KEY = ['cotizaciones']

export function useCotizaciones() {
  const qc = useQueryClient()

  const query = useQuery({ queryKey: KEY, queryFn: listCotizaciones })

  const addMutation = useMutation({
    mutationFn: createCotizacion,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => updateCotizacion(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCotizacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })

  return {
    ...query,
    addCotizacion: addMutation.mutateAsync,
    updateCotizacion: updateMutation.mutateAsync,
    deleteCotizacion: deleteMutation.mutateAsync,
  }
}

