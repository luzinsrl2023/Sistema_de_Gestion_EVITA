import { create } from 'zustand'

export const useClientesStore = create((set, get) => ({
  clientes: [],
  loading: false,
  error: null,
  setClientes: (clientes) => set({ clientes }),
  addCliente: (c) => set({ clientes: [...get().clientes, c] }),
  updateCliente: (id, patch) => set({ clientes: get().clientes.map(i => i.id === id ? { ...i, ...patch } : i) }),
  removeCliente: (id) => set({ clientes: get().clientes.filter(i => i.id !== id) }),
}))

