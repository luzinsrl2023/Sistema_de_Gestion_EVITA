import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronDown, Download, FileSpreadsheet, FileText, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import { exportToExcel, exportTableToPDF, exportSectionsToPDF } from '../../common'
import { useFacturas } from '../../hooks/useFacturas'
import { usePagos } from '../../hooks/usePagos'
import { useRecibos } from '../../hooks/useRecibos'
import { useCobranzasStore } from '../store/cobranzasStore'


const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'parcial', label: 'Pago Parcial' }
]

export default function CuentasCorrientes() {
  const { data: invoices = [] } = useFacturas()
  const { data: pagos = [] } = usePagos()
  const { searchTerm, statusFilter, setSearchTerm, setStatusFilter } = useCobranzasStore()

  const accounts = React.useMemo(() => {
    const byClient = {}
    invoices.forEach(inv => {
      const client = inv.client || 'Cliente'
      if (!byClient[client]) byClient[client] = { id: encodeURIComponent(client), client, totalAmount: 0, invoices: 0, hasOverdue: false }
      byClient[client].totalAmount += Number(inv.total || 0)
      byClient[client].invoices += 1
      if (inv.status === 'vencido') byClient[client].hasOverdue = true
    })

    const paySumByClient = {}
    const lastPaymentByClient = {}
    pagos.forEach(p => {
      const c = p.client || 'Cliente'
      paySumByClient[c] = (paySumByClient[c] || 0) + Number(p.amount || 0)
      const d = new Date(p.date)
      const prev = lastPaymentByClient[c] ? new Date(lastPaymentByClient[c]) : null
      if (!prev || d > prev) lastPaymentByClient[c] = p.date
    })

    return Object.values(byClient).map(acc => {
      const paid = paySumByClient[acc.client] || 0
      const pendingAmount = Math.max(0, Number(acc.totalAmount) - Number(paid))
      const status = pendingAmount <= 0 ? 'pagado' : (acc.hasOverdue ? 'vencido' : (pendingAmount < acc.totalAmount ? 'parcial' : 'pendiente'))
      return { ...acc, pendingAmount, status, lastPayment: lastPaymentByClient[acc.client] || null }
    })
  }, [invoices, pagos])

  const filteredAccounts = React.useMemo(() => {
    let filtered = accounts
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(a => a.id.toLowerCase().includes(q) || a.client.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }
    return filtered
  }, [accounts, searchTerm, statusFilter])
  const { addRecibo } = useRecibos()


  const [showComposition, setShowComposition] = React.useState(false)
  const [selectedAccount, setSelectedAccount] = React.useState(null)

  // Recibo manual UI state
  const [showManualRecibo, setShowManualRecibo] = React.useState(false)
  const [manualReciboAccount, setManualReciboAccount] = React.useState(null)
  const [manualMonto, setManualMonto] = React.useState('')
  const [manualMetodo, setManualMetodo] = React.useState('efectivo')
  const [manualFecha, setManualFecha] = React.useState(new Date().toISOString().split('T')[0])
  const [manualFacturaId, setManualFacturaId] = React.useState('')
  const [manualNota, setManualNota] = React.useState('')


  const getStatusBadge = (status) => {
    const statusMap = {
      pagado: { label: 'Pagado', color: 'bg-green-500/10 text-green-400' },
      pendiente: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-400' },
      vencido: { label: 'Vencido', color: 'bg-red-500/10 text-red-400' },
      parcial: { label: 'Pago Parcial', color: 'bg-blue-500/10 text-blue-400' }
    }

    const statusInfo = statusMap[status] || { label: 'Desconocido', color: 'bg-gray-500/10 text-gray-400' }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {statusInfo.label}
      </span>
    )
  }


  // Helpers y handlers para Recibo Manual (no afecta saldo)
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

  const getLastInvoiceIdForClient = (client) => {
    const invs = invoices.filter(i => (i.client || 'Cliente') === client)
    if (!invs.length) return ''
    const sorted = invs.slice().sort((a,b) => new Date(b.date) - new Date(a.date))
    return sorted[0]?.id || ''
  }

  const openManualRecibo = (account) => {
    setManualReciboAccount(account)
    setManualFacturaId(getLastInvoiceIdForClient(account.client))
    const def = Number(account.pendingAmount || 0)
    setManualMonto(def > 0 ? String(def.toFixed(2)) : '')
    setManualMetodo('efectivo')
    setManualFecha(new Date().toISOString().split('T')[0])
    setManualNota('')
    setShowManualRecibo(true)
  }

  const handleSubmitManualRecibo = async (e) => {
    e?.preventDefault?.()
    if (!manualReciboAccount) return
    const amount = parseFloat(manualMonto)
    if (isNaN(amount) || amount <= 0) return

    const reciboId = nextReciboNumber()
    const head = ['Campo', 'Valor']
    const body = [
      ['Recibo', reciboId],
      ['Fecha', manualFecha],
      ['Cliente', manualReciboAccount.client],
      ['Factura', String(manualFacturaId || '-')],
      ['Método', manualMetodo],
      ['Importe', formatCurrency(amount)],
    ]
    if (manualNota) body.push(['Nota', manualNota])

    try {
      await addRecibo({
        id: reciboId,
        fecha: manualFecha,
        cliente: manualReciboAccount.client,
        facturaId: manualFacturaId || null,
        metodo: manualMetodo,
        monto: amount,
        saldo: null,
        manual: true,
      })
    } catch {}

    await exportSectionsToPDF({
      title: 'Recibo de Pago (Manual)',
      sections: [{ title: 'Detalle', head, body }],
      filename: `recibo-manual-${manualReciboAccount.id}-${manualFecha}.pdf`
    })

    alert('Recibo manual generado (no afecta saldo).')
    setShowManualRecibo(false)
  }

  const navigate = useNavigate()
  const handleViewComposition = (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    if (account) {
      navigate(`/cobranzas/composicion-saldos/${account.id}`, { state: { account } })
    }
  }

  const handleExportExcel = () => {
    const data = filteredAccounts.map(account => ({
      ID: account.id,
      Cliente: account.client,
      Total: account.totalAmount,
      Pendiente: account.pendingAmount,
      'Último Pago': account.lastPayment || 'N/A',
      Facturas: account.invoices,
      Estado: account.status,
    }))
    exportToExcel({ filename: 'cuentas_corrientes_evita.xlsx', sheetName: 'CuentasCorrientes', data })
  }

  const handleExportPDF = () => {
    const head = ['ID', 'Cliente', 'Total', 'Pendiente', 'Último Pago', 'Facturas', 'Estado']
    const body = filteredAccounts.map(account => [
      account.id,
      account.client,
      formatCurrency(account.totalAmount),
      formatCurrency(account.pendingAmount),
      account.lastPayment ? formatDate(account.lastPayment) : 'N/A',
      account.invoices,
      account.status,
    ])
    exportTableToPDF({ title: 'Reporte de Cuentas Corrientes - EVITA', head, body, filename: 'cuentas_corrientes_evita.pdf' })
  }

  const recentPayments = React.useMemo(() => {
    const sorted = [...pagos].sort((a,b) => new Date(b.date) - new Date(a.date))
    const now = new Date(); const thirty = new Date(now); thirty.setDate(now.getDate()-30)
    return sorted.filter(p => { const d=new Date(p.date); return !isNaN(d) && d>=thirty && d<=now })
  }, [pagos])

  const handleExportRecentExcel = () => {
    const data = recentPayments.map(p => ({
      Fecha: formatDate(p.date),
      Cliente: p.client || 'Cliente',
      Factura: p.invoiceId,
      Metodo: p.method,
      Monto: Number(p.amount || 0),
    }))
    exportToExcel({ filename: 'ultimos_pagos_evita.xlsx', sheetName: 'UltimosPagos', data })
  }

  const handleExportRecentPDF = () => {
    const head = ['Fecha','Cliente','Factura','Método','Monto']
    const body = recentPayments.map(p => [
      formatDate(p.date),
      p.client || 'Cliente',
      p.invoiceId,
      p.method,
      formatCurrency(p.amount),
    ])
    exportTableToPDF({ title: 'Últimos Pagos', head, body, filename: 'ultimos_pagos_evita.pdf' })
  }


  const totalPending = accounts.reduce((acc, account) => acc + account.pendingAmount, 0)
  const overdueAccounts = accounts.filter(a => a.status === 'vencido').length
  const last7Amount = React.useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    return pagos
      .filter(p => {
        const d = new Date(p.date)
        return !isNaN(d) && d >= weekAgo && d <= now
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }, [pagos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cuentas Corrientes</h1>
          <p className="text-gray-400 mt-1">
            Gestiona las cuentas corrientes de tus clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{accounts.length}</p>
              <p className="text-sm text-gray-400">Total Cuentas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalPending)}</p>
              <p className="text-sm text-gray-400">Total Pendiente</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{overdueAccounts}</p>
              <p className="text-sm text-gray-400">Cuentas Vencidas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(last7Amount)}</p>
              <p className="text-sm text-gray-400">Pagos últimos 7 días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar cuenta por ID o cliente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Cuenta</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Total</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Pendiente</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Último Pago</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Facturas</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Estado</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-white">{account.id}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400">{account.client}</td>
                  <td className="px-4 py-4 text-sm text-white text-right font-mono font-medium">{formatCurrency(account.totalAmount)}</td>
                  <td className="px-4 py-4 text-sm text-white text-right font-mono font-medium">{formatCurrency(account.pendingAmount)}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    {account.lastPayment ? formatDate(account.lastPayment) : 'N/A'}


                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400 text-center">{account.invoices}</td>
                  <td className="px-4 py-4 text-sm">
                    {getStatusBadge(account.status)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openManualRecibo(account)}
                        title="Generar recibo manual (no afecta saldo)"
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewComposition(account.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Mostrando <span className="font-medium text-white">1</span> a{' '}
            <span className="font-medium text-white">{filteredAccounts.length}</span> de{' '}
            <span className="font-medium text-white">{accounts.length}</span> cuentas
          </p>
        </div>
      </div>


      {/* Últimos Pagos */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Últimos pagos (30 días)</h2>
            <p className="text-gray-400 text-sm">Historial de cobros recientes</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportRecentExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </button>
            <button onClick={handleExportRecentPDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Fecha</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Factura</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Método</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentPayments.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-300">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{p.client || 'Cliente'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{p.invoiceId}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{p.method}</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-mono font-medium">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-400">Sin pagos en los últimos 30 días</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Manual Receipt Modal */}
      {showManualRecibo && manualReciboAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recibo Manual (no afecta saldo)</h2>
              <button onClick={() => setShowManualRecibo(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Cliente: <span className="text-white font-medium">{manualReciboAccount.client}</span></p>

            <form onSubmit={handleSubmitManualRecibo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Factura (opcional)</label>
                <input value={manualFacturaId} onChange={e=>setManualFacturaId(e.target.value)} placeholder="INV-000..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Fecha</label>
                  <input type="date" value={manualFecha} onChange={e=>setManualFecha(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Método</label>
                  <select value={manualMetodo} onChange={e=>setManualMetodo(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mercado-pago">Mercado Pago</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Monto</label>
                <input type="number" step="0.01" value={manualMonto} onChange={e=>setManualMonto(e.target.value)} placeholder="0.00" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Nota (opcional)</label>
                <textarea value={manualNota} onChange={e=>setManualNota(e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"/>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setShowManualRecibo(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Generar Recibo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Composition Modal */}
      {showComposition && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Composición de Saldos</h2>
              <button
                onClick={() => {
                  setShowComposition(false)
                  setSelectedAccount(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">ID de Cuenta</p>
                  <p className="text-white font-medium">{selectedAccount.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cliente</p>
                  <p className="text-white font-medium">{selectedAccount.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-white font-medium">{formatCurrency(selectedAccount.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pendiente</p>
                  <p className="text-white font-medium">{formatCurrency(selectedAccount.pendingAmount)}</p>
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        <tr>
                          <td className="px-4 py-2 text-white">INV-001</td>
                          <td className="px-4 py-2 text-gray-400">{formatDate('2023-12-10')}</td>
                          <td className="px-4 py-2 text-gray-400">{formatDate('2023-12-20')}</td>
                          <td className="px-4 py-2 text-white font-mono text-right">$12,500.00</td>
                          <td className="px-4 py-2 text-white font-mono text-right">$12,500.00</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400">
                              <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
                              Pendiente
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-white">INV-002</td>
                          <td className="px-4 py-2 text-gray-400">{formatDate('2023-11-28')}</td>
                          <td className="px-4 py-2 text-gray-400">{formatDate('2023-12-15')}</td>
                          <td className="px-4 py-2 text-white font-mono text-right">$5,000.00</td>
                          <td className="px-4 py-2 text-white font-mono text-right">$0.00</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-400">
                              <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
                              Pagado
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowComposition(false)
                    setSelectedAccount(null)
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const head = ['Campo', 'Valor']
                    const body = [
                      ['Cuenta', String(selectedAccount?.id || '')],
                      ['Cliente', String(selectedAccount?.client || '')],
                      ['Total', formatCurrency(selectedAccount?.totalAmount || 0)],
                      ['Pendiente', formatCurrency(selectedAccount?.pendingAmount || 0)],
                    ]
                    exportSectionsToPDF({
                      title: 'Composición de Saldos',
                      sections: [{ title: 'Resumen', head, body }],
                      filename: `composicion_saldos_${selectedAccount?.id}.pdf`
                    })
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>


      )}
    </div>
  )
}

// Icons
function Users() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  )
}

function X() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}