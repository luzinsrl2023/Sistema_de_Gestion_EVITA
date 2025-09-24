import { supabase } from '../lib/supabaseClient';

// Obtener todas las cotizaciones con información del cliente
export const getCotizaciones = async () => {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes (
          id,
          nombre,
          email,
          telefono
        ),
        ventas (
          id,
          estado
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cotizaciones:', error);
    return { data: null, error };
  }
};

// Crear nueva cotización
export const createCotizacion = async (cotizacionData) => {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .insert([cotizacionData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating cotizacion:', error);
    return { data: null, error };
  }
};

// Actualizar cotización
export const updateCotizacion = async (id, cotizacionData) => {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .update(cotizacionData)
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

// Eliminar cotización
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

// Funciones de compatibilidad
export async function listCotizaciones() {
  const { data } = await getCotizaciones();
  return data || [];
}

// Convertir cotización a venta
export const convertirCotizacionAVenta = async (cotizacionId, ventaData) => {
  try {
    // Crear la venta
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert([ventaData])
      .select()
      .single();

    if (ventaError) throw ventaError;

    // Actualizar la cotización con el ID de la venta
    const { data: cotizacion, error: cotizacionError } = await supabase
      .from('cotizaciones')
      .update({ 
        estado: 'aprobada',
        venta_id: venta.id 
      })
      .eq('id', cotizacionId)
      .select()
      .single();

    if (cotizacionError) throw cotizacionError;

    return { data: { venta, cotizacion }, error: null };
  } catch (error) {
    console.error('Error converting cotizacion to venta:', error);
    return { data: null, error };
  }
};

