import { supabase } from '../lib/supabaseClient';

// Guardar una nueva cotización
export const saveCotizacion = async (cotizacionData) => {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const payload = {
      codigo: cotizacionData.id, // Usar el código generado como identificador único
      cliente_nombre: cotizacionData.cliente_nombre,
      cliente_email: cotizacionData.cliente_email,
      fecha: cotizacionData.fecha,
      validez_dias: cotizacionData.validez_dias,
      notas: cotizacionData.notas,
      subtotal: cotizacionData.subtotal,
      iva: cotizacionData.iva,
      total: cotizacionData.total,
      items: cotizacionData.items,
      estado: 'abierta',
      usuario_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Insertando cotización en Supabase:', payload);

    const { data, error } = await supabase
      .from('cotizaciones')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }
    
    console.log('Cotización guardada exitosamente:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error saving cotizacion:', error);
    return { data: null, error };
  }
};

// Obtener todas las cotizaciones con filtros opcionales
export const getCotizaciones = async (options = {}) => {
  try {
    const {
      busqueda = '',
      fechaDesde = null,
      fechaHasta = null,
      limite = 50,
      desplazamiento = 0
    } = options;

    let query = supabase
      .from('cotizaciones')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .range(desplazamiento, desplazamiento + limite - 1);

    // Aplicar filtros si existen
    if (busqueda) {
      query = query.or(`cliente_nombre.ilike.%${busqueda}%,id.ilike.%${busqueda}%,notas.ilike.%${busqueda}%`);
    }

    if (fechaDesde) {
      query = query.gte('fecha', fechaDesde);
    }

    if (fechaHasta) {
      query = query.lte('fecha', fechaHasta);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching cotizaciones:', error);
    return { data: [], count: 0, error };
  }
};

// Obtener una cotización por ID
export const getCotizacionById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cotizacion:', error);
    return { data: null, error };
  }
};

// Actualizar una cotización
export const updateCotizacion = async (id, cotizacionData) => {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .update({
        ...cotizacionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating cotizacion:', error);
    return { data: null, error };
  }
};

// Eliminar una cotización
export const deleteCotizacion = async (id) => {
  try {
    const { error } = await supabase
      .from('cotizaciones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting cotizacion:', error);
    return { error };
  }
};

// Obtener estadísticas de cotizaciones
export const getCotizacionesStats = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_cotizaciones_stats');

    if (error) throw error;

    return {
      data: {
        totalCotizaciones: Number(data[0]?.total_cotizaciones || 0),
        cotizacionesMes: Number(data[0]?.cotizaciones_mes || 0),
        valorTotalMes: Number(data[0]?.valor_total_mes || 0),
        promedioPorCotizacion: Number(data[0]?.promedio_por_cotizacion || 0)
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching cotizaciones stats:', error);
    return { data: null, error };
  }
};

// Funciones de compatibilidad con el código existente
export async function listCotizaciones() {
  const { data } = await getCotizaciones();
  return data || [];
}

export async function upsertCotizacion(cotizacion) {
  if (cotizacion.id) {
    const { data } = await updateCotizacion(cotizacion.id, cotizacion);
    return data;
  } else {
    const { data } = await saveCotizacion(cotizacion);
    return data;
  }
}
