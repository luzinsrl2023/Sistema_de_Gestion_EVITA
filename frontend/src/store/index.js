// Store index - Export all stores
export { default as useFacturasStore } from './useFacturasStore'
export { default as useCobranzasStore } from './useCobranzasStore'
export { default as useReportesStore } from './useReportesStore'

// You can also export all stores in a single object if needed
export const stores = {
  useFacturasStore,
  useCobranzasStore,
  useReportesStore
}