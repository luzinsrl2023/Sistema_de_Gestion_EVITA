import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  ChevronDown,
  X,
  Import,
  Download,
  FileSpreadsheet,
  FileText,
  Loader
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../../lib/utils'
import { DataTable, exportToExcel, exportTableToPDF } from '../../common'
import * as XLSX from 'xlsx'
import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from '../../services/proveedores'
import { updateProductosPorProveedor } from '../../services/productos'

const paymentTermsOptions = ['15 días', '20 días', '30 días', '60 días', '90 días', 'Contado']
const paymentMethods = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Cheque']

export default function ProveedoresList() {
  const [suppliers, setSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showEditSupplier, setShowEditSupplier] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [selectedSuppliers, setSelectedSuppliers] = useState([])
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '30 días', // Change default to Spanish terms
    paymentMethod: 'Efectivo', // Add payment method
    notes: '',
    margin: 0
  })
  const fileInputRef = useRef(null)

  const fetchSuppliers = async () => {
    setIsLoading(true);
    const { data, error } = await getProveedores();
    if (error) {
      alert('Error al cargar los proveedores');
      console.error(error);
    } else {
      setSuppliers(data || []);
      setFilteredSuppliers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter suppliers
  useEffect(() => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        Object.values(supplier).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === statusFilter);
    }

    setFilteredSuppliers(filtered);
  }, [searchTerm, statusFilter, suppliers]);

  const handleSelectSupplier = (supplierId) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(supplierId)) {
        return prev.filter(id => id !== supplierId)
      } else {
        return [...prev, supplierId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedSuppliers.length === filteredSuppliers.length) {
      setSelectedSuppliers([])
    } else {
      setSelectedSuppliers(filteredSuppliers.map(supplier => supplier.id))
    }
  }

  const getStatusBadge = (status) => {
    const colors = status === 'activo'
      ? 'bg-green-500/10 text-green-400'
      : 'bg-gray-500/10 text-gray-400'

    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', colors)}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {status === 'activo' ? 'Activo' : 'Inactivo'}
      </span>
    )
  }

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    const { error } = await createProveedor({ ...newSupplier, status: 'activo' });
    if (error) {
      alert('Error al crear el proveedor');
      console.error(error);
    } else {
      await fetchSuppliers();
      setNewSupplier({
        name: '', contactName: '', email: '', phone: '', address: '',
        paymentTerms: '30 días', paymentMethod: 'Efectivo', notes: '', margin: 0
      });
      setShowAddSupplier(false);
      alert('Proveedor creado exitosamente');
    }
  };

  const handleEditSupplier = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setEditingSupplier(supplier);
      setNewSupplier({
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        paymentTerms: supplier.paymentTerms,
        paymentMethod: supplier.paymentMethod || 'Efectivo',
        notes: supplier.notes || '',
        margin: supplier.margin || 0
      });
      setShowEditSupplier(true);
    }
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    const { error } = await updateProveedor(editingSupplier.id, newSupplier);
    if (error) {
      alert('Error al actualizar el proveedor');
      console.error(error);
    } else {
      await fetchSuppliers();
      setNewSupplier({
        name: '', contactName: '', email: '', phone: '', address: '',
        paymentTerms: '30 días', paymentMethod: 'Efectivo', notes: '', margin: 0
      });
      setEditingSupplier(null);
      setShowEditSupplier(false);
      alert('Proveedor actualizado exitosamente');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      const { error } = await deleteProveedor(supplierId);
      if (error) {
        alert('Error al eliminar el proveedor');
        console.error(error);
      } else {
        await fetchSuppliers();
        alert('Proveedor eliminado exitosamente');
      }
    }
  };

  const handleToggleSupplierStatus = async (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const newStatus = supplier.status === 'activo' ? 'inactivo' : 'activo';
    const { error } = await updateProveedor(supplierId, { status: newStatus });

    if (error) {
      alert('Error al cambiar el estado del proveedor');
      console.error(error);
    } else {
      await fetchSuppliers();
      const action = newStatus === 'inactivo' ? 'desactivado' : 'activado';
      alert(`Proveedor ${action} exitosamente`);
    }
  };

  const activeSuppliers = suppliers.filter(s => s.status === 'activo').length
  // Columns for DataTable
  const columns = React.useMemo(() => [
    {
      id: 'select',
      Header: () => (
        <input
          type="checkbox"
          checked={selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-600 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
        />
      ),
      Cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedSuppliers.includes(row.original.id)}
          onChange={() => handleSelectSupplier(row.original.id)}
          className="rounded border-gray-600 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
        />
      ),
      disableSortBy: true,
    },
    {
      Header: 'Proveedor',
      accessor: 'name',
      Cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700 rounded-lg">
            <Building2 className="h-4 w-4 text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.original.name}</p>
            <p className="text-xs text-gray-400">{row.original.id}</p>
          </div>
        </div>
      )
    },
    {
      Header: 'Contacto',
      accessor: 'contactName',
      Cell: ({ row }) => (
        <div className="space-y-1 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            {row.original.contactName}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            {row.original.phone}
          </div>
        </div>
      )
    },
    {
      Header: 'Términos',
      accessor: 'paymentTerms',
      Cell: ({ value }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
          {value}
        </span>
      )
    },
    {
      Header: 'Método',
      accessor: 'paymentMethod',
      Cell: ({ value }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-700 text-blue-300">
          {value}
        </span>
      )
    },

    {
      Header: 'Órdenes',
      accessor: 'totalOrders',
      Cell: ({ value }) => (
        <span className="text-sm text-gray-400 font-mono">{value}</span>
      )
    },
    {
      Header: 'Total',
      accessor: 'totalAmount',
      Cell: ({ value }) => (
        <span className="text-sm text-white font-mono">{formatCurrency(value)}</span>
      )
    },
    {
      Header: 'Estado',
      accessor: 'status',
      Cell: ({ value }) => (
        <>{getStatusBadge(value)}</>
      )
    },
    {
      id: 'actions',
      Header: 'Acciones',
      Cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEditSupplier(row.original.id)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteSupplier(row.original.id)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleSupplierStatus(row.original.id)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      ),
      disableSortBy: true,
    },
  ], [filteredSuppliers, selectedSuppliers])

  const totalOrders = suppliers.reduce((acc, s) => acc + s.totalOrders, 0)
  const totalAmount = suppliers.reduce((acc, s) => acc + s.totalAmount, 0)

  // Export functionality (common exporters)
  const handleExportExcel = () => {
    const exportData = filteredSuppliers.map(supplier => ({
      ID: supplier.id,
      Nombre: supplier.name,
      Contacto: supplier.contactName,
      Email: supplier.email,
      Teléfono: supplier.phone,
      Dirección: supplier.address,
      'Términos de Pago': supplier.paymentTerms,
      'Método de Pago': supplier.paymentMethod,
      Estado: supplier.status,
      'Órdenes Totales': supplier.totalOrders,
      'Valor Total': supplier.totalAmount,
    }))
    exportToExcel({ filename: 'proveedores_evita.xlsx', sheetName: 'Proveedores', data: exportData })
  }

  const handleExportPDF = () => {
    const head = ['ID', 'Nombre', 'Contacto', 'Email', 'Teléfono', 'Términos', 'Método', 'Estado']
    const body = filteredSuppliers.map(supplier => [
      supplier.id,
      supplier.name,
      supplier.contactName,
      supplier.email,
      supplier.phone,
      supplier.paymentTerms,
      supplier.paymentMethod || 'N/A',
      supplier.status,
    ])
    exportTableToPDF({ title: 'Reporte de Proveedores - EVITA', head, body, filename: 'proveedores_evita.pdf' })
  }

  // Import functionality
  const handleImportExcel = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          const newSuppliers = jsonData.map((row, index) => ({
            id: row.ID || row.id || `SUP${(suppliers.length + index + 1).toString().padStart(3, '0')}`,
            name: row.Nombre || row.name || '',
            contactName: row.Contacto || row.contactName || '',
            email: row.Email || row.email || '',
            phone: row.Teléfono || row.phone || '',
            address: row.Dirección || row.address || '',
            paymentTerms: row['Términos de Pago'] || row.paymentTerms || '30 días',
            paymentMethod: row['Método de Pago'] || row.paymentMethod || 'Efectivo',
            status: row.Estado || row.status || 'activo',
            totalOrders: parseInt(row['Órdenes Totales'] || row.totalOrders || 0),
            totalAmount: parseFloat(row['Valor Total'] || row.totalAmount || 0),
            lastOrder: null
          }))

          setSuppliers(prev => [...prev, ...newSuppliers])
          alert(`Se importaron ${newSuppliers.length} proveedores exitosamente`)
        } catch (error) {
          alert('Error al procesar los datos del archivo Excel')
          console.error('Import error:', error)
        }
      }
      reader.readAsArrayBuffer(file)
    }
    event.target.value = ''
  }

  // Add state for margin update
  const [showMarginUpdate, setShowMarginUpdate] = useState(false)
  const [selectedSupplierForMargin, setSelectedSupplierForMargin] = useState('')
  const [marginPercentage, setMarginPercentage] = useState(0)
  const [isUpdatingMargin, setIsUpdatingMargin] = useState(false)

  // Add function to update all products from a supplier
  const handleUpdateSupplierMargin = async () => {
    if (!selectedSupplierForMargin || marginPercentage <= 0) {
      alert('Por favor seleccione un proveedor y un porcentaje válido')
      return
    }

    try {
      setIsUpdatingMargin(true)
      const { data, updated, error } = await updateProductosPorProveedor(selectedSupplierForMargin, marginPercentage)
      if (error) throw error

      if (!updated) {
        alert('No se encontraron productos asociados a este proveedor en Supabase.')
      } else {
        const supplierName = suppliers.find((s) => s.id === selectedSupplierForMargin)?.name || 'el proveedor'
        alert(`Se actualizaron los precios de ${updated} productos de ${supplierName} aplicando un aumento del ${marginPercentage}%`)
      }

      setSelectedSupplierForMargin('')
      setMarginPercentage(0)
      setShowMarginUpdate(false)
    } catch (error) {
      console.error('Error updating supplier margin:', error)
      alert('Error al actualizar los precios de los productos')
    } finally {
      setIsUpdatingMargin(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Proveedores</h1>
          <p className="text-gray-400 mt-1">
            Administra tu red de proveedores y sus condiciones comerciales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Add Margin Update Button */}
          <button
            onClick={() => setShowMarginUpdate(true)}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-percent h-4 w-4">
              <line x1="19" y1="5" x2="5" y2="19"></line>
              <circle cx="6.5" cy="6.5" r="2.5"></circle>
              <circle cx="17.5" cy="17.5" r="2.5"></circle>
            </svg>
            Actualizar Precios por Proveedor
          </button>
          <button
            onClick={handleImportExcel}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Import className="h-4 w-4" />
            Importar Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => setShowAddSupplier(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{suppliers.length}</p>
              <p className="text-sm text-gray-400">Total Proveedores</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeSuppliers}</p>
              <p className="text-sm text-gray-400">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-sm text-gray-400">Órdenes Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <Building2 className="h-5 w-5" />
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
                placeholder="Buscar proveedor por nombre o ID"
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
                <option value="all">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
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

        {/* Hidden file input for Excel import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* DataTable reusable */}
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          pageSize={10}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Mostrando <span className="font-medium text-white">1</span> a{' '}
            <span className="font-medium text-white">{filteredSuppliers.length}</span> de{' '}
            <span className="font-medium text-white">{suppliers.length}</span> proveedores
          </p>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Nuevo Proveedor</h2>
              <button
                onClick={() => setShowAddSupplier(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Nombre del Proveedor
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                    placeholder="Ej. Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Margen (%)
                  </label>
                  <input
                    type="number"
                    value={newSupplier.margin || ''}
                    onChange={(e) => setNewSupplier({...newSupplier, margin: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                    placeholder="Ej. 15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nombre de Contacto
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier.contactName}
                    onChange={(e) => setNewSupplier({...newSupplier, contactName: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                    placeholder="+34 912 345 678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Términos de Pago
                  </label>
                  <select
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier({...newSupplier, paymentTerms: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 input"
                  >
                    {paymentTermsOptions.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Método de Pago Preferido
                  </label>
                  <select
                    value={newSupplier.paymentMethod}
                    onChange={(e) => setNewSupplier({...newSupplier, paymentMethod: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 input"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 input"
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y input"
                    style={{ minHeight: '80px' }}
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                    placeholder="Información adicional sobre el proveedor"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Editar Proveedor</h2>
              <button
                onClick={() => {
                  setShowEditSupplier(false)
                  setEditingSupplier(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Nombre del Proveedor
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej. Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nombre de Contacto
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier.contactName}
                    onChange={(e) => setNewSupplier({...newSupplier, contactName: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+34 912 345 678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Términos de Pago
                  </label>
                  <select
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier({...newSupplier, paymentTerms: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {paymentTermsOptions.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Método de Pago Preferido
                  </label>
                  <select
                    value={newSupplier.paymentMethod}
                    onChange={(e) => setNewSupplier({...newSupplier, paymentMethod: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                    style={{ minHeight: '80px' }}
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                    placeholder="Información adicional sobre el proveedor"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSupplier(false)
                    setEditingSupplier(null)
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Actualizar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Margin Update Modal */}
      {showMarginUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Actualizar Precios por Proveedor</h2>
              <button
                onClick={() => setShowMarginUpdate(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Seleccionar Proveedor
                </label>
                <select
                  value={selectedSupplierForMargin}
                  onChange={(e) => setSelectedSupplierForMargin(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccione un proveedor</option>
                  {suppliers.filter(s => s.status === 'activo').map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Porcentaje de Aumento (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={marginPercentage}
                  onChange={(e) => setMarginPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ingrese el porcentaje de aumento"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <span className="font-medium">Nota:</span> Esta acción actualizará automáticamente los precios de todos los productos asociados a este proveedor, aplicando el porcentaje de aumento especificado.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMarginUpdate(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateSupplierMargin}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isUpdatingMargin
                      ? 'bg-yellow-500/80 text-white cursor-not-allowed'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                  disabled={isUpdatingMargin}
                >
                  {isUpdatingMargin ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Aplicar Aumento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}