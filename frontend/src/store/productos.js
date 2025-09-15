import { create } from 'zustand'

export const useProductosStore = create((set, get) => ({
  productos: [],
  loading: false,
  error: null,
  setProductos: (productos) => set({ productos }),
  addProducto: (p) => set({ productos: [...get().productos, p] }),
  updateProducto: (id, patch) => set({ productos: get().productos.map(i => i.id === id ? { ...i, ...patch } : i) }),
  removeProducto: (id) => set({ productos: get().productos.filter(i => i.id !== id) }),
}))

