import { create } from 'zustand'

export const useProveedoresStore = create((set, get) => ({
  proveedores: [],
  loading: false,
  error: null,
  setProveedores: (proveedores) => set({ proveedores }),
  addProveedor: (p) => set({ proveedores: [...get().proveedores, p] }),
  updateProveedor: (id, patch) => set({ proveedores: get().proveedores.map(i => i.id === id ? { ...i, ...patch } : i) }),
  removeProveedor: (id) => set({ proveedores: get().proveedores.filter(i => i.id !== id) }),
}))

