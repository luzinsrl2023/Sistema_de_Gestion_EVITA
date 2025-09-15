import { create } from 'zustand'

export const useCobranzasStore = create((set, get) => ({
  cobranzas: [],
  loading: false,
  error: null,
  setCobranzas: (cobranzas) => set({ cobranzas }),
  addCobranza: (c) => set({ cobranzas: [...get().cobranzas, c] }),
  updateCobranza: (id, patch) => set({ cobranzas: get().cobranzas.map(i => i.id === id ? { ...i, ...patch } : i) }),
  removeCobranza: (id) => set({ cobranzas: get().cobranzas.filter(i => i.id !== id) }),
}))

