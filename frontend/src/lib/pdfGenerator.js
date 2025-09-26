import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatDate } from './utils'

// Fallback de datos de la empresa si no se proporcionan
const defaultCompanyData = {
  nombre: 'EVITA S.R.L.',
  cuit: '30-12345678-9',
  direccion: 'Av. Corrientes 1234, CABA',
  telefono: '(11) 4000-0000',
  email: 'contacto@evita.com.ar',
  website: 'www.evita.com.ar'
}

/**
 * Genera un PDF de Factura con campos fiscales.
 * @param {object} invoiceData - Datos de la factura.
 * @param {object} companyData - Datos de la empresa.
 */
export const generateInvoicePDF = (invoiceData, companyData) => {
  const doc = new jsPDF()
  const company = { ...defaultCompanyData, ...companyData }
  const primaryColor = [168, 85, 247] // purple-500
  const secondaryColor = [75, 85, 99] // gray-600
  const textColor = [17, 24, 39] // gray-900

  // --- HEADER ---
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 30, 'F')
  
  if (company.logo_url) {
    // Nota: La carga de imágenes de URL requiere configuración de CORS en Supabase Storage
    // o un proxy. Por ahora, se omite para evitar errores de 'tainted canvas'.
    // const img = new Image()
    // img.crossOrigin = "Anonymous"
    // img.src = company.logo_url
    // doc.addImage(img, 'PNG', 15, 8, 40, 15)
  }

  const invoiceTypeLabel = `FACTURA ${invoiceData.tipo_comprobante || 'B'}`
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(invoiceTypeLabel, 20, 20)
  
  doc.setFontSize(12)
  doc.text(`N° ${invoiceData.id || 'FAC-001'}`, 150, 20)

  // --- DATOS DE LA EMPRESA Y CLIENTE ---
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(company.nombre, 20, 40)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`CUIT: ${company.cuit}`, 20, 45)
  doc.text(company.direccion, 20, 50)
  
  doc.text(`Fecha: ${formatDate(invoiceData.issueDate)}`, 150, 40)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE:', 20, 75)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(invoiceData.client || 'Consumidor Final', 20, 82)
  
  // --- TABLA DE ÍTEMS ---
  const tableData = (invoiceData.items || []).map((item, index) => [
    String(index + 1),
    item.descripcion || 'Sin descripción',
    String(item.cantidad || 0),
    `$${(item.precio_unitario || 0).toFixed(2)}`,
    `$${((item.cantidad || 0) * (item.precio_unitario || 0)).toFixed(2)}`
  ])

  doc.autoTable({
    head: [['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    startY: 95,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    }
  })

  // --- TOTALES Y DESGLOSE DE IMPUESTOS ---
  let finalY = doc.lastAutoTable.finalY + 10
  const subtotal = invoiceData.subtotal || (invoiceData.items || []).reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', 140, finalY)
  doc.text(`$${subtotal.toFixed(2)}`, 175, finalY, { align: 'right' })
  finalY += 7

  if (invoiceData.desglose_impuestos) {
    for (const [taxName, taxValue] of Object.entries(invoiceData.desglose_impuestos)) {
      if (taxValue > 0) {
        const label = taxName.replace(/_/g, ' ').toUpperCase()
        doc.text(`${label}:`, 140, finalY)
        doc.text(`$${taxValue.toFixed(2)}`, 175, finalY, { align: 'right' })
        finalY += 7
      }
    }
  }

  doc.setLineWidth(0.5)
  doc.setDrawColor(...secondaryColor)
  doc.line(130, finalY - 3, 200, finalY - 3)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', 140, finalY + 5)
  doc.text(`$${(invoiceData.total || 0).toFixed(2)}`, 175, finalY + 5, { align: 'right' })

  // --- PLACEHOLDERS FISCALES ---
  finalY = Math.max(finalY + 20, 240)
  
  // Placeholder para QR
  doc.setDrawColor(...secondaryColor)
  doc.rect(20, finalY, 30, 30) // Caja para el QR
  doc.setFontSize(8)
  doc.setTextColor(...secondaryColor)
  doc.text('QR AFIP', 26, finalY + 16)
  doc.text('(Pendiente)', 25, finalY + 20)

  // Placeholders para CAE
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CAE N°:', 60, finalY + 10)
  doc.text('Vencimiento CAE:', 60, finalY + 20)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...textColor)
  doc.text(invoiceData.cae || 'N/D (Pendiente integración)', 95, finalY + 10)
  doc.text(invoiceData.cae_vencimiento ? formatDate(invoiceData.cae_vencimiento) : 'DD/MM/AAAA', 95, finalY + 20)
  
  // --- FOOTER ---
  doc.setFillColor(...primaryColor)
  doc.rect(0, 285, 210, 12, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text(`Generado por Sistema EVITA - ${new Date().toLocaleDateString('es-AR')}`, 20, 292)
  doc.text(`Página 1 de 1`, 180, 292)
  
  return doc
}

/**
 * Función genérica para descargar un PDF.
 * @param {jsPDF} doc - El documento jsPDF a guardar.
 * @param {string} filename - El nombre del archivo.
 */
export const downloadPDF = (doc, filename) => {
  try {
    doc.save(filename)
    return { success: true }
  } catch (error) {
    console.error('Error saving PDF:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Genera y descarga una factura.
 * @param {object} invoiceData - Datos de la factura.
 * @param {object} companyData - Datos de la empresa.
 */
export const generateAndDownloadInvoice = (invoiceData, companyData) => {
  try {
    const doc = generateInvoicePDF(invoiceData, companyData)
    const filename = `factura-${invoiceData.tipo_comprobante}-${invoiceData.id || 'NUEVA'}.pdf`
    return downloadPDF(doc, filename)
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return { success: false, error: error.message }
  }
}

// Se mantienen las otras funciones de generación de PDF por si se necesitan,
// pero habría que refactorizarlas de forma similar para que acepten companyData.

export default {
  generateInvoicePDF,
  generateAndDownloadInvoice,
  downloadPDF
}