import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Receipt,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Send,
  Eye,
  Edit,
  Import
} from 'lucide-react'
import { formatCurrency, formatDate, cn, exportToCSV, importFromCSV } from '../../lib/utils'

const mockInvoices = [
  {
    id: 'INV-00123',
    client: 'Innovatech Solutions',
    issueDate: '2024-07-20',
    dueDate: '2024-08-20',
    amount: 1500.00,
    status: 'pagado'
  },
  {
    id: 'INV-00124',
    client: 'Quantum Dynamics',
    issueDate: '2024-07-18',
    dueDate: '2024-08-18',
    amount: 875.50,
    status: 'pendiente'
  },
  {
    id: 'INV-00125',
    client: 'Apex Enterprises',
    issueDate: '2024-07-15',
    dueDate: '2024-08-15',
    amount: 2200.00,
    status: 'vencido'
  },
  {
    id: 'INV-00126',
    client: 'Nexus Group',
    issueDate: '2024-07-12',
    dueDate: '2024-08-12',
    amount: 350.00,
    status: 'pagado'
  },
  {
    id: 'INV-00127',
    client: 'Visionary Labs',
    issueDate: '2024-07-10',
    dueDate: '2024-08-10',
    amount: 5400.75,
    status: 'pendiente'
  }
]

export default function Invoices() {
  const [invoices, setInvoices] = useState(mockInvoices)
  const [filteredInvoices, setFilteredInvoices] = useState(mockInvoices)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const fileInputRef = useRef(null)

  // Filter invoices
  useEffect(() => {
    let filtered = invoices

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }, [searchTerm, statusFilter, invoices])

  const getStatusBadge = (status) => {
    const colors = {
      'pagado': 'bg-green-500/10 text-green-400',
      'pendiente': 'bg-yellow-500/10 text-yellow-400',
      'vencido': 'bg-red-500/10 text-red-400'
    }

    const labels = {
      'pagado': 'Pagada',
      'pendiente': 'Pendiente',
      'vencido': 'Vencida'
    }

    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', colors[status])}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {labels[status]}
      </span>
    )
  }

  const totalInvoices = invoices.length
  const pendingInvoices = invoices.filter(i => i.status === 'pendiente').length
  const overdueInvoices = invoices.filter(i => i.status === 'vencido').length
  const totalAmount = invoices.reduce((acc, i) => acc + i.amount, 0)

  // Export functionality
  const handleExportCSV = () => {
    const exportData = filteredInvoices.map(invoice => ({
      'Nº Factura': invoice.id,
      'Cliente': invoice.client,
      'Fecha Emisión': invoice.issueDate,
      'Vencimiento': invoice.dueDate,
      'Monto': invoice.amount,
      'Estado': invoice.status
    }))
    exportToCSV(exportData, 'facturas_evita')
  }

  // Import functionality
  const handleImportCSV = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      importFromCSV(file, (data) => {
        try {
          const newInvoices = data.map((row, index) => ({
            id: row['Nº Factura'] || row.id || `INV-${(Date.now() + index).toString().substr(-5)}`,
            client: row.Cliente || row.client || '',
            issueDate: row['Fecha Emisión'] || row.issueDate || new Date().toISOString().split('T')[0],
            dueDate: row.Vencimiento || row.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            amount: parseFloat(row.Monto || row.amount || 0),
            status: row.Estado || row.status || 'pendiente'
          }))
          
          setInvoices(prev => [...prev, ...newInvoices])
          alert(`Se importaron ${newInvoices.length} facturas exitosamente`)
        } catch (error) {
          alert('Error al procesar los datos del archivo')
          console.error('Import error:', error)
        }
      })
    }
    // Reset file input
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Facturas</h1>
          <p className="text-gray-400 mt-1">
            Administra las facturas y el estado de cobros de tus clientes.
          </p>
        </div>
        <button 
          onClick={() => setShowAddInvoice(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Factura
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalInvoices}</p>
              <p className="text-sm text-gray-400">Total Facturas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingInvoices}</p>
              <p className="text-sm text-gray-400">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{overdueInvoices}</p>
              <p className="text-sm text-gray-400">Vencidas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
              <p className="text-sm text-gray-400">Valor Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs and Search */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex border-b border-gray-700">
              {['all', 'pendiente', 'pagado', 'vencido'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    statusFilter === status
                      ? "border-green-500 text-green-400"
                      : "border-transparent text-gray-400 hover:text-gray-100 hover:border-gray-600"
                  )}
                >
                  {status === 'all' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar por N° de factura, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleImportCSV}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Import className="h-4 w-4" />
                Importar
              </button>
              <button 
                onClick={handleExportCSV}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">N° Factura</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Fecha Emisión</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Vencimiento</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Monto</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Estado</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4 text-sm text-white font-mono font-medium">{invoice.id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-white">{invoice.client}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-4 text-sm text-white text-right font-mono font-medium">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Send className="h-4 w-4" />
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
            <span className="font-medium text-white">{filteredInvoices.length}</span> de{' '}
            <span className="font-medium text-white">{invoices.length}</span> facturas
          </p>
        </div>
      </div>
    </div>
  )
}