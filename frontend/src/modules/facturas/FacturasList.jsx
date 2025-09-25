import React, { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, ChevronDown, Download, FileSpreadsheet, FileText, Eye, Receipt, X, Printer } from 'lucide-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useFacturas } from '../../hooks/useFacturas'
import { exportToExcel, exportTableToPDF } from '../../common'
import { DataTable } from '../../common'



const mockInvoices = [
  {
    id: 'INV-001',
    client: 'Juan Pérez',
    date: '2023-12-10',
    total: 25000,
    status: 'pagado',
    items: 15,
    dueDate: '2023-12-20'
  },
  {
    id: 'INV-002',
    client: 'Ana Gómez',
    date: '2023-11-28',
    total: 12500,
    status: 'pendiente',
    items: 8,
    dueDate: '2023-12-15'
  },
  {
    id: 'INV-003',
    client: 'Carlos Rodríguez',
    date: '2023-12-08',
    total: 45000,
    status: 'vencido',
    items: 22,
    dueDate: '2023-12-25'
  },
  {
    id: 'INV-004',
    client: 'Laura Fernández',
    date: '2023-10-15',
    total: 5400,
    status: 'pagado',
    items: 3,
    dueDate: '2023-11-01'
  }
]

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'vencido', label: 'Vencido' }
]

export default function FacturasList() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [showViewInvoice, setShowViewInvoice] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [showEditInvoice, setShowEditInvoice] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)

  // Data from React Query
  const { data: dataFacturas = [], isLoading, error, deleteFactura: deleteFacturaMut, addFactura: addFacturaMut, updateFactura: updateFacturaMut } = useFacturas()

  React.useEffect(() => {
    setInvoices(dataFacturas)
  }, [dataFacturas])

  // Filter invoices
  React.useEffect(() => {
    let filtered = invoices

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }


    setFilteredInvoices(filtered)
  }, [searchTerm, statusFilter, invoices])

  // Tabla avanzada con react-table (orden y paginación)
  const columns = React.useMemo(() => [
    { Header: 'Factura', accessor: 'id' },
    { Header: 'Cliente', accessor: 'client' },
    { Header: 'Fecha', accessor: 'date', Cell: ({ value }) => <span className="text-gray-400">{formatDate(value)}</span> },
    { Header: 'Vencimiento', accessor: 'dueDate', Cell: ({ value }) => <span className="text-gray-400">{formatDate(value)}</span> },
    { Header: 'Total', accessor: 'total', Cell: ({ value }) => <span className="text-white text-right font-mono font-medium block">{formatCurrency(value)}</span> },
    { Header: 'Items', accessor: 'items', Cell: ({ value }) => <span className="text-center text-gray-400 block">{value}</span> },
    { Header: 'Estado', accessor: 'status', Cell: ({ value }) => getStatusBadge(value) },
    {
      Header: 'Acciones',
      id: 'acciones',
      Cell: ({ row }) => {
        const inv = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => handleViewInvoice(inv.id)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Eye className="h-4 w-4" />
            </button>
            <button onClick={() => handlePrintInvoice(inv)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Printer className="h-4 w-4" />
            </button>
            <button onClick={() => handleOpenEdit(inv)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      }
    },
  ], [invoices])

  const data = React.useMemo(() => filteredInvoices, [filteredInvoices])


  const getStatusBadge = (status) => {
    const statusMap = {
      pagado: { label: 'Pagado', color: 'bg-green-500/10 text-green-400' },
      pendiente: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-400' },
      vencido: { label: 'Vencido', color: 'bg-red-500/10 text-red-400' }
    }

    const statusInfo = statusMap[status] || { label: 'Desconocido', color: 'bg-gray-500/10 text-gray-400' }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {statusInfo.label}
      </span>
    )
  }

  const handleViewInvoice = (invoiceId) => {
    const invoice = invoices.find(i => i.id === invoiceId)
    if (invoice) {
      setViewingInvoice(invoice)
      setShowViewInvoice(true)
    }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('¿Está seguro de que desea eliminar esta factura?')) return
    try {
      await deleteFacturaMut(invoiceId)
      alert('Factura eliminada exitosamente')
    } catch (e) {
      alert('Ocurrió un error eliminando la factura')
      console.error(e)
    }
  }

  const handleOpenEdit = (invoice) => {
    setEditingInvoice(invoice)
    setShowEditInvoice(true)
  }

  const handleUpdateInvoice = async (e) => {
    e.preventDefault()
    try {
      const f = e.target
      const updated = {
        ...editingInvoice,
        id: f.id.value,
        client: f.client.value,
        date: f.date.value,
        dueDate: f.dueDate.value,
        items: Number(f.items.value || editingInvoice.items || 1),
        total: Number(f.total.value || editingInvoice.total || 0),
        status: f.status.value || editingInvoice.status || 'pendiente'
      }
      await updateFacturaMut({ id: updated.id, patch: updated })
      setShowEditInvoice(false)
      setEditingInvoice(null)
    } catch (err) {
      console.error(err)
      alert('No se pudo actualizar la factura')
    }
  }

  const handleExportExcel = () => {
    const data = filteredInvoices.map(invoice => ({
      ID: invoice.id,
      Cliente: invoice.client,
      Fecha: invoice.date,
      'Fecha Vencimiento': invoice.dueDate,
      Total: invoice.total,
      Items: invoice.items,
      Estado: invoice.status,
    }))
    exportToExcel({ filename: 'facturas_evita.xlsx', sheetName: 'Facturas', data })
  }

  const handleExportPDF = () => {
    const body = filteredInvoices.map(invoice => [
      invoice.id,
      invoice.client,
      formatDate(invoice.date),
      formatDate(invoice.dueDate),
      formatCurrency(invoice.total),
      invoice.items,
      invoice.status,
    ])
    const head = ['ID', 'Cliente', 'Fecha', 'Vencimiento', 'Total', 'Items', 'Estado']
    exportTableToPDF({ title: 'Reporte de Facturas - EVITA', head, body, filename: 'facturas_evita.pdf' })
  }

  const handleAddInvoice = async (e) => {
    e.preventDefault()
    const f = e.target
    try {
      const id = f.id?.value || `INV-${String(invoices.length + 1).padStart(3, '0')}`
      const client = f.client?.value || 'Cliente'
      const date = f.date?.value || new Date().toISOString().split('T')[0]
      const dueDate = f.dueDate?.value || date
      const qty = Number(f.qty?.value || 1)
      const price = Number(f.price?.value || 0)
      const total = Math.round(qty * price * 100) / 100
      const items = qty
      const status = 'pendiente'
      await addFacturaMut({ id, client, date, dueDate, total, items, status })
      setShowAddInvoice(false)
    } catch (err) {
      console.error(err)
      alert('No se pudo guardar la factura')
    }
  }

  const pendingInvoices = invoices.filter(i => i.status === 'pendiente').length
  const overdueInvoices = invoices.filter(i => i.status === 'vencido').length
  const totalAmount = invoices.reduce((acc, invoice) => acc + invoice.total, 0)

  // Add this function for printing
  const handlePrintInvoice = (invoice) => {
    // Set the invoice data to be printed
    setViewingInvoice(invoice);
    // Open the view modal first
    setShowViewInvoice(true);
    // After a short delay, trigger the print
    setTimeout(() => {
      window.print();
      // Close the modal after printing
      setTimeout(() => {
        setShowViewInvoice(false);
        setViewingInvoice(null);
      }, 1000);
    }, 500);
  };

  // Also add a print button to the header section
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Administrador de Comprobantes</h1>
          <p className="text-gray-400 mt-1">
            Gestiona las facturas de tus clientes
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
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button
            onClick={() => setShowAddInvoice(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Factura
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{invoices.length}</p>
              <p className="text-sm text-gray-400">Total Facturas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <Receipt className="h-5 w-5" />
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
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{overdueInvoices}</p>
              <p className="text-sm text-gray-400">Vencidas</p>
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
                placeholder="Buscar factura por ID o cliente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent input"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8 input"
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
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={data} pageSize={10} />
        </div>

      </div>

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Nueva Factura</h2>
              <button
                onClick={() => setShowAddInvoice(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleAddInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ID de Factura
                  </label>
                  <input
                    name="id"
                    type="text"
                    required
                    defaultValue={`INV-${String(invoices.length + 1).padStart(3, '0')}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                    placeholder="INV-XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Cliente
                  </label>
                  <select
                    name="client"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                  >
                    <option value="">Seleccionar cliente</option>
                    <option value="Juan Pérez">Juan Pérez</option>
                    <option value="Ana Gómez">Ana Gómez</option>
                    <option value="Carlos Rodríguez">Carlos Rodríguez</option>
                    <option value="Laura Fernández">Laura Fernández</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Fecha
                  </label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Productos
                </label>
                <div className="border border-gray-700 rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Precio</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        <tr>
                          <td className="px-4 py-2">
                            <select name="product" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input">
                              <option>Limpiador Multiuso EVITA Pro</option>
                              <option>Jabón Líquido para Manos EVITA</option>
                              <option>Desinfectante Antibacterial EVITA</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              name="qty"
                              type="number"
                              defaultValue="1"
                              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              name="price"
                              type="number"
                              defaultValue="5.99"
                              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                            />
                          </td>
                          <td className="px-4 py-2 text-white font-mono">
                            $5.99
                          </td>
                          <td className="px-4 py-2">
                            <button className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-gray-700">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Producto
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Guardar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewInvoice && viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Detalles de Factura</h2>
              <button
                onClick={() => {
                  setShowViewInvoice(false)
                  setViewingInvoice(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">ID de Factura</p>
                  <p className="text-white font-medium">{viewingInvoice.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cliente</p>
                  <p className="text-white font-medium">{viewingInvoice.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Fecha</p>
                  <p className="text-white font-medium">{formatDate(viewingInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Fecha de Vencimiento</p>
                  <p className="text-white font-medium">{formatDate(viewingInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Estado</p>
                  <p className="text-white font-medium">{getStatusBadge(viewingInvoice.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-white font-medium text-xl">{formatCurrency(viewingInvoice.total)}</p>
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
                  onClick={() => {
                    setShowViewInvoice(false)
                    setViewingInvoice(null)
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
                <button
                  onClick={() => {
                    const head = ['Campo', 'Valor']
                    const body = [
                      ['ID', viewingInvoice.id],
                      ['Cliente', viewingInvoice.client],
                      ['Fecha', formatDate(viewingInvoice.date)],
                      ['Vencimiento', formatDate(viewingInvoice.dueDate)],
                      ['Estado', viewingInvoice.status],
                      ['Total', formatCurrency(viewingInvoice.total)]
                    ]
                    exportTableToPDF({
                      title: `Factura ${viewingInvoice.id}`,
                      head,
                      body,
                      filename: `factura_${viewingInvoice.id}.pdf`
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

      {/* Edit Invoice Modal */}
      {showEditInvoice && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Editar Factura</h2>
              <button
                onClick={() => setShowEditInvoice(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleUpdateInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">ID de Factura</label>
                  <input name="id" type="text" defaultValue={editingInvoice.id} readOnly className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Cliente</label>
                  <input name="client" type="text" defaultValue={editingInvoice.client} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Fecha</label>
                  <input name="date" type="date" defaultValue={editingInvoice.date} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Fecha de Vencimiento</label>
                  <input name="dueDate" type="date" defaultValue={editingInvoice.dueDate} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Items</label>
                  <input name="items" type="number" defaultValue={editingInvoice.items || 1} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Total</label>
                  <input name="total" type="number" step="0.01" defaultValue={editingInvoice.total || 0} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">Estado</label>
                  <select name="status" defaultValue={editingInvoice.status || 'pendiente'} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input">
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowEditInvoice(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
