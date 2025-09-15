import { create } from 'zustand'

export const useReportesStore = create((set, get) => ({
  filtros: {},
  setFiltro: (k, v) => set({ filtros: { ...get().filtros, [k]: v } }),
  clearFiltros: () => set({ filtros: {} }),
}))

