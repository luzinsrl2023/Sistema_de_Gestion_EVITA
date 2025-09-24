import { supabase } from '../lib/supabaseClient';

// Obtener todos los clientes
export const getClientes = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching clientes:', error);
    return { data: null, error };
  }
};

// Obtener cliente por ID
export const getClienteById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cliente:', error);
    return { data: null, error };
  }
};

// Crear nuevo cliente
export const createCliente = async (clienteData) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([clienteData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating cliente:', error);
    return { data: null, error };
  }
};

// Actualizar cliente
export const updateCliente = async (id, clienteData) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating cliente:', error);
    return { data: null, error };
  }
};

// Eliminar cliente
export const deleteCliente = async (id) => {
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting cliente:', error);
    return { error };
  }
};

// Obtener clientes con historial de ventas
export const getClientesConHistorial = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        ventas (
          id,
          fecha,
          total,
          estado
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Calcular estadísticas para cada cliente
    const clientesConStats = data.map(cliente => {
      const ventas = cliente.ventas || [];
      const totalPurchases = ventas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
      const lastPurchase = ventas.length > 0 
        ? ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0].fecha
        : null;
      const ventasPendientes = ventas.filter(v => v.estado === 'pendiente').length;
      const paymentStatus = ventasPendientes > 0 ? 'pendiente' : 'pagado';
      
      return {
        id: cliente.id,
        name: cliente.nombre,
        email: cliente.email,
        phone: cliente.telefono,
        address: cliente.direccion,
        totalPurchases,
        lastPurchase,
        paymentStatus,
        status: 'activo' // Por defecto, podrías agregar este campo a la tabla si es necesario
      };
    });
    
    return { data: clientesConStats, error: null };
  } catch (error) {
    console.error('Error fetching clientes con historial:', error);
    return { data: null, error };
  }
};

// Funciones de compatibilidad con el código existente
export async function listClientes() {
  const { data } = await getClientesConHistorial();
  return data || [];
}

