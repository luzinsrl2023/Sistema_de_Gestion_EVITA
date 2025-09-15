import React, { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, ChevronDown, Download, FileSpreadsheet, FileText, ShoppingCart, X } from 'lucide-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import { exportToExcel, exportTableToPDF, exportPurchaseOrderPDF } from '../../common'
import { useCompras } from '../../hooks/useCompras'
import { useTable, useSortBy, usePagination } from 'react-table'



const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' }
]

export default function OrdenesList() {
  const { data: dataCompras = [], addCompra, updateCompra, deleteCompra } = useCompras()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [showEditOrder, setShowEditOrder] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)

  // Filter orders
  React.useEffect(() => {
    let filtered = orders

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [searchTerm, statusFilter, orders])

  // Sincroniza datos desde React Query
  React.useEffect(() => {
    setOrders(dataCompras)
  }, [dataCompras])


  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-400' },
      completed: { label: 'Completado', color: 'bg-green-500/10 text-green-400' },
      cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-400' }
    }

    const statusInfo = statusMap[status] || { label: 'Desconocido', color: 'bg-gray-500/10 text-gray-400' }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {statusInfo.label}
      </span>
    )



  }
  // Tabla avanzada con react-table
  const columns = React.useMemo(() => [
    { Header: 'Orden', accessor: 'id' },
    { Header: 'Proveedor', accessor: 'supplier' },
    { Header: 'Fecha', accessor: 'date', Cell: ({ value }) => <span className="text-gray-400">{formatDate(value)}</span> },
    { Header: 'Vencimiento', accessor: 'dueDate', Cell: ({ value }) => <span className="text-gray-400">{formatDate(value)}</span> },
    { Header: 'Total', accessor: 'total', Cell: ({ value }) => <span className="text-white text-right font-mono font-medium block">{formatCurrency(value)}</span> },
    { Header: 'Items', accessor: 'items', Cell: ({ value }) => <span className="text-center text-gray-400 block">{value}</span> },
    { Header: 'Estado', accessor: 'status', Cell: ({ value }) => getStatusBadge(value) },
    {
      Header: 'Acciones',
      id: 'acciones',
      Cell: ({ row }) => {
        const ord = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => handlePrintOrder(ord)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Descargar OC en PDF">
              <FileText className="h-4 w-4" />
            </button>
            <button onClick={() => handleEditOrder(ord.id)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={() => handleDeleteOrder(ord.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      }
    },
  ], [orders])

  const data = React.useMemo(() => filteredOrders, [filteredOrders])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    state: { pageIndex, pageSize },
    pageOptions,
    setPageSize,
  } = useTable({ columns, data, initialState: { pageSize: 10 } }, useSortBy, usePagination)


  const handleAddOrder = async (e) => {
    e.preventDefault()
    try {
      const f = e.target
      const quoteRef = (f.quoteRef?.value || '').trim()

      // Evitar guardar dos veces la misma cotizacin/propuesta de proveedor
      if (quoteRef) {
        const yaExiste = dataCompras.some(o => (o.quoteRef || '').trim() === quoteRef)
        if (yaExiste) {
          alert(`Ya existe una Orden con la referencia "${quoteRef}". Evitando duplicado.`)
          return
        }
      }

      const order = {
        id: f.id.value,
        supplier: f.supplier.value,
        date: f.date.value,
        dueDate: f.dueDate.value,
        items: 1,
        total: 0,
        status: 'pending',
        quoteRef: quoteRef || null,
      }
      await addCompra(order)
      setShowAddOrder(false)
    } catch (err) {
      console.error(err)
      alert('No se pudo guardar la orden')
    }
  }

  const handleUpdateOrder = async (e) => {
    e.preventDefault()
    try {
      const f = e.target
      const patch = {
        supplier: f.supplier.value || editingOrder.supplier,
        date: f.date.value || editingOrder.date,
        dueDate: f.dueDate.value || editingOrder.dueDate,
        quoteRef: (f.quoteRef?.value || editingOrder.quoteRef || '').trim() || null,
      }
      await updateCompra({ id: editingOrder.id, patch })
      setShowEditOrder(false)
      setEditingOrder(null)
    } catch (err) {
      console.error(err)
      alert('No se pudo actualizar la orden')
    }
  }


  const handleEditOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setEditingOrder(order)
      setShowEditOrder(true)
    }
  }

  const handlePrintOrder = async (order) => {
    try {
      await exportPurchaseOrderPDF({
        id: order.id,
        supplier: order.supplier,
        date: formatDate(order.date),
        dueDate: formatDate(order.dueDate),
        total: order.total,
        items: [],
        filename: `OC-${order.id}.pdf`
      })
    } catch (e) {
      console.error('No se pudo exportar la OC', e)
      alert('No se pudo exportar la orden de compra en PDF')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('¿Está seguro de que desea eliminar esta orden de compra?')) return
    try {
      await deleteCompra(orderId)
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar la orden de compra')
    }
  }

  const handleExportExcel = () => {
    const data = filteredOrders.map(order => ({
      ID: order.id,
      Proveedor: order.supplier,
      Fecha: order.date,
      'Fecha Vencimiento': order.dueDate,
      Total: order.total,
      Items: order.items,
      Estado: order.status,
    }))
    exportToExcel({ filename: 'ordenes_compra_evita.xlsx', sheetName: 'OrdenesCompra', data })
  }

  const handleExportPDF = () => {
    const head = ['ID', 'Proveedor', 'Fecha', 'Vencimiento', 'Total', 'Items', 'Estado']
    const body = filteredOrders.map(order => [
      order.id,
      order.supplier,
      formatDate(order.date),
      formatDate(order.dueDate),
      formatCurrency(order.total),
      order.items,
      order.status,
    ])
    exportTableToPDF({ title: 'Reporte de Órdenes de Compra - EVITA', head, body, filename: 'ordenes_compra_evita.pdf' })
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const totalAmount = orders.reduce((acc, order) => acc + order.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Órdenes de Compra</h1>
          <p className="text-gray-400 mt-1">
            Gestiona las órdenes de compra a tus proveedores
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
            onClick={() => setShowAddOrder(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
              <p className="text-sm text-gray-400">Total Órdenes</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingOrders}</p>
              <p className="text-sm text-gray-400">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
              <p className="text-sm text-gray-400">Valor Total</p>
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
                placeholder="Buscar orden por ID o proveedor"
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
          <table {...getTableProps()} className="w-full text-left">
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()} className="bg-gray-800/50">
                  {headerGroup.headers.map(column => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400"
                    >
                      {column.render('Header')}
                      {column.isSorted ? (column.isSortedDesc ? ' ↓' : ' ↑') : ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="divide-y divide-gray-800">
              {page.map(row => {
                prepareRow(row)
                return (
                  <tr {...row.getRowProps()} className="hover:bg-gray-800/30 transition-colors">
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()} className="px-4 py-4">
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            Página <span className="font-medium text-white">{pageIndex + 1}</span> de{' '}
            <span className="font-medium text-white">{pageOptions.length || 1}</span> — Total:{' '}
            <span className="font-medium text-white">{orders.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>{size} / página</option>
              ))}
            </select>
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="px-3 py-1 rounded bg-gray-800 text-gray-200 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="px-3 py-1 rounded bg-gray-800 text-gray-200 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Nueva Orden de Compra</h2>
              <button
                onClick={() => setShowAddOrder(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleAddOrder}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ID de Orden
                  </label>
                  <input
                    name="id"
                    type="text"
                    required
                    defaultValue={`PO-${String(orders.length + 1).padStart(3, '0')}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="PO-XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Proveedor
                  </label>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Referencia / Cotización (opcional)
                  </label>
                  <input
                    name="quoteRef"
                    type="text"
                    placeholder="ID de cotización del proveedor"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                  <select
                    name="supplier"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar proveedor</option>
                    <option value="TecnoGlobal S.A.">TecnoGlobal S.A.</option>
                    <option value="Soluciones de Oficina Ltda.">Soluciones de Oficina Ltda.</option>
                    <option value="Componentes & Cia.">Componentes & Cia.</option>
                    <option value="Distribuidora Norte">Distribuidora Norte</option>
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            <select className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                              <option>Limpiador Multiuso EVITA Pro</option>
                              <option>Jabón Líquido para Manos EVITA</option>
                              <option>Desinfectante Antibacterial EVITA</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              defaultValue="1"
                              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              defaultValue="5.99"
                              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
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
                  onClick={() => setShowAddOrder(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Guardar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditOrder && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Editar Orden de Compra</h2>
              <button
                onClick={() => {
                  setShowEditOrder(false)
                  setEditingOrder(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleUpdateOrder}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    ID de Orden
                  </label>
                  <input
                    type="text"
                    required
                    value={editingOrder.id}
                    readOnly
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Proveedor
                  </label>
                  <select
                    name="supplier"
                    defaultValue={editingOrder.supplier}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="TecnoGlobal S.A.">TecnoGlobal S.A.</option>
                    <option value="Soluciones de Oficina Ltda.">Soluciones de Oficina Ltda.</option>
                    <option value="Componentes & Cia.">Componentes & Cia.</option>
                    <option value="Distribuidora Norte">Distribuidora Norte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Referencia / Cotización (opcional)
                  </label>
                  <input
                    name="quoteRef"
                    type="text"
                    defaultValue={editingOrder.quoteRef || ''}
                    placeholder="ID de cotización del proveedor"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Fecha
                  </label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={editingOrder.date}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    defaultValue={editingOrder.dueDate}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            <select className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
                              <option>Limpiador Multiuso EVITA Pro</option>
                              <option>Jabón Líquido para Manos EVITA</option>
                              <option>Desinfectante Antibacterial EVITA</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              defaultValue="1"
                              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              defaultValue="5.99"
                              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
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
                  onClick={() => {
                    setShowEditOrder(false)
                    setEditingOrder(null)
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Actualizar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}