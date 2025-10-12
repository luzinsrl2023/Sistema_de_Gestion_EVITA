import { supabase } from '../lib/supabaseClient';

/**
 * Servicio centralizado para obtener datos agregados para reportes
 * Conecta directamente con Supabase para obtener datos reales
 */

// Utilidades para formateo de fechas
const getDateRange = (periodo = 'yearly') => {
  const now = new Date();
  const start = new Date();
  
  switch (periodo) {
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarterly':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'yearly':
    default:
      start.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Obtiene estadísticas generales del dashboard
 */
export const getEstadisticasDashboard = async () => {
  try {
    const { start, end } = getDateRange('yearly');
    
    // Obtener estadísticas en paralelo
    const [
      ventasResult,
      clientesResult,
      productosResult,
      stockResult
    ] = await Promise.all([
      // Ventas totales del año
      supabase
        .from('ventas')
        .select('total')
        .eq('estado', 'pagada')
        .gte('fecha', start)
        .lte('fecha', end),
      
      // Nuevos clientes del mes actual
      supabase
        .from('clientes')
        .select('id')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      
      // Total de productos activos
      supabase
        .from('productos')
        .select('id')
        .gt('stock', 0),
      
      // Valor total del inventario
      supabase
        .from('productos')
        .select('stock, precio')
    ]);

    if (ventasResult.error) throw ventasResult.error;
    if (clientesResult.error) throw clientesResult.error;
    if (productosResult.error) throw productosResult.error;
    if (stockResult.error) throw stockResult.error;

    // Calcular totales
    const ingresosTotales = ventasResult.data?.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0) || 0;
    const nuevosClientes = clientesResult.data?.length || 0;
    const totalProductos = productosResult.data?.length || 0;
    const valorInventario = stockResult.data?.reduce((sum, producto) => 
      sum + (parseFloat(producto.stock || 0) * parseFloat(producto.precio || 0)), 0) || 0;

    return {
      data: {
        ingresosTotales: formatCurrency(ingresosTotales),
        ingresosTotalesNumero: ingresosTotales,
        nuevosClientes,
        totalProductos,
        valorInventario: formatCurrency(valorInventario),
        valorInventarioNumero: valorInventario
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return { data: null, error };
  }
};

/**
 * Obtiene datos de ventas por mes para gráficos
 */
export const getVentasPorMes = async (año = new Date().getFullYear()) => {
  try {
    const startDate = `${año}-01-01`;
    const endDate = `${año}-12-31`;

    const { data, error } = await supabase
      .from('ventas')
      .select(`
        fecha,
        total,
        estado,
        clientes (
          nombre
        )
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'pagada')
      .order('fecha', { ascending: true });

    if (error) throw error;

    // Agrupar por mes
    const ventasPorMes = {};
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    // Inicializar todos los meses con 0
    meses.forEach(mes => {
      ventasPorMes[mes] = { ventas: 0, cantidad: 0 };
    });

    // Agregar datos reales
    data?.forEach(venta => {
      const mes = meses[new Date(venta.fecha).getMonth()];
      ventasPorMes[mes].ventas += parseFloat(venta.total || 0);
      ventasPorMes[mes].cantidad += 1;
    });

    // Convertir a formato para gráficos
    const chartData = meses.map(mes => ({
      mes,
      ventas: ventasPorMes[mes].ventas,
      cantidad: ventasPorMes[mes].cantidad
    }));

    return { data: chartData, error: null };
  } catch (error) {
    console.error('Error fetching ventas por mes:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene datos de compras por mes para gráficos
 */
export const getComprasPorMes = async (año = new Date().getFullYear()) => {
  try {
    const startDate = `${año}-01-01`;
    const endDate = `${año}-12-31`;

    const { data, error } = await supabase
      .from('ordenes')
      .select(`
        fecha,
        total,
        estado,
        proveedores (
          nombre
        )
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .eq('estado', 'recibida')
      .order('fecha', { ascending: true });

    if (error) throw error;

    // Agrupar por mes
    const comprasPorMes = {};
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    // Inicializar todos los meses con 0
    meses.forEach(mes => {
      comprasPorMes[mes] = { compras: 0, cantidad: 0 };
    });

    // Agregar datos reales
    data?.forEach(compra => {
      const mes = meses[new Date(compra.fecha).getMonth()];
      comprasPorMes[mes].compras += parseFloat(compra.total || 0);
      comprasPorMes[mes].cantidad += 1;
    });

    // Convertir a formato para gráficos
    const chartData = meses.map(mes => ({
      mes,
      compras: comprasPorMes[mes].compras,
      cantidad: comprasPorMes[mes].cantidad
    }));

    return { data: chartData, error: null };
  } catch (error) {
    console.error('Error fetching compras por mes:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene los productos más vendidos
 */
export const getProductosTopVentas = async (limite = 10) => {
  try {
    const { data, error } = await supabase
      .from('venta_detalle')
      .select(`
        cantidad,
        precio_unitario,
        productos (
          id,
          nombre,
          descripcion
        )
      `)
      .order('cantidad', { ascending: false })
      .limit(limite);

    if (error) throw error;

    // Agrupar por producto
    const productosAgrupados = {};
    
    data?.forEach(detalle => {
      const producto = detalle.productos;
      if (!productosAgrupados[producto.id]) {
        productosAgrupados[producto.id] = {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          cantidadVendida: 0,
          ingresos: 0
        };
      }
      
      productosAgrupados[producto.id].cantidadVendida += detalle.cantidad;
      productosAgrupados[producto.id].ingresos += detalle.cantidad * parseFloat(detalle.precio_unitario);
    });

    // Convertir a array y ordenar por ingresos
    const topProductos = Object.values(productosAgrupados)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, limite);

    return { data: topProductos, error: null };
  } catch (error) {
    console.error('Error fetching top productos:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene distribución de stock por categoría
 */
export const getStockPorCategoria = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        stock,
        precio,
        nombre
      `)
      .order('nombre', { ascending: true });

    if (error) throw error;

    // Categorizar productos por nombre (simplificado)
    const categorias = {
      'Limpieza': { stock: 0, valor: 0, cantidad: 0 },
      'Electricidad': { stock: 0, valor: 0, cantidad: 0 },
      'Artículos Generales': { stock: 0, valor: 0, cantidad: 0 }
    };

    data?.forEach(producto => {
      let categoria = 'Artículos Generales'; // Default
      
      if (producto.nombre.toLowerCase().includes('limpiador') || 
          producto.nombre.toLowerCase().includes('jabón') ||
          producto.nombre.toLowerCase().includes('desinfectante') ||
          producto.nombre.toLowerCase().includes('papel') ||
          producto.nombre.toLowerCase().includes('detergente') ||
          producto.nombre.toLowerCase().includes('escobillón') ||
          producto.nombre.toLowerCase().includes('trapo')) {
        categoria = 'Limpieza';
      } else if (producto.nombre.toLowerCase().includes('bombilla') ||
                 producto.nombre.toLowerCase().includes('cable') ||
                 producto.nombre.toLowerCase().includes('enchufe') ||
                 producto.nombre.toLowerCase().includes('interruptor') ||
                 producto.nombre.toLowerCase().includes('led') ||
                 producto.nombre.toLowerCase().includes('red')) {
        categoria = 'Electricidad';
      }

      categorias[categoria].stock += parseInt(producto.stock || 0);
      categorias[categoria].valor += parseInt(producto.stock || 0) * parseFloat(producto.precio || 0);
      categorias[categoria].cantidad += 1;
    });

    // Convertir a formato para gráficos
    const chartData = Object.entries(categorias).map(([nombre, datos]) => ({
      name: nombre,
      value: datos.valor,
      stock: datos.stock,
      cantidad: datos.cantidad
    }));

    return { data: chartData, error: null };
  } catch (error) {
    console.error('Error fetching stock por categoria:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene productos con stock crítico
 */
export const getProductosStockCritico = async (limiteStock = 10) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id,
        nombre,
        stock,
        precio,
        proveedores (
          nombre
        )
      `)
      .lte('stock', limiteStock)
      .order('stock', { ascending: true });

    if (error) throw error;

    const productosCriticos = data?.map(producto => ({
      id: producto.id,
      nombre: producto.nombre,
      stock: parseInt(producto.stock || 0),
      precio: parseFloat(producto.precio || 0),
      proveedor: producto.proveedores?.nombre || 'Sin proveedor',
      estado: producto.stock === 0 ? 'agotado' : producto.stock <= 5 ? 'critico' : 'bajo',
      valor: parseInt(producto.stock || 0) * parseFloat(producto.precio || 0)
    })) || [];

    return { data: productosCriticos, error: null };
  } catch (error) {
    console.error('Error fetching productos stock critico:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene actividad reciente (últimas ventas y compras)
 */
export const getActividadReciente = async (limite = 10) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id,
        fecha,
        total,
        estado,
        clientes (
          nombre
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw error;

    const actividad = data?.map(venta => ({
      id: venta.id,
      tipo: 'venta',
      cliente: venta.clientes?.nombre || 'Cliente sin nombre',
      monto: parseFloat(venta.total || 0),
      fecha: venta.fecha,
      estado: venta.estado,
      tiempo: calcularTiempoTranscurrido(venta.created_at)
    })) || [];

    return { data: actividad, error: null };
  } catch (error) {
    console.error('Error fetching actividad reciente:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene estadísticas de ventas para reporte detallado
 */
export const getEstadisticasVentas = async (periodo = 'yearly') => {
  try {
    const { start, end } = getDateRange(periodo);
    
    const { data, error } = await supabase
      .from('ventas')
      .select('total, estado, fecha')
      .gte('fecha', start)
      .lte('fecha', end)
      .eq('estado', 'pagada');

    if (error) throw error;

    const totalVentas = data?.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0) || 0;
    const cantidadVentas = data?.length || 0;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    return {
      data: {
        totalVentas: formatCurrency(totalVentas),
        totalVentasNumero: totalVentas,
        cantidadVentas,
        promedioVenta: formatCurrency(promedioVenta),
        promedioVentaNumero: promedioVenta
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching estadisticas ventas:', error);
    return { data: null, error };
  }
};

/**
 * Obtiene estadísticas de compras para reporte detallado
 */
export const getEstadisticasCompras = async (periodo = 'yearly') => {
  try {
    const { start, end } = getDateRange(periodo);
    
    const { data, error } = await supabase
      .from('ordenes')
      .select('total, estado, fecha, proveedores (nombre)')
      .gte('fecha', start)
      .lte('fecha', end)
      .eq('estado', 'recibida');

    if (error) throw error;

    const totalCompras = data?.reduce((sum, compra) => sum + parseFloat(compra.total || 0), 0) || 0;
    const cantidadCompras = data?.length || 0;
    const promedioCompra = cantidadCompras > 0 ? totalCompras / cantidadCompras : 0;
    
    // Proveedor principal
    const proveedoresCount = {};
    data?.forEach(compra => {
      const proveedor = compra.proveedores?.nombre || 'Sin proveedor';
      proveedoresCount[proveedor] = (proveedoresCount[proveedor] || 0) + 1;
    });
    
    const proveedorPrincipal = Object.entries(proveedoresCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    return {
      data: {
        totalCompras: formatCurrency(totalCompras),
        totalComprasNumero: totalCompras,
        cantidadCompras,
        promedioCompra: formatCurrency(promedioCompra),
        promedioCompraNumero: promedioCompra,
        proveedorPrincipal,
        totalProveedores: Object.keys(proveedoresCount).length
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching estadisticas compras:', error);
    return { data: null, error };
  }
};

/**
 * Obtiene estadísticas de stock para reporte detallado
 */
export const getEstadisticasStock = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('stock, precio');

    if (error) throw error;

    const totalProductos = data?.length || 0;
    const stockBajo = data?.filter(p => parseInt(p.stock || 0) <= 10).length || 0;
    const stockAgotado = data?.filter(p => parseInt(p.stock || 0) === 0).length || 0;
    const valorInventario = data?.reduce((sum, producto) => 
      sum + (parseInt(producto.stock || 0) * parseFloat(producto.precio || 0)), 0) || 0;

    return {
      data: {
        totalProductos,
        stockBajo,
        stockAgotado,
        stockNormal: totalProductos - stockBajo - stockAgotado,
        valorInventario: formatCurrency(valorInventario),
        valorInventarioNumero: valorInventario
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching estadisticas stock:', error);
    return { data: null, error };
  }
};

// Utilidades auxiliares
const calcularTiempoTranscurrido = (fecha) => {
  const ahora = new Date();
  const fechaVenta = new Date(fecha);
  const diffMs = ahora - fechaVenta;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `Hace ${diffMins} min`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else {
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
};

// Exportar utilidades para uso en otros módulos
export { formatCurrency, getDateRange };
