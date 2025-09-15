import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Estado de UI/Preferencias para Cobranzas (persistente)
export const useCobranzasStore = create(persist(
  (set) => ({
    // Filtros de la vista de cuentas corrientes
    searchTerm: '',
    statusFilter: 'all',
    selectedAccountId: null,

    setSearchTerm: (searchTerm) => set({ searchTerm }),
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  }),
  { name: 'evita:cobranzas:ui' }
))

