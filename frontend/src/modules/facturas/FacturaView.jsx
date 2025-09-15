import React from 'react'
import { formatCurrency, formatDate } from '../../lib/utils'
import { exportSectionsToPDF } from '../../common'

export default function FacturaView({ invoice, onClose }) {
  if (!invoice) return null

  const handleExportPDF = () => {
    const head = ['Campo', 'Valor']
    const body = [
      ['Factura', String(invoice.id)],
      ['Cliente', invoice.client],
      ['Fecha', formatDate(invoice.date)],
      ['Vencimiento', formatDate(invoice.dueDate)],
      ['Total', formatCurrency(invoice.total)],
      ['Estado', invoice.status],
    ]
    exportSectionsToPDF({
      title: `Factura ${invoice.id}`,
      sections: [{ title: 'Detalle', head, body }],
      filename: `factura_${invoice.id}.pdf`
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Factura {invoice.id}</h1>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">ID de Factura</p>
              <p className="text-white font-medium">{invoice.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Cliente</p>
              <p className="text-white font-medium">{invoice.client}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha</p>
              <p className="text-white font-medium">{formatDate(invoice.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha de Vencimiento</p>
              <p className="text-white font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Estado</p>
              <p className="text-white font-medium">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  invoice.status === 'pagado' ? 'bg-green-500/10 text-green-400' :
                  invoice.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
                  {invoice.status === 'pagado' ? 'Pagado' : 
                   invoice.status === 'pendiente' ? 'Pendiente' : 'Vencido'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-white font-medium text-xl">{formatCurrency(invoice.total)}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Productos</h3>
            <div className="border border-gray-700 rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Precio</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="px-4 py-2 text-white">Limpiador Multiuso EVITA Pro</td>
                      <td className="px-4 py-2 text-gray-400">2</td>
                      <td className="px-4 py-2 text-gray-400">$5.99</td>
                      <td className="px-4 py-2 text-white font-mono">$11.98</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-white">Jabón Líquido para Manos EVITA</td>
                      <td className="px-4 py-2 text-gray-400">1</td>
                      <td className="px-4 py-2 text-gray-400">$3.99</td>
                      <td className="px-4 py-2 text-white font-mono">$3.99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleExportPDF}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icons
function X() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}