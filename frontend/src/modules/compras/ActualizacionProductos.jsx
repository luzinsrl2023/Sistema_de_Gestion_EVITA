import React, { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useProductos } from '../../hooks/useProductos'

function getSuppliers() {
  try {
    const raw = localStorage.getItem('evita-suppliers')
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) return arr
    }
  } catch (_) {}
  return [
    { name: 'TecnoGlobal S.A.' },
    { name: 'Soluciones de Oficina Ltda.' },
    { name: 'Componentes & Cia.' },
    { name: 'Distribuidora Norte' },
  ]
}

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase()
}

function parseNumber(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).toString().replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

export default function ActualizacionProductos() {
  const { data: productos = [], saveProducto, isLoading } = useProductos()
  const [proveedor, setProveedor] = useState('')
  const [rows, setRows] = useState([])
  const [missing, setMissing] = useState([])
  const [updated, setUpdated] = useState(0)
  const [processing, setProcessing] = useState(false)

  const suppliers = useMemo(() => getSuppliers(), [])

  function handleDownloadTemplate() {
    const data = [
      { sku: 'LMP-EVT-001', nombre: 'Limpiador Multiuso EVITA Pro', precio: 5.99, stock: 150 },
      { sku: 'DES-EVT-002', nombre: 'Desinfectante Antibacterial EVITA', precio: 8.99, stock: 120 },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
    XLSX.writeFile(wb, 'plantilla_actualizacion_productos.xlsx')
  }

  function extractRowsFromWorksheet(ws) {
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' })
    // Detectar columnas por nombre flexible
    const mapRow = (r) => {
      const entries = Object.entries(r)
      const obj = {}
      for (const [k, v] of entries) {
        const hk = normalizeHeader(k)
        if (['sku', 'código', 'codigo', 'id', 'referencia'].includes(hk)) obj.sku = String(v).trim()
        if (['nombre', 'name', 'descripcion', 'descripción'].includes(hk)) obj.nombre = String(v).trim()
        if (['precio', 'price', 'p'].includes(hk)) obj.precio = parseNumber(v)
        if (['stock', 'existencia', 'cantidad', 'qty', 'cantidad_stock'].includes(hk)) obj.stock = parseNumber(v)
      }
      return obj
    }
    const mapped = json.map(mapRow).filter(r => r.sku || r.nombre)
    return mapped
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const parsed = extractRowsFromWorksheet(ws)
      setRows(parsed)
      setMissing([])
      setUpdated(0)
    }
    reader.readAsArrayBuffer(file)
  }

  async function applyUpdates() {
    if (!proveedor) { alert('Seleccione un proveedor'); return }
    if (!rows.length) { alert('Importe un archivo Excel primero'); return }

    setProcessing(true)
    try {
      let updatedCount = 0
      const notFound = []
      const bySku = new Map((productos || []).map(p => [String(p.sku || '').trim().toLowerCase(), p]))
      const byId = new Map((productos || []).map(p => [String(p.id || '').trim().toLowerCase(), p]))
      const byName = new Map((productos || []).map(p => [String(p.name || '').trim().toLowerCase(), p]))

      for (const r of rows) {
        const skuKey = String(r.sku || '').trim().toLowerCase()
        const nameKey = String(r.nombre || '').trim().toLowerCase()
        const found = (skuKey && bySku.get(skuKey)) || (skuKey && byId.get(skuKey)) || (nameKey && byName.get(nameKey))

        if (!found) {
          notFound.push(r)
          continue
        }
        const patch = { ...found }
        if (r.precio !== null && r.precio !== undefined) patch.price = r.precio
        if (r.stock !== null && r.stock !== undefined) patch.stock = Math.max(0, Math.round(r.stock))
        // Nota: no cambiamos id/sku/name aquí para no romper referencias
        await saveProducto(patch)
        updatedCount++
      }
      setMissing(notFound)
      setUpdated(updatedCount)
      alert(`Actualización completa: ${updatedCount} productos actualizados${notFound.length ? `, ${notFound.length} no encontrados` : ''}.`)
    } catch (err) {
      console.error(err)
      alert('Error aplicando la actualización. Revise el archivo y vuelva a intentar.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Actualización masiva de Productos</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Proveedor</label>
          <select
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Seleccione proveedor</option>
            {(suppliers || []).map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Archivo Excel (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
          />
          <p className="text-xs text-gray-400 mt-2">Columnas esperadas: sku (o código/id), nombre, precio, stock</p>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" x2="12" y1="15" y2="3"></line>
            </svg>
            Descargar plantilla
          </button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Previsualización ({rows.length} filas)</h2>
            <button
              type="button"
              disabled={processing || isLoading}
              onClick={applyUpdates}
              className={`px-4 py-2 rounded-lg ${processing ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white`}
            >
              {processing ? 'Aplicando...' : 'Aplicar actualización'}
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">SKU/ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">Nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">Precio</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rows.slice(0, 100).map((r, idx) => (
                  <tr key={idx} className="odd:bg-gray-900">
                    <td className="px-3 py-2 text-sm text-gray-200">{r.sku || ''}</td>
                    <td className="px-3 py-2 text-sm text-gray-200">{r.nombre || ''}</td>
                    <td className="px-3 py-2 text-sm text-gray-200">{r.precio ?? ''}</td>
                    <td className="px-3 py-2 text-sm text-gray-200">{r.stock ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(updated > 0 || missing.length > 0) && (
            <div className="text-sm text-gray-300">
              <p>
                Resultados: <span className="text-green-400 font-semibold">{updated} actualizados</span>
                {missing.length > 0 && (
                  <> · <span className="text-yellow-400 font-semibold">{missing.length} no encontrados</span></>
                )}
              </p>
            </div>
          )}

          {missing.length > 0 && (
            <details className="text-sm text-gray-400">
              <summary className="cursor-pointer text-gray-300">Ver filas no encontradas</summary>
              <ul className="list-disc ml-5 mt-2">
                {missing.slice(0, 50).map((m, i) => (
                  <li key={i}>{m.sku || m.nombre}</li>
                ))}
                {missing.length > 50 && <li>...</li>}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

