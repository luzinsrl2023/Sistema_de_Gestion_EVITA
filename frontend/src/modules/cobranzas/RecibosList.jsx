import React from 'react'
import { Download, FileText } from 'lucide-react'
import { useRecibos } from '../../hooks/useRecibos'
import { exportReceiptPDF } from '../../common'

export default function RecibosList() {
  const { data: recibos = [] } = useRecibos()

  async function imprimir(rec) {
    await exportReceiptPDF({
      reciboId: rec.id,
      fecha: rec.fecha,
      cliente: rec.cliente,
      facturaId: rec.facturaId,
      metodo: rec.metodo,
      importe: `$ ${Number(rec.monto||0).toFixed(2)}`,
      saldo: `$ ${Number(rec.saldo||0).toFixed(2)}`,
      manual: !!rec.manual,
      filename: `recibo-${rec.facturaId}-${rec.fecha}.pdf`
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5"/> Recibos</h1>
      </div>

      <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Recibo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Cliente</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Factura</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Importe</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Método</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recibos.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-400" colSpan={7}>No hay recibos registrados.</td>
                </tr>
              )}
              {recibos.slice().reverse().map(rec => (
                <tr key={rec.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">{rec.id}</span>
                      {rec.manual && (
                        <span className="inline-flex items-center text-[10px] leading-none px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Manual</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{rec.fecha}</td>
                  <td className="px-4 py-3 text-gray-300">{rec.cliente}</td>
                  <td className="px-4 py-3 text-gray-300">{rec.facturaId}</td>
                  <td className="px-4 py-3 text-white font-mono">$ {Number(rec.monto||0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-300">{rec.metodo}</td>
                  <td className="px-4 py-3">
                    <button onClick={()=>imprimir(rec)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-800 text-gray-200">
                      <Download className="h-4 w-4"/> Imprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

