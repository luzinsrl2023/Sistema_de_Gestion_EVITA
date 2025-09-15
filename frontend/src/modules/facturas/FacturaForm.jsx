import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useCotizaciones } from '../../hooks/useCotizaciones'
import { useProductos } from '../../hooks/useProductos'

export default function FacturaForm() {
  const { data: cotizaciones = [] } = useCotizaciones()
  const { data: productos = [] } = useProductos()
  const [selectedCot, setSelectedCot] = React.useState('')
  const [items, setItems] = React.useState([{ id: 1, nombre: '', cantidad: 1, precio: 0 }])

  function addItem() { setItems(prev => [...prev, { id: Date.now(), nombre:'', cantidad:1, precio:0 }]) }
  function removeItem(id) { setItems(prev => prev.length>1 ? prev.filter(i=>i.id!==id) : prev) }
  function updateItem(id, patch) { setItems(prev => prev.map(i=> i.id===id ? { ...i, ...patch } : i)) }
  function loadCotizacion(id) {
    setSelectedCot(id)
    const c = cotizaciones.find(x=>x.id===id)
    if (c && Array.isArray(c.items)) {
      setItems(c.items.map((it, idx)=>({ id: idx+1, nombre: it.nombre||it.name||'', cantidad: it.cantidad||1, precio: it.precio||it.price||0 })))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Nueva Factura</h1>
        <p className="text-gray-400 mt-1">
          Crea una nueva factura para tus clientes
        </p>
      </div>
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                ID de Factura
              </label>
              <input
                type="text"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="INV-XXX"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Cliente
              </label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                type="date"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white">Productos</label>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Cargar desde cotización</label>
                <select value={selectedCot} onChange={e=>loadCotizacion(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
                  <option value="">Seleccionar</option>
                  {cotizaciones.map(c=> <option key={c.id} value={c.id}>{c.id}</option>)}
                </select>
              </div>
            </div>
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
                    {items.map(it => (
                      <tr key={it.id}>
                        <td className="px-4 py-2">
                          <input list="productos-list" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" value={it.nombre}
                            onChange={e=>{
                              const nombre = e.target.value
                              const p = productos.find(pr=>pr.name===nombre)
                              updateItem(it.id,{ nombre, precio: p?.price ?? it.precio })
                            }} />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="1" className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" value={it.cantidad}
                            onChange={e=>updateItem(it.id,{ cantidad: Number(e.target.value) })} />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" className="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white" value={it.precio}
                            onChange={e=>updateItem(it.id,{ precio: Number(e.target.value) })} />
                        </td>
                        <td className="px-4 py-2 text-white font-mono">
                          ${((Number(it.cantidad)||0)*(Number(it.precio)||0)).toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={()=>removeItem(it.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <datalist id="productos-list">
                  {productos.map(p=> <option key={p.id} value={p.name} />)}
                </datalist>
              </div>
              <div className="p-4 border-t border-gray-700">
                <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300">
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
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
  )
}