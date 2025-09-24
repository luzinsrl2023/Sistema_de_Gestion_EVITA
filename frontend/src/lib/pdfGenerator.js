import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Configuración de empresa por defecto
const getCompanyInfo = () => {
  return {
    name: localStorage.getItem('evita-company-name') || 'EVITA S.R.L.',
    cuit: localStorage.getItem('evita-company-cuit') || '30-12345678-9',
    address: localStorage.getItem('evita-company-address') || 'Av. Corrientes 1234, CABA',
    phone: localStorage.getItem('evita-company-phone') || '(11) 4000-0000',
    email: localStorage.getItem('evita-company-email') || 'contacto@evita.com.ar',
    website: localStorage.getItem('evita-company-website') || 'www.evita.com.ar'
  }
}

// Generar PDF de Orden de Compra
export const generatePurchaseOrderPDF = (orderData) => {
  const doc = new jsPDF()
  const company = getCompanyInfo()
  
  // Configuración de colores
  const primaryColor = [34, 197, 94] // green-500
  const secondaryColor = [75, 85, 99] // gray-600
  const textColor = [17, 24, 39] // gray-900
  
  // Header con logo y datos de empresa
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 30, 'F')
  
  // Título principal
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDEN DE COMPRA', 20, 20)
  
  // Número de orden
  doc.setFontSize(12)
  doc.text(`N° ${orderData.number || 'OC-001'}`, 150, 20)
  
  // Información de la empresa
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name, 20, 40)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`CUIT: ${company.cuit}`, 20, 45)
  doc.text(company.address, 20, 50)
  doc.text(`Tel: ${company.phone}`, 20, 55)
  doc.text(company.email, 20, 60)
  
  // Fecha
  const currentDate = new Date().toLocaleDateString('es-AR')
  doc.text(`Fecha: ${orderData.date || currentDate}`, 150, 40)
  
  // Información del proveedor
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PROVEEDOR:', 20, 75)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(orderData.supplier?.name || 'Proveedor sin especificar', 20, 82)
  doc.text(`CUIT: ${orderData.supplier?.cuit || 'N/A'}`, 20, 87)
  doc.text(orderData.supplier?.address || 'Dirección no especificada', 20, 92)
  doc.text(`Tel: ${orderData.supplier?.phone || 'N/A'}`, 20, 97)
  
  // Estado de la orden
  if (orderData.status) {
    const statusColor = orderData.status === 'approved' ? [34, 197, 94] : 
                       orderData.status === 'pending' ? [251, 191, 36] : [239, 68, 68]
    
    doc.setFillColor(...statusColor)
    doc.roundedRect(150, 75, 40, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    const statusText = orderData.status === 'approved' ? 'APROBADA' :
                      orderData.status === 'pending' ? 'PENDIENTE' : 'RECHAZADA'
    doc.text(statusText, 152, 81)
  }
  
  // Tabla de productos
  const tableData = (orderData.items || []).map((item, index) => [
    String(index + 1),
    item.code || item.sku || 'N/A',
    item.name || item.description || 'Sin descripción',
    String(item.quantity || 0),
    item.unit || 'UN',
    `$${(item.unitPrice || 0).toFixed(2)}`,
    `$${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}`
  ])
  
  // Configurar tabla
  doc.autoTable({
    head: [['#', 'Código', 'Descripción', 'Cant.', 'Unidad', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    startY: 110,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 70 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  })
  
  // Totales
  const finalY = doc.lastAutoTable.finalY + 10
  const subtotal = (orderData.items || []).reduce((sum, item) => 
    sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0
  )
  const tax = subtotal * 0.21 // IVA 21%
  const total = subtotal + tax
  
  // Línea de separación
  doc.setLineWidth(0.5)
  doc.setDrawColor(...secondaryColor)
  doc.line(130, finalY, 190, finalY)
  
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', 140, finalY + 8)
  doc.text(`$${subtotal.toFixed(2)}`, 175, finalY + 8)
  
  doc.text('IVA (21%):', 140, finalY + 15)
  doc.text(`$${tax.toFixed(2)}`, 175, finalY + 15)
  
  // Total con destaque
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', 140, finalY + 25)
  doc.text(`$${total.toFixed(2)}`, 175, finalY + 25)
  
  // Notas
  if (orderData.notes) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVACIONES:', 20, finalY + 15)
    
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(orderData.notes, 170)
    doc.text(splitNotes, 20, finalY + 22)
  }
  
  // Términos y condiciones
  const termsY = Math.max(finalY + 40, 240)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  
  const terms = [
    '• Los precios son válidos por 30 días desde la fecha de emisión.',
    '• Forma de pago: Según condiciones acordadas con el proveedor.',
    '• Los productos deben cumplir con las especificaciones técnicas requeridas.',
    '• Tiempo de entrega: Según lo acordado en la negociación.'
  ]
  
  terms.forEach((term, index) => {
    doc.text(term, 20, termsY + (index * 4))
  })
  
  // Footer
  doc.setFillColor(...primaryColor)
  doc.rect(0, 285, 210, 12, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text(`Generado por Sistema EVITA - ${currentDate}`, 20, 292)
  doc.text(`Página 1 de 1`, 170, 292)
  
  return doc
}

// Generar PDF de Cotización
export const generateQuotePDF = (quoteData) => {
  const doc = new jsPDF()
  const company = getCompanyInfo()
  
  // Similar estructura pero adaptada para cotizaciones
  doc.setFillColor(59, 130, 246) // blue-500 para cotizaciones
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('COTIZACIÓN', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`N° ${quoteData.number || 'COT-001'}`, 150, 20)
  
  // Resto de la implementación similar a la orden de compra
  // pero adaptada para cotizaciones...
  
  return doc
}

// Generar PDF de Factura
export const generateInvoicePDF = (invoiceData) => {
  const doc = new jsPDF()
  const company = getCompanyInfo()
  
  // Header específico para facturas
  doc.setFillColor(168, 85, 247) // purple-500 para facturas
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA', 20, 20)
  
  // Implementación específica para facturas...
  
  return doc
}

// Función genérica para descargar PDF
export const downloadPDF = (doc, filename) => {
  try {
    doc.save(filename)
    return { success: true }
  } catch (error) {
    console.error('Error generating PDF:', error)
    return { success: false, error: error.message }
  }
}

// Función helper para generar y descargar orden de compra
export const generateAndDownloadPurchaseOrder = (orderData) => {
  try {
    const doc = generatePurchaseOrderPDF(orderData)
    const filename = `orden-compra-${orderData.number || 'OC-001'}-${new Date().toISOString().split('T')[0]}.pdf`
    return downloadPDF(doc, filename)
  } catch (error) {
    console.error('Error generating purchase order PDF:', error)
    return { success: false, error: error.message }
  }
}

// Función helper para generar y descargar cotización
export const generateAndDownloadQuote = (quoteData) => {
  try {
    const doc = generateQuotePDF(quoteData)
    const filename = `cotizacion-${quoteData.number || 'COT-001'}-${new Date().toISOString().split('T')[0]}.pdf`
    return downloadPDF(doc, filename)
  } catch (error) {
    console.error('Error generating quote PDF:', error)
    return { success: false, error: error.message }
  }
}

// Función helper para generar y descargar factura
export const generateAndDownloadInvoice = (invoiceData) => {
  try {
    const doc = generateInvoicePDF(invoiceData)
    const filename = `factura-${invoiceData.number || 'FAC-001'}-${new Date().toISOString().split('T')[0]}.pdf`
    return downloadPDF(doc, filename)
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return { success: false, error: error.message }
  }
}

export default {
  generatePurchaseOrderPDF,
  generateQuotePDF,
  generateInvoicePDF,
  generateAndDownloadPurchaseOrder,
  generateAndDownloadQuote,
  generateAndDownloadInvoice,
  downloadPDF
}