import * as XLSX from 'xlsx'

export const exportToExcel = (data, sheetName = 'Sheet1', filename = 'report') => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportMultipleSheetsToExcel = (sheets, filename = 'report') => {
  const wb = XLSX.utils.book_new()
  
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })
  
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export default { exportToExcel, exportMultipleSheetsToExcel }import * as XLSX from 'xlsx'

export const exportToExcel = (data, sheetName = 'Sheet1', filename = 'report') => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportMultipleSheetsToExcel = (sheets, filename = 'report') => {
  const wb = XLSX.utils.book_new()
  
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })
  
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export default { exportToExcel, exportMultipleSheetsToExcel }