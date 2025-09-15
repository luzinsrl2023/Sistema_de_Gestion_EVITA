import { create } from 'zustand'

export const useFacturasStore = create((set, get) => ({
  facturas: [],
  loading: false,
  error: null,
  setFacturas: (facturas) => set({ facturas }),
  addFactura: (f) => set({ facturas: [...get().facturas, f] }),
  updateFactura: (id, patch) => set({ facturas: get().facturas.map(i => i.id === id ? { ...i, ...patch } : i) }),
  removeFactura: (id) => set({ facturas: get().facturas.filter(i => i.id !== id) }),
}))

