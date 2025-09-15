import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
  Mail,
  Phone,
  ChevronDown,
  Import,
  FileSpreadsheet,
  FileText
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, cn } from '../../lib/utils'
import * as XLSX from 'xlsx'
import { exportTableToPDF } from '../../common'

const mockClients = [
  {
    id: 'CLI001',
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    phone: '(555) 123-4567',
    totalPurchases: 1250,
    lastPurchase: '2023-11-15',
    paymentStatus: 'pagado',
    status: 'activo'
  },
  {
    id: 'CLI002',
    name: 'Ana Gómez',
    email: 'ana.gomez@example.com',
    phone: '(555) 987-6543',
    totalPurchases: 875,
    lastPurchase: '2023-10-20',
    paymentStatus: 'pendiente',
    status: 'activo'
  },
  {
    id: 'CLI003',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    phone: '(555) 246-8013',
    totalPurchases: 2100,
    lastPurchase: '2023-12-01',
    paymentStatus: 'pagado',
    status: 'activo'
  },
  {
    id: 'CLI004',
    name: 'Laura Fernández',
    email: 'laura.fernandez@example.com',
    phone: '(555) 369-1215',
    totalPurchases: 550,
    lastPurchase: '2023-11-28',
    paymentStatus: 'pagado',
    status: 'bloqueado'
  },
  {
    id: 'CLI005',
    name: 'David Martínez',
    email: 'david.martinez@example.com',
    phone: '(555) 482-3457',
    totalPurchases: 1500,
    lastPurchase: '2023-12-05',
    paymentStatus: 'pagado',
    status: 'activo'
  },
  {
    id: 'CLI006',
    name: 'Sofía López',
    email: 'sofia.lopez@example.com',
    phone: '(555) 605-5679',
    totalPurchases: 300,
    lastPurchase: '2023-11-20',
    paymentStatus: 'vencido',
    status: 'activo'
  },
  {
    id: 'CLI007',
    name: 'Javier Sánchez',
    email: 'javier.sanchez@example.com',
    phone: '(555) 728-7891',
    totalPurchases: 1800,
    lastPurchase: '2023-12-10',
    paymentStatus: 'pagado',
    status: 'activo'
  }
]

export default function Clients() {
  const [clients, setClients] = useState(mockClients)
  const [filteredClients, setFilteredClients] = useState(mockClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddClient, setShowAddClient] = useState(false)
  const [selectedClients, setSelectedClients] = useState([])
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const fileInputRef = useRef(null)

  // Filter clients based on search and status
  useEffect(() => {
    let filtered = clients

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.paymentStatus === statusFilter)
    }

    setFilteredClients(filtered)
  }, [searchTerm, statusFilter, clients])

  const handleSelectClient = (clientId) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId)
      } else {
        return [...prev, clientId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(filteredClients.map(client => client.id))
    }
  }

  const getStatusBadge = (status) => {
    const colors = getStatusColor(status)
    const labels = {
      'pagado': 'Pagado',
      'pendiente': 'Pendiente', 
      'vencido': 'Vencido'
    }

    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', colors)}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {labels[status] || status}
      </span>
    )
  }

  const getClientStatusBadge = (status) => {
    const isActive = status === 'activo'
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
      )}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {isActive ? 'Activo' : 'Bloqueado'}
      </span>
    )
  }

  // Export functionality
  const handleExportExcel = () => {
    const exportData = filteredClients.map(client => ({
      'ID Cliente': client.id,
      'Nombre': client.name,
      'Email': client.email,
      'Teléfono': client.phone,
      'Total Compras': client.totalPurchases,
      'Última Compra': client.lastPurchase,
      'Estado Pago': client.paymentStatus,
      'Estado Cliente': client.status
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, 'clientes_evita.xlsx')
  }

  const handleExportPDF = () => {
    const head = ['ID', 'Nombre', 'Email', 'Teléfono', 'Total Compras', 'Última Compra', 'Estado Pago', 'Estado']
    const body = filteredClients.map(client => [
      client.id,
      client.name,
      client.email,
      client.phone,
      `$${client.totalPurchases.toLocaleString()}`,
      client.lastPurchase,
      client.paymentStatus,
      client.status
    ])
    exportTableToPDF({ title: 'Reporte de Clientes - EVITA', head, body, filename: 'clientes_evita.pdf' })
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
          
          const newClients = jsonData.map((row, index) => ({
            id: row['ID Cliente'] || row.id || `CLI${(clients.length + index + 1).toString().padStart(3, '0')}`,
            name: row.Nombre || row.name || '',
            email: row.Email || row.email || '',
            phone: row.Teléfono || row.phone || '',
            totalPurchases: parseFloat(row['Total Compras'] || row.totalPurchases || 0),
            lastPurchase: row['Última Compra'] || row.lastPurchase || new Date().toISOString().split('T')[0],
            paymentStatus: row['Estado Pago'] || row.paymentStatus || 'pendiente',
            status: row['Estado Cliente'] || row.status || 'activo'
          }))
          
          setClients(prev => [...prev, ...newClients])
          alert(`Se importaron ${newClients.length} clientes exitosamente`)
        } catch (error) {
          alert('Error al procesar el archivo Excel')
          console.error('Import error:', error)
        }
      }
      reader.readAsArrayBuffer(file)
    }
    event.target.value = ''
  }

  // Client management functions
  const handleAddClient = () => {
    if (newClient.name && newClient.email) {
      const clientId = `CLI${(clients.length + 1).toString().padStart(3, '0')}`
      const client = {
        id: clientId,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        totalPurchases: 0,
        lastPurchase: new Date().toISOString().split('T')[0],
        paymentStatus: 'pendiente',
        status: 'activo'
      }
      setClients(prev => [...prev, client])
      setNewClient({ name: '', email: '', phone: '', address: '' })
      setShowAddClient(false)
      alert('Cliente agregado exitosamente')
    } else {
      alert('Por favor complete los campos obligatorios (Nombre y Email)')
    }
  }

  const handleToggleClientStatus = (clientId) => {
    setClients(prev => prev.map(client => {
      if (client.id === clientId) {
        const newStatus = client.status === 'activo' ? 'bloqueado' : 'activo'
        const action = newStatus === 'bloqueado' ? 'bloqueado' : 'desbloqueado'
        alert(`Cliente ${action} exitosamente`)
        return { ...client, status: newStatus }
      }
      return client
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Clientes</h1>
          <p className="text-gray-400 mt-1">
            Administra la información de tus clientes, su historial de compras y estado de pago.
          </p>
        </div>
        <button 
          onClick={() => setShowAddClient(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Cliente
        </button>
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
                placeholder="Buscar cliente por nombre o ID"
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
                <option value="all">Todos los estados</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencido">Vencido</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Filter className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleImportExcel}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Importar Excel
            </button>
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors group">
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
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Printer className="h-4 w-4" />
            </button>
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">ID Cliente</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Contacto</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Compras Totales</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Última Compra</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Estado de Pago</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Estado Cliente</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="rounded border-gray-600 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-400 font-mono">{client.id}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-white">{client.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-400 text-right font-mono">
                    {formatCurrency(client.totalPurchases)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-400">
                    {formatDate(client.lastPurchase)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    {getStatusBadge(client.paymentStatus)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    {getClientStatusBadge(client.status)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleClientStatus(client.id)}
                        className={cn(
                          "p-2 hover:bg-gray-800 rounded-lg transition-colors",
                          client.status === 'activo' 
                            ? "text-gray-400 hover:text-red-400" 
                            : "text-gray-400 hover:text-green-400"
                        )}
                        title={client.status === 'activo' ? 'Bloquear cliente' : 'Desbloquear cliente'}
                      >
                        {client.status === 'activo' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
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
            <span className="font-medium text-white">{filteredClients.length}</span> de{' '}
            <span className="font-medium text-white">{clients.length}</span> resultados
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors" disabled>
              Anterior
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 rounded transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowAddClient(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-xl transition-all w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Agregar Nuevo Cliente</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Nombre *</label>
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nombre completo del cliente"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Email *</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddClient(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddClient}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}