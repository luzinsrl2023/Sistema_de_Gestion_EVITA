import React, { useState } from 'react'
import { X, Plus, Trash2, DollarSign } from 'lucide-react'

const InvoiceForm = ({ isOpen, onClose, onSave }) => {
  const [invoiceData, setInvoiceData] = useState({
    cliente_id: '',
    tipo_comprobante: 'B',
    items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }],
    desglose_impuestos: {
      iva_21: 0,
    },
  })
  const [customTaxes, setCustomTaxes] = useState([])

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setInvoiceData(prev => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index, e) => {
    const { name, value } = e.target
    const items = [...invoiceData.items]
    items[index][name] = value
    setInvoiceData(prev => ({ ...prev, items }))
  }

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { descripcion: '', cantidad: 1, precio_unitario: 0 }],
    }))
  }

  const removeItem = (index) => {
    const items = invoiceData.items.filter((_, i) => i !== index)
    setInvoiceData(prev => ({ ...prev, items }))
  }

  const handleTaxChange = (e) => {
    const { name, value } = e.target
    setInvoiceData(prev => ({
      ...prev,
      desglose_impuestos: { ...prev.desglose_impuestos, [name]: parseFloat(value) || 0 }
    }))
  }

  const addCustomTax = () => {
    const taxName = prompt("Nombre del nuevo impuesto (ej. percepcion_iibb):")
    if (taxName && !customTaxes.includes(taxName) && !invoiceData.desglose_impuestos[taxName]) {
      setCustomTaxes([...customTaxes, taxName])
    }
  }

  const calculateTotals = () => {
    const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0)
    const totalTaxes = Object.values(invoiceData.desglose_impuestos).reduce((acc, tax) => acc + tax, 0)
    const total = subtotal + totalTaxes
    return { subtotal, totalTaxes, total }
  }

  const { subtotal, totalTaxes, total } = calculateTotals()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí iría la lógica para guardar en la BD
    onSave({ ...invoiceData, subtotal, total, estado: 'pendiente' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">Crear Nueva Factura</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Cliente y Tipo de Comprobante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Cliente</label>
              <input
                type="text"
                name="cliente_id"
                placeholder="ID o nombre del cliente"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tipo de Comprobante</label>
              <select
                name="tipo_comprobante"
                value={invoiceData.tipo_comprobante}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="A">Factura A</option>
                <option value="B">Factura B</option>
                <option value="C">Factura C</option>
                <option value="Remito">Remito</option>
              </select>
            </div>
          </div>

          {/* Items de la factura */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-white">Ítems</h4>
            {invoiceData.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <input
                  type="text"
                  name="descripcion"
                  placeholder="Descripción"
                  value={item.descripcion}
                  onChange={(e) => handleItemChange(index, e)}
                  className="flex-grow bg-gray-700 border-gray-600 rounded px-2 py-1 text-white"
                />
                <input
                  type="number"
                  name="cantidad"
                  placeholder="Cant."
                  value={item.cantidad}
                  onChange={(e) => handleItemChange(index, e)}
                  className="w-20 bg-gray-700 border-gray-600 rounded px-2 py-1 text-white"
                />
                <input
                  type="number"
                  name="precio_unitario"
                  placeholder="Precio"
                  value={item.precio_unitario}
                  onChange={(e) => handleItemChange(index, e)}
                  className="w-28 bg-gray-700 border-gray-600 rounded px-2 py-1 text-white"
                />
                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
            >
              <Plus className="h-4 w-4" /> Añadir Ítem
            </button>
          </div>

          {/* Impuestos */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-white">Impuestos</h4>
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-800/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-white mb-1">IVA (21%)</label>
                <input
                  type="number"
                  name="iva_21"
                  value={invoiceData.desglose_impuestos.iva_21}
                  onChange={handleTaxChange}
                  className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-white"
                />
              </div>
              {customTaxes.map(taxName => (
                <div key={taxName}>
                  <label className="block text-sm font-medium text-white mb-1">{taxName.replace(/_/g, ' ')}</label>
                  <input
                    type="number"
                    name={taxName}
                    value={invoiceData.desglose_impuestos[taxName] || 0}
                    onChange={handleTaxChange}
                    className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-white"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCustomTax}
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
            >
              <Plus className="h-4 w-4" /> Añadir Impuesto/Percepción
            </button>
          </div>

          {/* Totales */}
          <div className="p-4 bg-gray-950/50 rounded-lg space-y-2 text-right">
            <div className="flex justify-between text-lg">
              <span className="text-gray-400">Subtotal:</span>
              <span className="font-medium text-white">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Impuestos:</span>
              <span className="font-medium text-white">{totalTaxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold border-t border-gray-700 pt-2 mt-2">
              <span className="text-white">TOTAL:</span>
              <span className="text-green-400">{total.toFixed(2)}</span>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium"
          >
            <DollarSign className="h-4 w-4" />
            Guardar Factura
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceForm