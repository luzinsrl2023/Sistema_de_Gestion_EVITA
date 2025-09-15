import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useFacturasStore = create(devtools((set, get) => ({
  // Facturas state
  facturas: [],
  factura: null,
  loading: false,
  error: null,
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  totalFacturas: 0,
  pageSize: 10,
  
  // Filters
  filters: {
    searchTerm: '',
    status: 'all',
    dateRange: {
      start: null,
      end: null
    }
  },
  
  // Sort
  sortBy: 'createdAt',
  sortOrder: 'desc',
  
  // UI state
  showForm: false,
  showView: false,
  selectedFacturaId: null,
  
  // Actions
  setFacturas: (facturas) => set({ facturas }),
  setFactura: (factura) => set({ factura }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Pagination actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setTotalFacturas: (total) => set({ totalFacturas: total }),
  setPageSize: (size) => set({ pageSize: size }),
  
  // Filter actions
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSearchTerm: (term) => set({ filters: { ...get().filters, searchTerm: term } }),
  setStatusFilter: (status) => set({ filters: { ...get().filters, status } }),
  setDateRange: (dateRange) => set({ filters: { ...get().filters, dateRange } }),
  
  // Sort actions
  setSortBy: (field) => set({ sortBy: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  
  // UI actions
  setShowForm: (show) => set({ showForm: show }),
  setShowView: (show) => set({ showView: show }),
  setSelectedFacturaId: (id) => set({ selectedFacturaId: id }),
  
  // Reset actions
  resetFilters: () => set({ 
    filters: {
      searchTerm: '',
      status: 'all',
      dateRange: {
        start: null,
        end: null
      }
    }
  }),
  
  resetUI: () => set({
    showForm: false,
    showView: false,
    selectedFacturaId: null
  }),
  
  // CRUD operations (mock)
  fetchFacturas: async () => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const response = await new Promise(resolve => 
        setTimeout(() => resolve({
          data: [
            {
              id: 1,
              clienteId: 1,
              clienteNombre: 'Juan Pérez',
              numero: 'FAC-001',
              fecha: '2025-09-01',
              total: 1250.00,
              status: 'pagado',
              items: [
                { id: 1, producto: 'Producto 1', cantidad: 2, precio: 500.00 },
                { id: 2, producto: 'Producto 2', cantidad: 1, precio: 250.00 }
              ]
            },
            {
              id: 2,
              clienteId: 2,
              clienteNombre: 'María Gómez',
              numero: 'FAC-002',
              fecha: '2025-09-05',
              total: 875.50,
              status: 'pendiente',
              items: [
                { id: 3, producto: 'Producto 3', cantidad: 3, precio: 291.83 }
              ]
            }
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2
          }
        }), 500)
      )
      
      set({ 
        facturas: response.data,
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalFacturas: response.pagination.totalItems,
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  createFactura: async (facturaData) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const newFactura = await new Promise(resolve => 
        setTimeout(() => resolve({
          id: Date.now(),
          ...facturaData,
          numero: `FAC-${Date.now()}`,
          fecha: new Date().toISOString().split('T')[0],
          status: 'pendiente'
        }), 500)
      )
      
      set(state => ({
        facturas: [newFactura, ...state.facturas],
        totalFacturas: state.totalFacturas + 1,
        loading: false,
        showForm: false
      }))
      
      return newFactura
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  updateFactura: async (id, facturaData) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const updatedFactura = await new Promise(resolve => 
        setTimeout(() => resolve({
          ...facturaData,
          id
        }), 500)
      )
      
      set(state => ({
        facturas: state.facturas.map(f => f.id === id ? updatedFactura : f),
        factura: state.factura?.id === id ? updatedFactura : state.factura,
        loading: false
      }))
      
      return updatedFactura
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  deleteFactura: async (id) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      set(state => ({
        facturas: state.facturas.filter(f => f.id !== id),
        totalFacturas: state.totalFacturas - 1,
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  anularFactura: async (id) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const anuladaFactura = await new Promise(resolve => 
        setTimeout(() => resolve({
          id,
          status: 'anulada'
        }), 500)
      )
      
      set(state => ({
        facturas: state.facturas.map(f => f.id === id ? { ...f, status: 'anulada' } : f),
        factura: state.factura?.id === id ? { ...state.factura, status: 'anulada' } : state.factura,
        loading: false
      }))
      
      return anuladaFactura
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
})))

export default useFacturasStore