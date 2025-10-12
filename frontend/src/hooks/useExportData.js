import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para manejo de exportaciones de datos
 * Optimizado con useCallback y useMemo para performance
 */
export const useExportData = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState(null);

  // Función para descargar archivo
  const downloadFile = useCallback((blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Función para obtener datos de Supabase según el tipo
  const fetchDataForExport = useCallback(async (dataType) => {
    try {
      let query;
      let filename;
      
      switch (dataType) {
        case 'productos':
          query = supabase
            .from('productos')
            .select(`
              nombre,
              descripcion,
              precio,
              stock,
              created_at,
              proveedores (nombre)
            `)
            .order('created_at', { ascending: false });
          filename = 'productos_evita';
          break;
          
        case 'clientes':
          query = supabase
            .from('clientes')
            .select('nombre, email, telefono, direccion, created_at')
            .order('created_at', { ascending: false });
          filename = 'clientes_evita';
          break;
          
        case 'ventas':
          query = supabase
            .from('ventas')
            .select(`
              fecha,
              total,
              estado,
              created_at,
              clientes (nombre)
            `)
            .order('created_at', { ascending: false });
          filename = 'ventas_evita';
          break;
          
        case 'compras':
          query = supabase
            .from('ordenes')
            .select(`
              fecha,
              total,
              estado,
              created_at,
              proveedores (nombre)
            `)
            .order('created_at', { ascending: false });
          filename = 'compras_evita';
          break;
          
        case 'proveedores':
          query = supabase
            .from('proveedores')
            .select('nombre, email, telefono, direccion, created_at')
            .order('created_at', { ascending: false });
          filename = 'proveedores_evita';
          break;
          
        case 'todo':
          // Obtener todos los datos
          const [productosRes, clientesRes, ventasRes, comprasRes, proveedoresRes] = await Promise.all([
            supabase.from('productos').select('nombre, descripcion, precio, stock, created_at, proveedores (nombre)'),
            supabase.from('clientes').select('nombre, email, telefono, direccion, created_at'),
            supabase.from('ventas').select('fecha, total, estado, created_at, clientes (nombre)'),
            supabase.from('ordenes').select('fecha, total, estado, created_at, proveedores (nombre)'),
            supabase.from('proveedores').select('nombre, email, telefono, direccion, created_at')
          ]);
          
          return {
            productos: productosRes.data || [],
            clientes: clientesRes.data || [],
            ventas: ventasRes.data || [],
            compras: comprasRes.data || [],
            proveedores: proveedoresRes.data || []
          };
          
        default:
          throw new Error(`Tipo de datos no soportado: ${dataType}`);
      }
      
      if (dataType !== 'todo') {
        const { data, error } = await query;
        if (error) throw error;
        
        return { data: data || [], filename };
      }
      
    } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error);
      throw error;
    }
  }, []);

  // Función para exportar a Excel
  const exportToExcel = useCallback(async (dataType) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      const result = await fetchDataForExport(dataType);
      
      if (dataType === 'todo') {
        setExportProgress(25);
        
        const wb = XLSX.utils.book_new();
        
        // Agregar cada hoja
        Object.entries(result).forEach(([sheetName, data]) => {
          if (data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          }
        });
        
        setExportProgress(75);
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        setExportProgress(100);
        downloadFile(blob, 'evita_datos_completos.xlsx');
        
      } else {
        setExportProgress(50);
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(result.data);
        XLSX.utils.book_append_sheet(wb, ws, dataType);
        
        setExportProgress(75);
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        setExportProgress(100);
        downloadFile(blob, `${result.filename}.xlsx`);
      }
      
    } catch (error) {
      setExportError(error.message);
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  }, [fetchDataForExport, downloadFile]);

  // Función para exportar a CSV
  const exportToCSV = useCallback(async (dataType) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      const result = await fetchDataForExport(dataType);
      
      if (dataType === 'todo') {
        setExportError('CSV no soporta múltiples hojas. Use Excel para exportar todos los datos.');
        return;
      }
      
      setExportProgress(50);
      
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(result.data));
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      
      setExportProgress(100);
      downloadFile(blob, `${result.filename}.csv`);
      
    } catch (error) {
      setExportError(error.message);
      console.error('Error exporting to CSV:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  }, [fetchDataForExport, downloadFile]);

  // Función para exportar a JSON
  const exportToJSON = useCallback(async (dataType) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      const result = await fetchDataForExport(dataType);
      
      setExportProgress(50);
      
      const jsonData = dataType === 'todo' ? result : result.data;
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      setExportProgress(100);
      downloadFile(blob, `${dataType === 'todo' ? 'evita_datos_completos' : result.filename}.json`);
      
    } catch (error) {
      setExportError(error.message);
      console.error('Error exporting to JSON:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  }, [fetchDataForExport, downloadFile]);

  // Función genérica para exportar
  const exportData = useCallback(async (dataType, format = 'excel') => {
    switch (format.toLowerCase()) {
      case 'excel':
      case 'xlsx':
        await exportToExcel(dataType);
        break;
      case 'csv':
        await exportToCSV(dataType);
        break;
      case 'json':
        await exportToJSON(dataType);
        break;
      default:
        throw new Error(`Formato no soportado: ${format}`);
    }
  }, [exportToExcel, exportToCSV, exportToJSON]);

  // Estado del hook
  const exportState = useMemo(() => ({
    isExporting,
    exportProgress,
    exportError,
    canExport: !isExporting && !exportError
  }), [isExporting, exportProgress, exportError]);

  return {
    exportData,
    exportToExcel,
    exportToCSV,
    exportToJSON,
    ...exportState
  };
};
