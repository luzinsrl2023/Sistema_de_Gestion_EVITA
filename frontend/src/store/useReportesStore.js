import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useReportesStore = create(devtools((set, get) => ({
  // Reportes state
  ventasData: [],
  comprasData: [],
  stockData: [],
  dashboardData: null,
  loading: false,
  error: null,
  
  // Report filters
  reportFilters: {
    periodo: 'mensual',
    rangoFechas: {
      inicio: null,
      fin: null
    },
    categoria: 'todas'
  },
  
  // Dashboard filters
  dashboardFilters: {
    periodo: 'mensual',
    compararCon: 'anterior'
  },
  
  // UI state
  activeTab: 'dashboard',
  showExportModal: false,
  
  // Actions
  setVentasData: (data) => set({ ventasData: data }),
  setComprasData: (data) => set({ comprasData: data }),
  setStockData: (data) => set({ stockData: data }),
  setDashboardData: (data) => set({ dashboardData: data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Filter actions
  setReportFilters: (filters) => set({ reportFilters: { ...get().reportFilters, ...filters } }),
  setDashboardFilters: (filters) => set({ dashboardFilters: { ...get().dashboardFilters, ...filters } }),
  
  // UI actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowExportModal: (show) => set({ showExportModal: show }),
  
  // Reset actions
  resetReportFilters: () => set({ 
    reportFilters: {
      periodo: 'mensual',
      rangoFechas: {
        inicio: null,
        fin: null
      },
      categoria: 'todas'
    }
  }),
  
  // Data fetching operations (mock)
  fetchVentasReport: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const data = await new Promise(resolve => 
        setTimeout(() => resolve([
          { mes: 'Ene', ventas: 12500, facturas: 45 },
          { mes: 'Feb', ventas: 15200, facturas: 52 },
          { mes: 'Mar', ventas: 18700, facturas: 61 },
          { mes: 'Abr', ventas: 14300, facturas: 48 },
          { mes: 'May', ventas: 19800, facturas: 67 },
          { mes: 'Jun', ventas: 21500, facturas: 72 }
        ]), 500)
      )
      
      set({ ventasData: data, loading: false })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  fetchComprasReport: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const data = await new Promise(resolve => 
        setTimeout(() => resolve([
          { mes: 'Ene', compras: 8500, ordenes: 32 },
          { mes: 'Feb', compras: 9200, ordenes: 35 },
          { mes: 'Mar', compras: 11700, ordenes: 41 },
          { mes: 'Abr', compras: 9300, ordenes: 34 },
          { mes: 'May', compras: 12800, ordenes: 47 },
          { mes: 'Jun', compras: 14500, ordenes: 52 }
        ]), 500)
      )
      
      set({ comprasData: data, loading: false })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  fetchStockReport: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const data = await new Promise(resolve => 
        setTimeout(() => resolve([
          { producto: 'Limpiador Multiuso EVITA Pro', categoria: 'Limpieza', stock: 150, minStock: 50, valor: 898.50 },
          { producto: 'Jabón Líquido para Manos EVITA', categoria: 'Limpieza', stock: 20, minStock: 50, valor: 79.80 },
          { producto: 'Desinfectante Antibacterial EVITA', categoria: 'Limpieza', stock: 120, minStock: 30, valor: 1078.80 },
          { producto: 'Papel Higiénico Suave 4 Rollos', categoria: 'Artículos Generales', stock: 300, minStock: 150, valor: 897.00 }
        ]), 500)
      )
      
      set({ stockData: data, loading: false })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  fetchDashboardReport: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      // Mock API call
      const data = await new Promise(resolve => 
        setTimeout(() => resolve({
          resumen: {
            ventasTotales: 125430,
            comprasTotales: 87560,
            margenBeneficio: 37870,
            clientesNuevos: 142
          },
          tendencias: {
            ventas: [
              { fecha: '2025-09-01', valor: 1250 },
              { fecha: '2025-09-02', valor: 1875 },
              { fecha: '2025-09-03', valor: 980 },
              { fecha: '2025-09-04', valor: 2100 },
              { fecha: '2025-09-05', valor: 1560 }
            ],
            compras: [
              { fecha: '2025-09-01', valor: 850 },
              { fecha: '2025-09-02', valor: 1200 },
              { fecha: '2025-09-03', valor: 650 },
              { fecha: '2025-09-04', valor: 1500 },
              { fecha: '2025-09-05', valor: 980 }
            ]
          },
          topProductos: [
            { id: 1, nombre: 'Limpiador Multiuso EVITA Pro', ventas: 1240, ingresos: 7440 },
            { id: 2, nombre: 'Jabón Líquido para Manos EVITA', ventas: 980, ingresos: 3920 },
            { id: 3, nombre: 'Desinfectante Antibacterial EVITA', ventas: 756, ingresos: 6790 }
          ]
        }), 500)
      )
      
      set({ dashboardData: data, loading: false })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
})))

export default useReportesStore