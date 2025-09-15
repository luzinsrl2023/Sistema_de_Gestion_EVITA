import React from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../lib/utils'
import { exportTableToPDF, exportToExcel } from '../../common'
import { useFacturas } from '../../hooks/useFacturas'
import { usePagos } from '../../hooks/usePagos'

export default function ComposicionSaldos(props) {
  const { clienteId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const account = props.account || location.state?.account || { id: clienteId, client: decodeURIComponent(clienteId || ''), totalAmount: 0, pendingAmount: 0 }
  const { data: facturas = [] } = useFacturas()
  const { data: pagos = [] } = usePagos()
  const clientName = account.client || decodeURIComponent(clienteId || '')
  const rows = React.useMemo(() => facturas.filter(f => (f.client || '') === clientName), [facturas, clientName])
  const paidByInvoice = React.useMemo(() => {
    const map = {}
    pagos.forEach(p => { map[p.invoiceId] = (map[p.invoiceId] || 0) + Number(p.amount || 0) })
    return map
  }, [pagos])
  const totalAmount = React.useMemo(() => rows.reduce((acc, r) => acc + Number(r.total || 0), 0), [rows])
  const pendingAmount = React.useMemo(() => rows.reduce((acc, r) => acc + Math.max(0, Number(r.total || 0) - (paidByInvoice[r.id] || 0)), 0), [rows, paidByInvoice])
  const onClose = props.onClose || (() => navigate(-1))

  if (!account && rows.length === 0) return null

  const handleExportPDF = () => {
    const head = ['Factura', 'Fecha', 'Vencimiento', 'Total', 'Pagado', 'Pendiente', 'Estado']
    const body = rows.map(r => {
      const paid = paidByInvoice[r.id] || 0
      const pending = Math.max(0, Number(r.total || 0) - paid)
      const isPaid = pending <= 0
      const status = isPaid ? 'Pagado' : (r.status === 'vencido' ? 'Vencido' : 'Pendiente')
      return [
        r.id,
        formatDate(r.date),
        formatDate(r.dueDate),
        formatCurrency(r.total),
        formatCurrency(paid),
        formatCurrency(pending),
        status,
      ]
    })
    exportTableToPDF({
      title: `Composición de Saldos - ${account.client}`,
      head,
      body,
      filename: `composicion_saldos_${account.id}.pdf`
    })
  }
  const handleExportExcel = () => {
    const data = rows.map(r => {
      const paid = paidByInvoice[r.id] || 0
      const pending = Math.max(0, Number(r.total || 0) - paid)
      const isPaid = pending <= 0
      const status = isPaid ? 'Pagado' : (r.status === 'vencido' ? 'Vencido' : 'Pendiente')
      return {
        Factura: r.id,
        Fecha: formatDate(r.date),
        Vencimiento: formatDate(r.dueDate),
        Total: Number(r.total || 0),
        Pagado: Number(paid),
        Pendiente: Number(pending),
        Estado: status,
      }
    })
    exportToExcel({ filename: `composicion_saldos_${account.id}.xlsx`, sheetName: 'Composicion', data })
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Composición de Saldos</h1>
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
              <p className="text-sm text-gray-400">ID de Cuenta</p>
              <p className="text-white font-medium">{account.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Cliente</p>
              <p className="text-white font-medium">{account.client}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-white font-medium">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Pendiente</p>
              <p className="text-white font-medium">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Facturas Pendientes</h3>
            <div className="border border-gray-700 rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Factura</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Vencimiento</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 text-right">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 text-right">Pendiente</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rows.map((f) => {
                      const paid = paidByInvoice[f.id] || 0
                      const pending = Math.max(0, Number(f.total || 0) - paid)
                      const isPaid = pending <= 0
                      const statusBadge = isPaid ? 'bg-green-500/10 text-green-400' : (f.status === 'vencido' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400')
                      const statusText = isPaid ? 'Pagado' : (f.status === 'vencido' ? 'Vencido' : 'Pendiente')
                      return (
                        <tr key={f.id}>
                          <td className="px-4 py-2 text-white">{f.id}</td>
                          <td className="px-4 py-2 text-gray-400">{formatDate(f.date)}</td>
                          <td className="px-4 py-2 text-gray-400">{formatDate(f.dueDate)}</td>
                          <td className="px-4 py-2 text-white font-mono text-right">{formatCurrency(f.total)}</td>
                          <td className="px-4 py-2 text-white font-mono text-right">{formatCurrency(pending)}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge}`}>
                              <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              disabled={isPaid}
                              onClick={() => navigate(`/cobranzas/pagos/${f.id}`, { state: { invoice: { id: f.id, client: f.client, total: Number(f.total || 0), pendingAmount: pending } } })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isPaid ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                              Pagar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-gray-400">Sin facturas para este cliente</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 flex-wrap">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleExportExcel}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              Exportar Excel
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