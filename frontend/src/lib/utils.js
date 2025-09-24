import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

export const formatDate = (date) => {
  try {
    if (!date || date === null || date === undefined) return 'Sin fecha'
    
    // Handle empty strings or whitespace
    if (typeof date === 'string' && date.trim() === '') return 'Sin fecha'
    
    // Convert to string if it's not already
    const dateStr = String(date)
    
    // Check if it's already a valid ISO string or timestamp
    let parsedDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // YYYY-MM-DD format
      parsedDate = new Date(dateStr + 'T00:00:00.000Z')
    } else if (!isNaN(Date.parse(dateStr))) {
      parsedDate = new Date(dateStr)
    } else {
      return 'Fecha inválida'
    }
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return 'Fecha inválida'
    }
    
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(parsedDate)
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return 'Fecha inválida'
  }
}

export const getStatusColor = (status) => {
  const colors = {
    'pagado': 'bg-green-500/10 text-green-400',
    'pendiente': 'bg-yellow-500/10 text-yellow-400',
    'vencido': 'bg-red-500/10 text-red-400',
    'activo': 'bg-green-500/10 text-green-400',
    'inactivo': 'bg-gray-500/10 text-gray-400',
    'bajo': 'bg-red-500/10 text-red-400',
    'medio': 'bg-yellow-500/10 text-yellow-400',
    'alto': 'bg-green-500/10 text-green-400',
  }
  return colors[status?.toLowerCase()] || 'bg-gray-500/10 text-gray-400'
}

// CSV Export Utilities
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header] || ''
        // Escape commas and quotes
        if (cell.toString().includes(',') || cell.toString().includes('"')) {
          cell = `"${cell.toString().replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Import CSV functionality
export const importFromCSV = (file, callback) => {
  if (!file) {
    alert('Por favor seleccione un archivo')
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const csvData = event.target.result
      const lines = csvData.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = lines.slice(1)
        .filter(line => line.trim()) // Remove empty lines
        .map(line => {
          const values = line.split(',').map(v => v.trim())
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          return obj
        })
      
      callback(data)
    } catch (error) {
      alert('Error al procesar el archivo CSV')
      console.error('CSV Import Error:', error)
    }
  }
  
  reader.readAsText(file)
}