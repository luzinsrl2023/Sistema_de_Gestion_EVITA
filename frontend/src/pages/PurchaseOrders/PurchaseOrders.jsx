import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  ShoppingCart,
  Package,
  Building2,
  Calendar,
  DollarSign,
  ChevronDown,
  X,
  Minus,
  Clock,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../../lib/utils'
import * as XLSX from 'xlsx'
import { exportTableToPDF } from '../../common'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

// Componente para el modal de nuevo proveedor
const NewSupplierModal = ({ isOpen, onClose, onSupplierCreated }) => {
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewSupplier(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([newSupplier])
        .select()
        .single()

      if (error) throw error

      alert('Proveedor creado exitosamente!')
      onSupplierCreated(data)
      onClose()
    } catch (error) {
      setError('Error al crear el proveedor: ' + error.message)
      console.error('Error creating supplier:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Nuevo Proveedor</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="label">Nombre del Proveedor</label>
            <input name="name" value={newSupplier.name} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Persona de Contacto</label>
            <input name="contact_person" value={newSupplier.contact_person} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" name="email" value={newSupplier.email} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input name="phone" value={newSupplier.phone} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Dirección</label>
            <textarea name="address" value={newSupplier.address} onChange={handleChange} className="input" rows="3"></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [showEditOrder, setShowEditOrder] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [searchedProducts, setSearchedProducts] = useState([])
  const [quoteSearch, setQuoteSearch] = useState('')

  const [newOrder, setNewOrder] = useState({
    supplier_id: '',
    items: [{ product_id: '', quantity: 1, price: 0, total: 0 }],
    notes: '',
    status: 'Pendiente'
  })

  const handleSupplierCreated = (newSupplier) => {
    setSuppliers(prev => [...prev, newSupplier])
    setNewOrder(prev => ({ ...prev, supplier_id: newSupplier.id }))
    setIsSupplierModalOpen(false)
  }

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (name),
          purchase_order_items (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedOrders = data.map(po => ({
        ...po,
        supplier: po.suppliers.name,
        items: po.purchase_order_items
      }))
      setPurchaseOrders(formattedOrders)
    } catch (error) {
      setError('Error al cargar las órdenes de compra: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInitialData = useCallback(async () => {
    try {
      const [suppliersRes, productsRes, quotesRes] = await Promise.all([
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('quotes').select('id, quote_id').order('created_at', { ascending: false })
      ])

      if (suppliersRes.error) throw suppliersRes.error
      if (productsRes.error) throw productsRes.error
      if (quotesRes.error) throw quotesRes.error

      setSuppliers(suppliersRes.data)
      setProducts(productsRes.data)
      setQuotes(quotesRes.data)
    } catch (error) {
      setError('Error al cargar datos iniciales: ' + error.message)
    }
  }, [])

  useEffect(() => {
    fetchPurchaseOrders()
    fetchInitialData()
  }, [fetchPurchaseOrders, fetchInitialData])

  // Filter purchase orders
  useEffect(() => {
    let filtered = purchaseOrders

    if (searchTerm) {
      filtered = filtered.filter(order =>
        (order.po_number && order.po_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.supplier && order.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase())
    }

    setFilteredOrders(filtered)
  }, [searchTerm, statusFilter, purchaseOrders])

  const getStatusBadge = (status) => {
    const colors = {
      'pendiente': 'bg-yellow-500/10 text-yellow-400',
      'aprobado': 'bg-blue-500/10 text-blue-400', 
      'recibido': 'bg-green-500/10 text-green-400',
      'cancelado': 'bg-red-500/10 text-red-400'
    }

    const labels = {
      'pendiente': 'Pendiente',
      'aprobado': 'Aprobado',
      'recibido': 'Recibido', 
      'cancelado': 'Cancelado'
    }

    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', colors[status])}>
        <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
        {labels[status]}
      </span>
    )
  }

  const handleProductSearch = async (query, index) => {
    // Update the visual input first
    const items = [...newOrder.items]
    items[index].product_name = query
    setNewOrder({ ...newOrder, items })

    if (query.length < 2) {
      setSearchedProducts([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(10)

      if (error) throw error
      setSearchedProducts(data)
    } catch (error) {
      console.error('Error searching products:', error)
    }
  }

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_id: '', quantity: 1, price: 0, total: 0 }]
    })
  }

  const removeOrderItem = (index) => {
    const items = newOrder.items.filter((_, i) => i !== index)
    setNewOrder({ ...newOrder, items })
  }

  const updateOrderItem = (index, field, value) => {
    const items = [...newOrder.items]
    
    if (field === 'product') {
      items[index].product_id = value.id
      items[index].product_name = value.name
      items[index].price = value.price
    } else {
      items[index][field] = value
    }
    
    items[index].total = (items[index].quantity || 0) * (items[index].price || 0)
    setNewOrder({ ...newOrder, items })
    setSearchedProducts([])
  }

  const handleImportFromQuote = async () => {
    if (!quoteSearch) {
      alert('Por favor, introduce un ID de cotización para importar.')
      return
    }

    try {
      setLoading(true)
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items ( * ),
          suppliers ( * )
        `)
        .eq('quote_id', quoteSearch)
        .single()

      if (quoteError) throw new Error(`Cotización no encontrada o error al cargar: ${quoteError.message}`)
      if (!quoteData) throw new Error('No se encontró la cotización.')

      const quoteItems = quoteData.quote_items

      // Fetch product details for each item
      const productIds = quoteItems.map(item => item.product_id)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

      if (productsError) throw productsError

      const itemsWithDetails = quoteItems.map(item => {
        const product = productsData.find(p => p.id === item.product_id)
        return {
          product_id: item.product_id,
          product_name: product?.name || 'Producto no encontrado',
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }
      })

      setNewOrder({
        supplier_id: quoteData.supplier_id,
        items: itemsWithDetails,
        notes: `Basado en la cotización ${quoteData.quote_id}`,
        status: 'Pendiente'
      })

      alert('Cotización importada exitosamente.')
    } catch (error) {
      setError('Error al importar la cotización: ' + error.message)
      alert('Error al importar la cotización: ' + error.message)
    } finally {
      setLoading(false)
      setQuoteSearch('')
    }
  }

  const calculateOrderTotals = () => {
    const subtotal = newOrder.items.reduce((acc, item) => acc + item.total, 0)
    const tax = subtotal * 0.1 // 10% tax
    const shipping = subtotal > 1000 ? 0 : 50
    const total = subtotal + tax + shipping
    
    return { subtotal, tax, shipping, total }
  }

  const handleEditOrder = (orderId) => {
    const order = purchaseOrders.find(o => o.id === orderId)
    if (order) {
      setEditingOrder(order)
      setNewOrder({
        supplier: mockSuppliers.find(s => s.name === order.supplier)?.id || '',
        items: [...order.items],
        notes: order.notes
      })
      setShowEditOrder(true)
    }
  }

  const handleDeleteOrder = (orderId) => {
    if (confirm('¿Está seguro de que desea eliminar esta orden de compra?')) {
      setPurchaseOrders(prev => prev.filter(order => order.id !== orderId))
      alert('Orden de compra eliminada exitosamente')
    }
  }

  const handleExportExcel = () => {
    const exportData = filteredOrders.map(order => ({
      'ID Orden': order.id,
      'Proveedor': order.supplier,
      'Fecha': order.date,
      'Estado': order.status,
      'Subtotal': order.subtotal,
      'Impuestos': order.tax,
      'Envío': order.shipping,
      'Total': order.total,
      'Notas': order.notes
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ordenes de Compra')
    XLSX.writeFile(wb, 'ordenes_compra_evita.xlsx')
  }

  const handleExportPDF = () => {
    const head = ['ID', 'Proveedor', 'Fecha', 'Estado', 'Total']
    const body = filteredOrders.map(order => [
      order.id,
      order.supplier,
      order.date,
      order.status,
      `$${order.total.toLocaleString()}`
    ])
    exportTableToPDF({ title: 'Reporte de Órdenes de Compra - EVITA', head, body, filename: 'ordenes_compra_evita.pdf' })
  }

  // Add this new function for Word export
  const handleExportWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'Reporte de Órdenes de Compra - EVITA',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: 'ID', bold: true })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Proveedor', bold: true })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Fecha', bold: true })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Estado', bold: true })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Total', bold: true })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...filteredOrders.map(order => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph(order.id)],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph(order.supplier)],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph(order.date)],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph(order.status)],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph(`$${order.total.toLocaleString()}`)],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                  ],
                })
              ),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    saveAs(new Blob([buffer]), 'ordenes_compra_evita.docx');
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    
    const { subtotal, tax, shipping, total } = calculateOrderTotals()

    const orderData = {
      supplier_id: newOrder.supplier_id,
      subtotal,
      tax,
      shipping,
      total,
      notes: newOrder.notes,
      status: newOrder.status
    }

    try {
      if (showEditOrder && editingOrder) {
        // Update existing order
        const { data: updatedPo, error: poUpdateError } = await supabase
          .from('purchase_orders')
          .update(orderData)
          .eq('id', editingOrder.id)
          .select()
          .single()

        if (poUpdateError) throw poUpdateError

        // Delete old items
        await supabase.from('purchase_order_items').delete().eq('po_id', editingOrder.id)

        // Insert new items
        const itemsToInsert = newOrder.items.map(item => ({
          po_id: updatedPo.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))

        const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert)
        if (itemsError) throw itemsError

        alert('Orden de compra actualizada exitosamente!')
      } else {
        // Create new order
        const { data: newPo, error: poError } = await supabase
          .from('purchase_orders')
          .insert(orderData)
          .select()
          .single()

        if (poError) throw poError

        const itemsToInsert = newOrder.items.map(item => ({
          po_id: newPo.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))

        const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert)
        if (itemsError) throw itemsError

        alert('Orden de compra creada exitosamente!')
      }

      // Reset form and state
      setNewOrder({
        supplier_id: '',
        items: [{ product_id: '', quantity: 1, price: 0, total: 0 }],
        notes: '',
        status: 'Pendiente'
      })
      setShowAddOrder(false)
      setShowEditOrder(false)
      setEditingOrder(null)
      fetchPurchaseOrders() // Refresh the list
    } catch (error) {
      setError('Error al guardar la orden de compra: ' + error.message)
      alert('Error al guardar la orden de compra: ' + error.message)
    }
  }

  const totalOrders = purchaseOrders.length
  const pendingOrders = purchaseOrders.filter(o => o.status === 'pendiente').length
  const totalValue = purchaseOrders.reduce((acc, o) => acc + o.total, 0)

  return (
    <div className="space-y-6">
      <NewSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSupplierCreated={handleSupplierCreated}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Órdenes de Compra</h1>
          <p className="text-gray-400 mt-1">
            Gestiona las órdenes de compra a tus proveedores.
          </p>
        </div>
        <button 
          onClick={() => setShowAddOrder(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Orden
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-sm text-gray-400">Total Órdenes</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <Clock className="h-5 w-5" />
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
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
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
                placeholder="Buscar por número de orden o proveedor"
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
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="recibido">Recibido</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar
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
                  onClick={handleExportWord}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Exportar Word
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
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Orden</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Proveedor</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Fecha</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Items</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Total</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Estado</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-white">{order.id}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {order.supplier}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.date)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {order.items.length} artículo{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-white text-right font-mono">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditOrder(order.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="Editar orden"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Eliminar orden"
                      >
                        <Trash2 className="h-4 w-4" />
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
            <span className="font-medium text-white">{filteredOrders.length}</span> de{' '}
            <span className="font-medium text-white">{purchaseOrders.length}</span> órdenes
          </p>
        </div>
      </div>

      {/* Add/Edit Order Modal */}
      {(showAddOrder || showEditOrder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {showEditOrder ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddOrder(false)
                  setShowEditOrder(false)
                  setEditingOrder(null)
                  setNewOrder({
                    supplier: '',
                    items: [{ productId: '', name: '', quantity: 1, price: 0, total: 0 }],
                    notes: ''
                  })
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Supplier Selection */}
              <div>
                <label className="label">Proveedor</label>
                <div className="flex items-center gap-2">
                  <select
                    required
                    value={newOrder.supplier_id}
                    onChange={(e) => setNewOrder({...newOrder, supplier_id: e.target.value})}
                    className="input w-full max-w-sm"
                  >
                    <option value="">Selecciona un proveedor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="btn-secondary p-2"
                    title="Crear nuevo proveedor"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Import from Quote */}
              <div className="card p-5">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1 w-full">
                    <label className="label">Importar desde Cotización</label>
                    <div className="relative">
                      <input
                        list="cotizaciones-list"
                        className="input pr-10"
                        placeholder="Buscar por ID de cotización (ej: COT-000001)"
                        value={quoteSearch}
                        onChange={(e) => setQuoteSearch(e.target.value)}
                      />
                      <datalist id="cotizaciones-list">
                        {quotes.map(q => <option key={q.id} value={q.quote_id} />)}
                      </datalist>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleImportFromQuote}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
                  >
                    <Download className="h-4 w-4" /> Importar
                  </button>
                </div>
              </div>


              {/* Products */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Productos</h3>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir Producto
                  </button>
                </div>
                
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Precio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {newOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <input
                                type="text"
                                list="products-list"
                                value={item.product_name || ''}
                                onChange={(e) => handleProductSearch(e.target.value, index)}
                                onBlur={() => setTimeout(() => setSearchedProducts([]), 200)}
                                placeholder="Buscar por nombre o SKU"
                                className="input w-full"
                              />
                              <datalist id={`products-list-${index}`}>
                                {searchedProducts.map(p => (
                                  <option key={p.id} value={`${p.name} (${p.sku})`} />
                                ))}
                              </datalist>
                              {searchedProducts.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                                  {searchedProducts.map(p => (
                                    <div
                                      key={p.id}
                                      onClick={() => updateOrderItem(index, 'product', p)}
                                      className="px-4 py-2 text-white cursor-pointer hover:bg-gray-700"
                                    >
                                      {p.name} ({p.sku})
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="input"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-white font-mono">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-4 py-3">
                            {newOrder.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOrderItem(index)}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Resumen de la Orden</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-mono">{formatCurrency(calculateOrderTotals().subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Impuestos (10%)</span>
                    <span className="text-white font-mono">{formatCurrency(calculateOrderTotals().tax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Envío</span>
                    <span className="text-white font-mono">{formatCurrency(calculateOrderTotals().shipping)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-white font-bold font-mono text-lg">{formatCurrency(calculateOrderTotals().total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                  style={{ minHeight: '80px' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales"
                />
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
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}