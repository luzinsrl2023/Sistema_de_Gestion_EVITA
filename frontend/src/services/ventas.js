import { supabase } from '../lib/supabaseClient';

// Obtener todas las ventas con información del cliente y los productos vendidos
export const getVentas = async () => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes (
          id,
          nombre,
          email,
          telefono
        ),
        venta_detalle (
          cantidad,
          precio_unitario,
          productos (
            id,
            nombre,
            descripcion
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching ventas:', error);
    return { data: null, error };
  }
};

// Obtener venta por ID
export const getVentaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes (
          id,
          nombre,
          email,
          telefono,
          direccion
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching venta:', error);
    return { data: null, error };
  }
};

// Crear nueva venta
export const createVenta = async (ventaData) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .insert([ventaData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating venta:', error);
    return { data: null, error };
  }
};

// Actualizar venta
export const updateVenta = async (id, ventaData) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .update(ventaData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating venta:', error);
    return { data: null, error };
  }
};

// Eliminar venta
export const deleteVenta = async (id) => {
  try {
    const { error } = await supabase
      .from('ventas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting venta:', error);
    return { error };
  }
};

// Obtener ventas por estado
export const getVentasByEstado = async (estado) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes (
          nombre
        )
      `)
      .eq('estado', estado)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching ventas by estado:', error);
    return { data: null, error };
  }
};

// Obtener ventas del mes actual
export const getVentasMesActual = async () => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes (
          nombre
        )
      `)
      .gte('fecha', startOfMonth.toISOString().split('T')[0])
      .lte('fecha', endOfMonth.toISOString().split('T')[0])
      .order('fecha', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching ventas mes actual:', error);
    return { data: null, error };
  }
};

// Obtener estadísticas de ventas
export const getEstadisticasVentas = async () => {
  try {
    // Total de ventas
    const { data: totalVentas, error: errorTotal } = await supabase
      .from('ventas')
      .select('total')
      .eq('estado', 'pagada');

    if (errorTotal) throw errorTotal;

    const totalMonto = totalVentas?.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0) || 0;
    const cantidadVentas = totalVentas?.length || 0;

    // Ventas del mes actual
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const { data: ventasMes, error: errorMes } = await supabase
      .from('ventas')
      .select('total')
      .eq('estado', 'pagada')
      .gte('fecha', startOfMonth.toISOString().split('T')[0]);

    if (errorMes) throw errorMes;

    const totalMes = ventasMes?.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0) || 0;

    return {
      data: {
        totalMonto,
        cantidadVentas,
        totalMes,
        cantidadVentasMes: ventasMes?.length || 0,
        promedioVenta: cantidadVentas > 0 ? totalMonto / cantidadVentas : 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching estadisticas ventas:', error);
    return { data: null, error };
  }
};