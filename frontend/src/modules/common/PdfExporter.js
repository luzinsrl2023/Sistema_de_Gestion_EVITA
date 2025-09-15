import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// Configure pdfMake with fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs

export const exportToPdf = (data, title, filename = 'report') => {
  const docDefinition = {
    content: [
      { text: title, style: 'header' },
      { text: new Date().toLocaleDateString(), style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: data.columns.map(() => '*'),
          body: [
            data.columns.map(col => ({ text: col, style: 'tableHeader' })),
            ...data.rows.map(row => 
              data.columns.map(col => 
                typeof row[col] === 'number' ? 
                  { text: row[col].toString(), alignment: 'right' } : 
                  row[col]
              )
            )
          ]
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  }

  pdfMake.createPdf(docDefinition).download(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportInvoiceToPdf = (invoice, filename = 'invoice') => {
  const docDefinition = {
    content: [
      { text: 'Factura', style: 'header' },
      { text: `ID: ${invoice.id}`, style: 'subheader' },
      { text: `Cliente: ${invoice.client}`, style: 'subheader' },
      { text: `Fecha: ${new Date(invoice.date).toLocaleDateString()}`, style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Producto', style: 'tableHeader' },
              { text: 'Cantidad', style: 'tableHeader' },
              { text: 'Precio', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' }
            ],
            ...invoice.items.map(item => [
              item.product,
              { text: item.quantity.toString(), alignment: 'right' },
              { text: `$${item.price.toFixed(2)}`, alignment: 'right' },
              { text: `$${(item.quantity * item.price).toFixed(2)}`, alignment: 'right' }
            ]),
            [
              { text: 'Total', colSpan: 3, bold: true },
              {},
              {},
              { text: `$${invoice.total.toFixed(2)}`, bold: true, alignment: 'right' }
            ]
          ]
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  }

  pdfMake.createPdf(docDefinition).download(`${filename}_${invoice.id}.pdf`)
}

export default { exportToPdf, exportInvoiceToPdf }import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// Configure pdfMake with fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs

export const exportToPdf = (data, title, filename = 'report') => {
  const docDefinition = {
    content: [
      { text: title, style: 'header' },
      { text: new Date().toLocaleDateString(), style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: data.columns.map(() => '*'),
          body: [
            data.columns.map(col => ({ text: col, style: 'tableHeader' })),
            ...data.rows.map(row => 
              data.columns.map(col => 
                typeof row[col] === 'number' ? 
                  { text: row[col].toString(), alignment: 'right' } : 
                  row[col]
              )
            )
          ]
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  }

  pdfMake.createPdf(docDefinition).download(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportInvoiceToPdf = (invoice, filename = 'invoice') => {
  const docDefinition = {
    content: [
      { text: 'Factura', style: 'header' },
      { text: `ID: ${invoice.id}`, style: 'subheader' },
      { text: `Cliente: ${invoice.client}`, style: 'subheader' },
      { text: `Fecha: ${new Date(invoice.date).toLocaleDateString()}`, style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Producto', style: 'tableHeader' },
              { text: 'Cantidad', style: 'tableHeader' },
              { text: 'Precio', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' }
            ],
            ...invoice.items.map(item => [
              item.product,
              { text: item.quantity.toString(), alignment: 'right' },
              { text: `$${item.price.toFixed(2)}`, alignment: 'right' },
              { text: `$${(item.quantity * item.price).toFixed(2)}`, alignment: 'right' }
            ]),
            [
              { text: 'Total', colSpan: 3, bold: true },
              {},
              {},
              { text: `$${invoice.total.toFixed(2)}`, bold: true, alignment: 'right' }
            ]
          ]
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  }

  pdfMake.createPdf(docDefinition).download(`${filename}_${invoice.id}.pdf`)
}

export default { exportToPdf, exportInvoiceToPdf }