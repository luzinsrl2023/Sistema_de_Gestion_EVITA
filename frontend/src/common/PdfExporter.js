import pdfMake from "pdfmake/build/pdfmake.min.js";
import "pdfmake/build/vfs_fonts.js";
import { DEFAULT_LOGO_DATA_URL } from './brandAssets';


// Helpers for branding header with logo
async function loadImageAsDataURL(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('No se pudo cargar el logo para PDF:', e)
    return null
  }
}

function getCompanyInfoFromStorage() {
  try {
    const raw = localStorage.getItem('evita-company')
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return {
    name: localStorage.getItem('evita-company-name') || null,
    cuit: localStorage.getItem('evita-company-cuit') || null,
    address: localStorage.getItem('evita-company-address') || null,
    phone: localStorage.getItem('evita-company-phone') || null,
  }
}

function getStoredLogoUrl(override) {
  if (override) return override
  try {
    const stored = localStorage.getItem('evita-logo')
    return stored || DEFAULT_LOGO_DATA_URL
  } catch (_) {
    return DEFAULT_LOGO_DATA_URL
  }
}


function buildHeader(logoDataUrl, brand = 'EVITA', subtitle = 'Artículos de Limpieza') {
  const info = getCompanyInfoFromStorage()
  const brandText = (info && info.name) ? info.name : brand
  const details = [
    ...(subtitle ? [{ text: subtitle, style: 'brandSub' }] : []),
    ...(info && info.cuit ? [{ text: `CUIT: ${info.cuit}`, style: 'ts' }] : []),
    ...(info && info.address ? [{ text: `Dirección: ${info.address}`, style: 'ts' }] : []),
    ...(info && info.phone ? [{ text: `Tel: ${info.phone}`, style: 'ts' }] : []),
    { text: new Date().toLocaleString(), style: 'ts' }
  ]

  return {
    columns: [
      logoDataUrl ? { image: logoDataUrl, width: 80 } : { text: '', width: 80 },
      [
        { text: brandText, style: 'brand' },
        ...details
      ]
    ],
    columnGap: 16,
    margin: [40, 10, 40, 10]
  }
}

export async function exportTableToPDF({ title = 'Reporte', head = [], body = [], filename = 'reporte.pdf', brand = 'EVITA', subtitle = 'Artículos de Limpieza', logoUrl } = {}) {
  if (!pdfMake || !pdfMake.createPdf) {
    console.error('pdfMake is not properly initialized')
    return
  }

  const logoDataUrl = await loadImageAsDataURL(getStoredLogoUrl(logoUrl))

  const docDefinition = {
    header: buildHeader(logoDataUrl, brand, subtitle),
    content: [
      title ? { text: title, style: 'header' } : undefined,
      {
        table: {
          headerRows: 1,
          widths: head.length ? head.map(() => 'auto') : [],
          body: head.length ? [head, ...body] : body
        },
        layout: 'lightHorizontalLines'
      }
    ].filter(Boolean),
    styles: {
      brand: { fontSize: 16, bold: true },
      brandSub: { fontSize: 9, color: '#9CA3AF' },
      ts: { fontSize: 8, color: '#9CA3AF', margin: [0, 2, 0, 0] },
      header: { fontSize: 14, bold: true, margin: [0, 6, 0, 8] },
      subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 6] }
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [40, 80, 40, 40]
  }
  try { pdfMake.createPdf(docDefinition).download(filename) } catch (e) { console.warn('Fallo descarga, abriendo PDF:', e); pdfMake.createPdf(docDefinition).open() }
}

export async function exportSectionsToPDF({ title = 'Reporte', sections = [], filename = 'reporte.pdf', brand = 'EVITA', subtitle = 'Artículos de Limpieza', logoUrl } = {}) {
  // Check if pdfMake is properly initialized
  if (!pdfMake || !pdfMake.createPdf) {
    console.error('pdfMake is not properly initialized')
    return
  }

  const logoDataUrl = await loadImageAsDataURL(getStoredLogoUrl(logoUrl))


  const content = []
  if (title) content.push({ text: title, style: 'header' })
  sections.forEach(({ title: sectionTitle, head = [], body = [] }, idx) => {
    if (sectionTitle) content.push({ text: sectionTitle, style: 'subheader', margin: [0, idx === 0 ? 0 : 10, 0, 6] })
    content.push({
      table: {
        headerRows: head.length ? 1 : 0,
        widths: head.length ? head.map(() => 'auto') : [],
        body: head.length ? [head, ...body] : body
      },
      layout: 'lightHorizontalLines'
    })
  })

  const docDefinition = {
    header: buildHeader(logoDataUrl, brand, subtitle),
    content,
    styles: {
      brand: { fontSize: 16, bold: true },
      brandSub: { fontSize: 9, color: '#9CA3AF' },
      ts: { fontSize: 8, color: '#9CA3AF', margin: [0, 2, 0, 0] },
      header: { fontSize: 14, bold: true, margin: [0, 6, 0, 8] },
      subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 6] },
      label: { fontSize: 9, color: '#6B7280' },
      docTitle: { fontSize: 16, bold: true, margin: [0, 10, 0, 8] }
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [40, 80, 40, 40]
  }
  try { pdfMake.createPdf(docDefinition).download(filename) } catch (e) { console.warn('Fallo descarga, abriendo PDF:', e); pdfMake.createPdf(docDefinition).open() }
}

// Profesional: Recibo de Pago con layout de dos columnas, totales y firma
export async function exportReceiptPDF({
  tipo = 'Recibo de Pago',
  reciboId,
  fecha,
  cliente,
  facturaId,
  metodo,
  importe,
  saldo = null,
  manual = false,
  filename = `recibo-${facturaId || reciboId}.pdf`,
  brand = 'EVITA',
  subtitle = 'Comprobante',
  logoUrl
} = {}) {
  const logoDataUrl = await loadImageAsDataURL(getStoredLogoUrl(logoUrl))
  const title = manual ? `${tipo} (Manual)` : tipo

  const docDefinition = {
    header: buildHeader(logoDataUrl, brand, subtitle),
    content: [
      { text: title, style: 'docTitle' },
      {
        columns: [
          [
            { text: 'Cliente', style: 'label' },
            { text: cliente || '-', margin: [0, 2, 0, 8] },
            { text: 'Factura', style: 'label' },
            { text: String(facturaId || '-'), margin: [0, 2, 0, 8] },
          ],
          [
            { text: 'Recibo', style: 'label' },
            { text: reciboId, margin: [0, 2, 0, 8] },
            { text: 'Fecha', style: 'label' },
            { text: fecha, margin: [0, 2, 0, 8] },
          ],
        ],
        columnGap: 40,
        margin: [0,0,0,10]
      },
      {
        table: {
          widths: ['*','auto'],
          body: [
            [{ text: 'Método de pago', style: 'label' }, { text: metodo }],
            [{ text: 'Importe', style: 'label' }, { text: importe }],
            ...(saldo != null ? [[{ text: 'Saldo restante', style: 'label' }, { text: saldo }]] : []),
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0,0,0,16]
      },
      {
        columns: [
          { text: '______________________________\nFirma y Aclaración', alignment: 'left' },
          { text: '______________________________\nSello', alignment: 'right' }
        ],
        margin: [0,30,0,6]
      },
      { text: 'Gracias por su pago.', alignment: 'center', color: '#6B7280', margin: [0,6,0,0] }
    ],
    styles: {
      brand: { fontSize: 16, bold: true },
      brandSub: { fontSize: 9, color: '#9CA3AF' },
      ts: { fontSize: 8, color: '#9CA3AF', margin: [0, 2, 0, 0] },
      header: { fontSize: 14, bold: true, margin: [0, 6, 0, 8] },
      subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 6] },
      label: { fontSize: 9, color: '#6B7280' },
      docTitle: { fontSize: 18, bold: true, margin: [0, 10, 0, 12] }
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [40, 80, 40, 40]
  }
  try { pdfMake.createPdf(docDefinition).download(filename) } catch (e) { pdfMake.createPdf(docDefinition).open() }
}

// Profesional: Orden de Compra para enviar a proveedor (resumen)
export async function exportPurchaseOrderPDF({
  id,
  supplier,
  date,
  dueDate,
  total,
  items = [], // opcional (detalle)
  observations = '',
  filename = `OC-${id}.pdf`,
  brand = 'EVITA',
  subtitle = 'Orden de Compra',
  logoUrl
} = {}) {
  const logoDataUrl = await loadImageAsDataURL(getStoredLogoUrl(logoUrl))

  const lines = items.length ? items.map(it => [it.name || '-', String(it.qty||0), `$ ${Number(it.price||0).toFixed(2)}`, `$ ${Number((it.qty||0)*(it.price||0)).toFixed(2)}`]) : [[{text: 'Detalle no disponible en esta versión', colSpan: 4, alignment: 'center', italics: true, color:'#6B7280'}, {}, {}, {}]]

  const docDefinition = {
    header: buildHeader(logoDataUrl, brand, subtitle),
    content: [
      { text: `Orden de Compra ${id}`, style: 'docTitle' },
      {
        columns: [
          [
            { text: 'Proveedor', style: 'label' },
            { text: supplier || '-', margin: [0,2,0,8] },
            { text: 'Fecha', style: 'label' },
            { text: date || '-', margin: [0,2,0,8] },
          ],
          [
            { text: 'Vencimiento', style: 'label' },
            { text: dueDate || '-', margin: [0,2,0,8] },
            { text: 'Total', style: 'label' },
            { text: `$ ${Number(total||0).toFixed(2)}`, margin: [0,2,0,8] },
          ],
        ],
        columnGap: 40,
        margin: [0,0,0,10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['*','auto','auto','auto'],
          body: [[{text:'Producto',bold:true},{text:'Cant.',bold:true},{text:'Precio',bold:true},{text:'Subtotal',bold:true}], ...lines]
        },
        layout: 'lightHorizontalLines',
        margin: [0,0,0,10]
      },
      observations ? { text: `Observaciones: ${observations}`, margin: [0,4,0,10] } : undefined,
      { text: 'Favor de confirmar recepción y fecha de entrega.', color: '#6B7280', margin: [0,6,0,0] }
    ].filter(Boolean),
    styles: {
      brand: { fontSize: 16, bold: true },
      brandSub: { fontSize: 9, color: '#9CA3AF' },
      ts: { fontSize: 8, color: '#9CA3AF', margin: [0, 2, 0, 0] },
      header: { fontSize: 14, bold: true, margin: [0, 6, 0, 8] },
      subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 6] },
      label: { fontSize: 9, color: '#6B7280' },
      docTitle: { fontSize: 18, bold: true, margin: [0, 10, 0, 12] }
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [40, 80, 40, 40]
  }
  try { pdfMake.createPdf(docDefinition).download(filename) } catch (e) { pdfMake.createPdf(docDefinition).open() }
}

