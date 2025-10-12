import React, { useMemo, useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabaseClient'
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Package,
  Building2,
  TrendingUp,
  Database,
  Eye,
  Trash2
} from 'lucide-react'

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

export default function ActualizacionProductosOptimized() {
  const [proveedor, setProveedor] = useState('')
  const [rows, setRows] = useState([])
  const [missing, setMissing] = useState([])
  const [updated, setUpdated] = useState(0)
  const [processing, setProcessing] = useState(false)
  
  // Estados para UX mejorada
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef(null)
  const suppliers = useMemo(() => getSuppliers(), [])

  // Funciones para UX mejorada
  const showNotification = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    } else {
      setErrorMessage(message)
      setShowError(true)
      setTimeout(() => setShowError(false), 4000)
    }
  }, [])

  const handleDownloadTemplate = useCallback(() => {
    const data = [
      { sku: 'LMP-EVT-001', nombre: 'Limpiador Multiuso EVITA Pro', precio: 5.99, stock: 150 },
      { sku: 'DES-EVT-002', nombre: 'Desinfectante Antibacterial EVITA', precio: 8.99, stock: 120 },
      { sku: 'DET-EVT-003', nombre: 'Detergente Concentrado EVITA', precio: 6.50, stock: 200 },
      { sku: 'PAP-EVT-004', nombre: 'Papel Higiénico Industrial', precio: 12.99, stock: 100 },
      { sku: 'TOA-EVT-005', nombre: 'Toallas de Papel Premium', precio: 9.99, stock: 80 }
    ]
    
    try {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
      XLSX.writeFile(wb, 'plantilla_actualizacion_productos.xlsx')
      showNotification('Plantilla descargada exitosamente')
    } catch (error) {
      showNotification('Error al descargar la plantilla', 'error')
    }
  }, [showNotification])

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
          showNotification('El archivo debe tener al menos una fila de datos', 'error')
          setIsUploading(false)
          return
        }

        const headers = jsonData[0].map(normalizeHeader)
        const dataRows = jsonData.slice(1)

        const processedRows = dataRows.map((row, index) => {
          const obj = {}
          headers.forEach((header, colIndex) => {
            obj[header] = row[colIndex]
          })

          const sku = obj.sku || obj.codigo || obj.id || obj['código'] || ''
          const nombre = obj.nombre || obj.name || obj.producto || ''
          const precio = parseNumber(obj.precio || obj.price || obj.costo)
          const stock = parseNumber(obj.stock || obj.inventario || obj.cantidad)

          return {
            rowIndex: index + 2,
            sku: String(sku).trim(),
            nombre: String(nombre).trim(),
            precio,
            stock,
            original: obj
          }
        }).filter(row => row.sku || row.nombre)

        setRows(processedRows)
        setPreviewData(processedRows.slice(0, 10)) // Mostrar solo las primeras 10 filas
        setShowPreview(true)
        setUploadProgress(100)
        showNotification(`Archivo procesado: ${processedRows.length} productos encontrados`)
      } catch (error) {
        console.error('Error processing file:', error)
        showNotification('Error al procesar el archivo Excel', 'error')
      } finally {
        setIsUploading(false)
      }
    }

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress((e.loaded / e.total) * 100)
      }
    }

    reader.readAsArrayBuffer(file)
  }, [showNotification])

  const processUpdate = useCallback(async () => {
    if (!proveedor) {
      showNotification('Por favor seleccione un proveedor', 'error')
      return
    }

    if (rows.length === 0) {
      showNotification('No hay datos para procesar', 'error')
      return
    }

    setProcessing(true)
    const missingProducts = []
    let successCount = 0

    try {
      for (const row of rows) {
        try {
          const { data: existingProducts, error: searchError } = await supabase
            .from('products')
            .select('id, name')
            .eq('sku', row.sku)
            .limit(1)

          if (searchError) throw searchError

          if (existingProducts && existingProducts.length > 0) {
            const updateData = {}
            if (row.precio !== null) updateData.sale_price = row.precio
            if (row.stock !== null) updateData.stock = row.stock

            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', existingProducts[0].id)

              if (updateError) throw updateError
              successCount++
            }
          } else {
            missingProducts.push({
              sku: row.sku,
              nombre: row.nombre,
              rowIndex: row.rowIndex
            })
          }
        } catch (error) {
          console.error(`Error processing row ${row.rowIndex}:`, error)
          missingProducts.push({
            sku: row.sku,
            nombre: row.nombre,
            rowIndex: row.rowIndex,
            error: error.message
          })
        }
      }

      setUpdated(successCount)
      setMissing(missingProducts)
      
      if (successCount > 0) {
        showNotification(`${successCount} productos actualizados exitosamente`)
      }
      
      if (missingProducts.length > 0) {
        showNotification(`${missingProducts.length} productos no encontrados`, 'error')
      }

    } catch (error) {
      console.error('Error in bulk update:', error)
      showNotification('Error durante la actualización masiva', 'error')
    } finally {
      setProcessing(false)
    }
  }, [proveedor, rows, showNotification])

  const clearData = useCallback(() => {
    setRows([])
    setMissing([])
    setUpdated(0)
    setPreviewData([])
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Notificaciones */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
            <button onClick={() => setShowSuccess(false)} className="ml-2 hover:bg-green-700 rounded p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {showError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
            <button onClick={() => setShowError(false)} className="ml-2 hover:bg-red-700 rounded p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Mejorado */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Actualización masiva de Productos</h1>
                <p className="text-slate-300">Actualiza precios y stock de productos desde un archivo Excel</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-all duration-200 facturador-button"
              >
                <Download className="h-4 w-4" />
                Descargar Plantilla
              </button>
            </div>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Panel Izquierdo - Configuración */}
          <div className="space-y-6">
            
            {/* Selección de Proveedor */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Configuración</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Proveedor
                  </label>
                  <select
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent facturador-input"
                  >
                    <option value="">Seleccione proveedor</option>
                    {suppliers.map((supplier, index) => (
                      <option key={index} value={supplier.name}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Carga de Archivo */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Upload className="h-5 w-5 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Archivo Excel (.xlsx)</h2>
              </div>
              
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isUploading 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto" />
                      <div>
                        <p className="text-white font-medium">Procesando archivo...</p>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{uploadProgress.toFixed(0)}% completado</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto" />
                      <div>
                        <p className="text-white font-medium">Arrastra tu archivo Excel aquí</p>
                        <p className="text-sm text-slate-400">o haz clic para seleccionar</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Seleccionar archivo
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-sm text-slate-400">
                  <p className="font-medium mb-2">Columnas esperadas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>sku (o código/id)</li>
                    <li>nombre</li>
                    <li>precio</li>
                    <li>stock</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Acciones</h2>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={processUpdate}
                  disabled={processing || rows.length === 0 || !proveedor}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    processing || rows.length === 0 || !proveedor
                      ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white facturador-button'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      Procesar Actualización ({rows.length} productos)
                    </>
                  )}
                </button>

                {rows.length > 0 && (
                  <button
                    onClick={clearData}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpiar Datos
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Panel Derecho - Resultados */}
          <div className="space-y-6">
            
            {/* Estadísticas */}
            {(updated > 0 || missing.length > 0) && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Resultados</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <p className="text-sm text-green-300">Actualizados</p>
                        <p className="text-2xl font-bold text-white">{updated}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                      <div>
                        <p className="text-sm text-red-300">No Encontrados</p>
                        <p className="text-2xl font-bold text-white">{missing.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vista Previa */}
            {showPreview && previewData.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Vista Previa</h2>
                  </div>
                  <span className="text-sm text-slate-400">
                    Mostrando {previewData.length} de {rows.length} productos
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 px-3 text-slate-300 text-sm font-medium">SKU</th>
                        <th className="text-left py-2 px-3 text-slate-300 text-sm font-medium">Nombre</th>
                        <th className="text-left py-2 px-3 text-slate-300 text-sm font-medium">Precio</th>
                        <th className="text-left py-2 px-3 text-slate-300 text-sm font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b border-slate-700/50">
                          <td className="py-2 px-3 text-white text-sm">{row.sku}</td>
                          <td className="py-2 px-3 text-white text-sm">{row.nombre}</td>
                          <td className="py-2 px-3 text-white text-sm">
                            {row.precio !== null ? `$ ${row.precio.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-white text-sm">
                            {row.stock !== null ? row.stock : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errores */}
            {missing.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 facturador-card animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Productos No Encontrados</h2>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {missing.slice(0, 10).map((item, index) => (
                      <div key={index} className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{item.sku}</p>
                            <p className="text-sm text-red-300">{item.nombre}</p>
                          </div>
                          <span className="text-xs text-slate-400">Fila {item.rowIndex}</span>
                        </div>
                      </div>
                    ))}
                    {missing.length > 10 && (
                      <p className="text-center text-sm text-slate-400">
                        ... y {missing.length - 10} productos más
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

