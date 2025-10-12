import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getEstadisticasDashboard,
  getVentasPorMes,
  getComprasPorMes,
  getProductosTopVentas,
  getStockPorCategoria,
  getProductosStockCritico,
  getActividadReciente,
  getEstadisticasVentas,
  getEstadisticasCompras,
  getEstadisticasStock
} from '../services/reportes';

/**
 * Hook personalizado para obtener datos de reportes con cache y optimización
 * Utiliza useMemo y useCallback para optimizar performance
 */
export const useReportData = (reportType, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const {
    periodo = 'yearly',
    limite = 10,
    año = new Date().getFullYear(),
    cacheTime = 5 * 60 * 1000, // 5 minutos por defecto
    ...otherOptions
  } = options;

  // Función para obtener datos según el tipo de reporte
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      switch (reportType) {
        case 'dashboard':
          result = await getEstadisticasDashboard();
          break;
        case 'ventas-mes':
          result = await getVentasPorMes(año);
          break;
        case 'compras-mes':
          result = await getComprasPorMes(año);
          break;
        case 'productos-top':
          result = await getProductosTopVentas(limite);
          break;
        case 'stock-categoria':
          result = await getStockPorCategoria();
          break;
        case 'stock-critico':
          result = await getProductosStockCritico(limite);
          break;
        case 'actividad-reciente':
          result = await getActividadReciente(limite);
          break;
        case 'estadisticas-ventas':
          result = await getEstadisticasVentas(periodo);
          break;
        case 'estadisticas-compras':
          result = await getEstadisticasCompras(periodo);
          break;
        case 'estadisticas-stock':
          result = await getEstadisticasStock();
          break;
        default:
          throw new Error(`Tipo de reporte no soportado: ${reportType}`);
      }

      if (result.error) {
        throw result.error;
      }

      setData(result.data);
      setLastFetch(Date.now());
    } catch (err) {
      console.error(`Error fetching ${reportType} data:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [reportType, periodo, limite, año]);

  // Verificar si los datos necesitan actualización
  const needsRefresh = useMemo(() => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > cacheTime;
  }, [lastFetch, cacheTime]);

  // Efecto para cargar datos
  useEffect(() => {
    if (needsRefresh) {
      fetchData();
    }
  }, [needsRefresh, fetchData]);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    setLastFetch(null);
    fetchData();
  }, [fetchData]);

  // Datos procesados con memoización
  const processedData = useMemo(() => {
    if (!data) return null;

    switch (reportType) {
      case 'ventas-mes':
      case 'compras-mes':
        return data.map(item => ({
          time: item.mes,
          value: item.ventas || item.compras || 0,
          cantidad: item.cantidad || 0
        }));
      
      case 'productos-top':
        return data.map(item => ({
          name: item.nombre,
          value: item.ingresos,
          cantidad: item.cantidadVendida
        }));
      
      case 'stock-categoria':
        return data.map(item => ({
          name: item.name,
          value: item.value,
          stock: item.stock,
          cantidad: item.cantidad
        }));
      
      case 'stock-critico':
        return data.map(item => ({
          id: item.id,
          nombre: item.nombre,
          stock: item.stock,
          estado: item.estado,
          valor: item.valor,
          proveedor: item.proveedor
        }));
      
      case 'actividad-reciente':
        return data.map(item => ({
          id: item.id,
          tipo: item.tipo,
          cliente: item.cliente,
          monto: item.monto,
          tiempo: item.tiempo,
          estado: item.estado
        }));
      
      default:
        return data;
    }
  }, [data, reportType]);

  return {
    data: processedData,
    loading,
    error,
    refresh,
    lastFetch
  };
};

/**
 * Hook para datos de dashboard con múltiples KPIs
 */
export const useDashboardData = () => {
  const dashboardStats = useReportData('dashboard');
  const ventasMes = useReportData('ventas-mes');
  const comprasMes = useReportData('compras-mes');
  const productosTop = useReportData('productos-top', { limite: 5 });
  const actividadReciente = useReportData('actividad-reciente', { limite: 5 });

  const loading = dashboardStats.loading || ventasMes.loading || comprasMes.loading || productosTop.loading || actividadReciente.loading;
  const error = dashboardStats.error || ventasMes.error || comprasMes.error || productosTop.error || actividadReciente.error;

  // Combinar datos de ventas y compras para gráfico comparativo
  const ventasComprasData = useMemo(() => {
    if (!ventasMes.data || !comprasMes.data) return [];
    
    const ventasMap = new Map(ventasMes.data.map(item => [item.time, item.value]));
    const comprasMap = new Map(comprasMes.data.map(item => [item.time, item.value]));
    
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return meses.map(mes => ({
      mes,
      ventas: ventasMap.get(mes) || 0,
      compras: comprasMap.get(mes) || 0
    }));
  }, [ventasMes.data, comprasMes.data]);

  return {
    stats: dashboardStats.data,
    ventasComprasData,
    productosTop: productosTop.data,
    actividadReciente: actividadReciente.data,
    loading,
    error,
    refresh: () => {
      dashboardStats.refresh();
      ventasMes.refresh();
      comprasMes.refresh();
      productosTop.refresh();
      actividadReciente.refresh();
    }
  };
};

/**
 * Hook para datos de reporte de ventas
 */
export const useVentasReport = (periodo = 'yearly') => {
  const estadisticas = useReportData('estadisticas-ventas', { periodo });
  const ventasMes = useReportData('ventas-mes');
  const productosTop = useReportData('productos-top', { limite: 10 });

  const loading = estadisticas.loading || ventasMes.loading || productosTop.loading;
  const error = estadisticas.error || ventasMes.error || productosTop.error;

  return {
    estadisticas: estadisticas.data,
    ventasMes: ventasMes.data,
    productosTop: productosTop.data,
    loading,
    error,
    refresh: () => {
      estadisticas.refresh();
      ventasMes.refresh();
      productosTop.refresh();
    }
  };
};

/**
 * Hook para datos de reporte de compras
 */
export const useComprasReport = (periodo = 'yearly') => {
  const estadisticas = useReportData('estadisticas-compras', { periodo });
  const comprasMes = useReportData('compras-mes');
  const stockCategoria = useReportData('stock-categoria');

  const loading = estadisticas.loading || comprasMes.loading || stockCategoria.loading;
  const error = estadisticas.error || comprasMes.error || stockCategoria.error;

  return {
    estadisticas: estadisticas.data,
    comprasMes: comprasMes.data,
    distribucionCategoria: stockCategoria.data,
    loading,
    error,
    refresh: () => {
      estadisticas.refresh();
      comprasMes.refresh();
      stockCategoria.refresh();
    }
  };
};

/**
 * Hook para datos de reporte de stock
 */
export const useStockReport = () => {
  const estadisticas = useReportData('estadisticas-stock');
  const stockCritico = useReportData('stock-critico', { limite: 20 });
  const stockCategoria = useReportData('stock-categoria');

  const loading = estadisticas.loading || stockCritico.loading || stockCategoria.loading;
  const error = estadisticas.error || stockCritico.error || stockCategoria.error;

  return {
    estadisticas: estadisticas.data,
    stockCritico: stockCritico.data,
    distribucionCategoria: stockCategoria.data,
    loading,
    error,
    refresh: () => {
      estadisticas.refresh();
      stockCritico.refresh();
      stockCategoria.refresh();
    }
  };
};
