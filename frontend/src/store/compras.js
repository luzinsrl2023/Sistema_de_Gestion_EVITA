import { create } from 'zustand'

export const useComprasStore = create((set, get) => ({
  ordenes: [],
  loading: false,
  error: null,
  setOrdenes: (ordenes) => set({ ordenes }),
  addOrden: (o) => set({ ordenes: [...get().ordenes, o] }),
  updateOrden: (id, patch) => set({ ordenes: get().ordenes.map(i => i.id === id ? { ...i, ...patch } : i) }),
  removeOrden: (id) => set({ ordenes: get().ordenes.filter(i => i.id !== id) }),
}))

