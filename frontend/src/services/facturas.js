import { supabase } from '../lib/supabaseClient';

// Obtener todas las facturas con información de venta y cliente
export const getFacturas = async () => {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .select(`
        *,
        ventas (
          id,
          fecha,
          total,
          estado,
          clientes (
            id,
            nombre,
            email,
            telefono
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching facturas:', error);
    return { data: null, error };
  }
};

// Obtener factura por ID
export const getFacturaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .select(`
        *,
        ventas (
          id,
          fecha,
          total,
          estado,
          clientes (
            id,
            nombre,
            email,
            telefono,
            direccion
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching factura:', error);
    return { data: null, error };
  }
};

// Crear nueva factura
export const createFactura = async (facturaData) => {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .insert([facturaData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating factura:', error);
    return { data: null, error };
  }
};

// Actualizar factura
export const updateFactura = async (id, facturaData) => {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .update(facturaData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating factura:', error);
    return { data: null, error };
  }
};

// Eliminar factura
export const deleteFactura = async (id) => {
  try {
    const { error } = await supabase
      .from('facturas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting factura:', error);
    return { error };
  }
};

// Funciones de compatibilidad con el código existente
export async function listFacturas() {
  const { data } = await getFacturas();
  return data || [];
}

export async function createFacturaLegacy(factura) {
  const { data } = await createFactura(factura);
  return data;
}

export async function updateFacturaLegacy(id, patch) {
  const { data } = await updateFactura(id, patch);
  return data;
}

export async function deleteFacturaLegacy(id) {
  const { error } = await deleteFactura(id);
  return error ? null : { id };
}

// Generar número de factura automático
export const generateNumeroFactura = async () => {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .select('numero_factura')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    let lastNumber = 0;
    if (data && data.length > 0) {
      const lastFactura = data[0].numero_factura;
      const numberPart = lastFactura.replace(/\D/g, '');
      lastNumber = parseInt(numberPart) || 0;
    }

    const nextNumber = lastNumber + 1;
    return `FAC-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating numero factura:', error);
    return `FAC-${String(Date.now()).slice(-6)}`;
  }
};

// Marcar factura como pagada
export const marcarFacturaPagada = async (id) => {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .update({ estado: 'pagada' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking factura as paid:', error);
    return { data: null, error };
  }
};

