import React, { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useFacturas } from '../../hooks/useFacturas'
import { usePagos } from '../../hooks/usePagos'
import { useRecibos } from '../../hooks/useRecibos'
import { useAuth } from '../../contexts/AuthContext'

import { exportReceiptPDF } from '../../common/PdfExporter'

export default function CobranzaForm(props) {
  const { user } = useAuth()
  const isDemoMode = user?.demo === true

  const { facturaId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const invoice = props.invoice || location.state?.invoice || {
    id: facturaId,
    client: 'Cliente',
    total: 0,
    pendingAmount: undefined,
  }
  const { data: pagos = [], addPago } = usePagos()
  const { addRecibo } = useRecibos()
  const paidSum = React.useMemo(() => pagos.filter(p => p.invoiceId === invoice.id).reduce((s, p) => s + Number(p.amount || 0), 0), [pagos, invoice.id])
  const computedPending = Math.max(0, Number(invoice.total || 0) - paidSum)
  const effectivePending = (invoice.pendingAmount ?? computedPending)

  const onClose = props.onClose || (() => navigate(-1))
  const { updateFactura } = useFacturas()

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  const nextReciboNumber = () => {
    try {
      const raw = localStorage.getItem('evita-recibo-seq')
      const current = raw ? parseInt(raw, 10) : 0
      const next = isNaN(current) ? 1 : current + 1
      localStorage.setItem('evita-recibo-seq', String(next))
      return `RC-${String(next).padStart(6, '0')}`
    } catch (_) {
      return `RC-${Date.now()}`
    }
  }

  const submitWithAmount = async (amount) => {
    if (isDemoMode) {
      alert('Acción no permitida en modo demo.')
      return
    }
    if (!amount || amount <= 0) return
    const pending = Number(effectivePending)
    const usedAmount = Math.min(amount, pending)
    const remaining = Math.max(0, pending - usedAmount)
    const status = remaining <= 0 ? 'pagado' : 'parcial'

    await addPago({ invoiceId: invoice.id, client: invoice.client, amount: usedAmount, method: paymentMethod, date: paymentDate })
    await updateFactura(invoice.id, { status })

    // Generar Recibo PDF con branding y numeración secuencial
    const reciboId = nextReciboNumber()


    // Persistir recibo para listado posterior
    try {
      await addRecibo({
        id: reciboId,
        fecha: paymentDate,
        cliente: invoice.client,
        facturaId: invoice.id,
        metodo: paymentMethod,
        monto: usedAmount,
        saldo: remaining,
      })
    } catch {}

    await exportReceiptPDF({
      reciboId,
      fecha: paymentDate,
      cliente: invoice.client,
      facturaId: invoice.id,
      metodo: paymentMethod,
      importe: formatCurrency(usedAmount),
      saldo: formatCurrency(remaining),
      filename: `recibo-${invoice.id}-${paymentDate}.pdf`
    })

    alert(`Pago registrado: ${formatCurrency(usedAmount)} por ${paymentMethod}. Restante: ${formatCurrency(remaining)}`)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount)) return
    await submitWithAmount(amount)
  }

  const handleSubmitPartial = async () => {
    const pending = Number(effectivePending)
    let amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount >= pending) {
      amount = Math.max(0.01, Number((pending / 2).toFixed(2)))
    }
    await submitWithAmount(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Registrar Pago</h1>
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
              <p className="text-sm text-gray-400">Factura</p>
              <p className="text-white font-medium">{invoice.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Cliente</p>
              <p className="text-white font-medium">{invoice.client}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Factura</p>
              <p className="text-white font-medium">{formatCurrency(invoice.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Pendiente</p>
              <p className="text-white font-medium">{formatCurrency(effectivePending)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isDemoMode && (
              <div className="p-3 mb-4 text-sm text-yellow-300 bg-yellow-900/30 rounded-lg" role="alert">
                <span className="font-medium">Modo Demo:</span> Las funciones de guardado están deshabilitadas.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Monto a Pagar
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-400">
                  Saldo restante: <span className="font-medium text-white">{formatCurrency(Math.max(0, Number(effectivePending) - (parseFloat(paymentAmount || '0') || 0)))}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentAmount(String(Number(effectivePending).toFixed(2)))} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 rounded">
                    Usar pendiente
                  </button>
                  <button type="button" onClick={() => setPaymentAmount(String((Number(effectivePending)/2).toFixed(2)))} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 rounded">
                    50%
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="mercado-pago">Mercado Pago</option>
                <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fecha de Pago
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 flex-wrap">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitPartial}
                disabled={isDemoMode}
                className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${isDemoMode ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                Registrar pago parcial
              </button>
              <button
                type="submit"
                disabled={isDemoMode}
                className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${isDemoMode ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                Registrar Pago
              </button>
            </div>
          </form>
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