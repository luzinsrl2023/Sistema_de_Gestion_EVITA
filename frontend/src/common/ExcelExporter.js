import * as XLSX from 'xlsx'

export function exportToExcel({ filename = 'reporte.xlsx', sheetName = 'Datos', data = [] }) {
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, filename)
  } catch (e) {
    console.error('Error exportando a Excel:', e)
    throw e
  }
}

export function exportMultipleSheetsToExcel({ filename = 'reporte.xlsx', sheets = [] }) {
  try {
    const wb = XLSX.utils.book_new()
    sheets.forEach(({ sheetName = 'Hoja', data = [] }) => {
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    XLSX.writeFile(wb, filename)
  } catch (e) {
    console.error('Error exportando multi-hoja a Excel:', e)
    throw e
  }
}
