import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useCobranzasStore = create(devtools((set, get) => ({
  // Cobranzas state
  cuentasCorrientes: [],
  cuentaCorriente: null,
  composicionesSaldos: [],
  loading: false,
  error: null,
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  totalCuentas: 0,
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
  showComposicion: false,
  selectedCuentaId: null,
  
  // Actions
  setCuentasCorrientes: (cuentas) => set({ cuentasCorrientes: cuentas }),
  setCuentaCorriente: (cuenta) => set({ cuentaCorriente: cuenta }),
  setComposicionesSaldos: (composiciones) => set({ composicionesSaldos: composiciones }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Pagination actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setTotalCuentas: (total) => set({ totalCuentas: total }),
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
  setShowComposicion: (show) => set({ showComposicion: show }),
  setSelectedCuentaId: (id) => set({ selectedCuentaId: id }),
  
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
    showComposicion: false,
    selectedCuentaId: null
  }),
  
  // CRUD operations (mock)
  fetchCuentasCorrientes: async () => {
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
              saldoTotal: 1250.00,
              saldoVencido: 500.00,
              ultimaCompra: '2025-09-01',
              ultimaPago: '2025-08-25',
              status: 'activo',
              detalles: [
                { id: 1, factura: 'FAC-001', fecha: '2025-09-01', vencimiento: '2025-09-15', monto: 500.00, saldo: 500.00, status: 'pendiente' },
                { id: 2, factura: 'FAC-002', fecha: '2025-08-20', vencimiento: '2025-09-03', monto: 750.00, saldo: 0.00, status: 'pagado' }
              ]
            },
            {
              id: 2,
              clienteId: 2,
              clienteNombre: 'María Gómez',
              saldoTotal: 875.50,
              saldoVencido: 0.00,
              ultimaCompra: '2025-09-05',
              ultimaPago: '2025-09-05',
              status: 'activo',
              detalles: [
                { id: 3, factura: 'FAC-003', fecha: '2025-09-05', vencimiento: '2025-09-19', monto: 875.50, saldo: 875.50, status: 'pendiente' }
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
        cuentasCorrientes: response.data,
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalCuentas: response.pagination.totalItems,
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  fetchCuentaCorriente: async (id) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const cuenta = await new Promise(resolve => 
        setTimeout(() => resolve({
          id,
          clienteId: 1,
          clienteNombre: 'Juan Pérez',
          saldoTotal: 1250.00,
          saldoVencido: 500.00,
          ultimaCompra: '2025-09-01',
          ultimaPago: '2025-08-25',
          status: 'activo',
          detalles: [
            { id: 1, factura: 'FAC-001', fecha: '2025-09-01', vencimiento: '2025-09-15', monto: 500.00, saldo: 500.00, status: 'pendiente' },
            { id: 2, factura: 'FAC-002', fecha: '2025-08-20', vencimiento: '2025-09-03', monto: 750.00, saldo: 0.00, status: 'pagado' }
          ]
        }), 500)
      )
      
      set({ cuentaCorriente: cuenta, loading: false })
      return cuenta
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  registrarPago: async (pagoData) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const nuevoPago = await new Promise(resolve => 
        setTimeout(() => resolve({
          id: Date.now(),
          ...pagoData,
          fecha: new Date().toISOString().split('T')[0],
          status: 'registrado'
        }), 500)
      )
      
      // Update cuenta corriente
      set(state => {
        const updatedCuentas = state.cuentasCorrientes.map(cuenta => {
          if (cuenta.id === pagoData.cuentaId) {
            return {
              ...cuenta,
              saldoTotal: cuenta.saldoTotal - pagoData.monto,
              saldoVencido: cuenta.saldoVencido - (pagoData.monto > cuenta.saldoVencido ? cuenta.saldoVencido : pagoData.monto)
            }
          }
          return cuenta
        })
        
        return {
          cuentasCorrientes: updatedCuentas,
          cuentaCorriente: state.cuentaCorriente?.id === pagoData.cuentaId ? {
            ...state.cuentaCorriente,
            saldoTotal: state.cuentaCorriente.saldoTotal - pagoData.monto,
            saldoVencido: state.cuentaCorriente.saldoVencido - (pagoData.monto > state.cuentaCorriente.saldoVencido ? state.cuentaCorriente.saldoVencido : pagoData.monto)
          } : state.cuentaCorriente,
          loading: false,
          showForm: false
        }
      })
      
      return nuevoPago
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  generarComposicionSaldos: async (cuentaId) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const composicion = await new Promise(resolve => 
        setTimeout(() => resolve({
          id: Date.now(),
          cuentaId,
          fecha: new Date().toISOString().split('T')[0],
          clienteNombre: 'Juan Pérez',
          saldoTotal: 1250.00,
          detalles: [
            { factura: 'FAC-001', fecha: '2025-09-01', vencimiento: '2025-09-15', diasVencidos: 0, monto: 500.00, saldo: 500.00 },
            { factura: 'FAC-002', fecha: '2025-08-20', vencimiento: '2025-09-03', diasVencidos: 12, monto: 750.00, saldo: 0.00 }
          ]
        }), 500)
      )
      
      set(state => ({
        composicionesSaldos: [...state.composicionesSaldos, composicion],
        loading: false,
        showComposicion: true
      }))
      
      return composicion
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
})))

export default useCobranzasStore