import { supabase } from '../lib/supabaseClient';
import { enqueueOperation } from '../lib/offlineQueue';

// Obtener todas las órdenes con información del proveedor y detalles
export const getOrdenes = async () => {
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .select(`
        *,
        proveedores (
          id,
          nombre,
          email,
          telefono
        ),
        orden_detalle (
          id,
          cantidad,
          precio_unitario,
          subtotal,
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
    console.error('Error fetching ordenes:', error);
    return { data: null, error };
  }
};

// Obtener orden por ID
export const getOrdenById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .select(`
        *,
        proveedores (
          id,
          nombre,
          email,
          telefono,
          direccion
        ),
        orden_detalle (
          id,
          cantidad,
          precio_unitario,
          subtotal,
          productos (
            id,
            nombre,
            descripcion,
            precio,
            stock
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching orden:', error);
    return { data: null, error };
  }
};

// Crear nueva orden
export const createOrden = async (ordenData) => {
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .insert([ordenData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating orden:', error);
    if (!navigator.onLine) {
      enqueueOperation({ type: 'insert', table: 'ordenes', payload: ordenData });
      return { data: ordenData, queued: true, error: null };
    }
    return { data: null, error };
  }
};

// Actualizar orden
export const updateOrden = async (id, ordenData) => {
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .update(ordenData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating orden:', error);
    if (!navigator.onLine) {
      enqueueOperation({ type: 'update', table: 'ordenes', payload: ordenData, match: { id } });
      return { data: { id, ...ordenData }, queued: true, error: null };
    }
    return { data: null, error };
  }
};

// Eliminar orden
export const deleteOrden = async (id) => {
  try {
    const { error } = await supabase
      .from('ordenes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting orden:', error);
    if (!navigator.onLine) {
      enqueueOperation({ type: 'delete', table: 'ordenes', payload: { id } });
      return { error: null, queued: true };
    }
    return { error };
  }
};

// Crear orden con detalles (transacción)
export const createOrdenConDetalles = async (ordenData, detalles) => {
  try {
    // Crear la orden
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .insert([ordenData])
      .select()
      .single();

    if (ordenError) throw ordenError;

    // Agregar orden_id a cada detalle
    const detallesConOrden = detalles.map(detalle => ({
      ...detalle,
      orden_id: orden.id
    }));

    // Crear los detalles
    const { data: detallesCreados, error: detallesError } = await supabase
      .from('orden_detalle')
      .insert(detallesConOrden)
      .select(`
        *,
        productos (
          nombre,
          descripcion
        )
      `);

    if (detallesError) throw detallesError;

    return { 
      data: { 
        ...orden, 
        orden_detalle: detallesCreados 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating orden con detalles:', error);
    return { data: null, error };
  }
};

// Agregar detalle a orden existente
export const addDetalleToOrden = async (ordenId, detalleData) => {
  try {
    const { data, error } = await supabase
      .from('orden_detalle')
      .insert([{ ...detalleData, orden_id: ordenId }])
      .select(`
        *,
        productos (
          nombre,
          descripcion
        )
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding detalle to orden:', error);
    if (!navigator.onLine) {
      enqueueOperation({ type: 'insert', table: 'orden_detalle', payload: { ...detalleData, orden_id: ordenId } });
      return { data: { ...detalleData, orden_id: ordenId }, queued: true, error: null };
    }
    return { data: null, error };
  }
};

// Actualizar detalle de orden
export const updateOrdenDetalle = async (detalleId, detalleData) => {
  try {
    const { data, error } = await supabase
      .from('orden_detalle')
      .update(detalleData)
      .eq('id', detalleId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating orden detalle:', error);
    if (!navigator.onLine) {
      enqueueOperation({ type: 'update', table: 'orden_detalle', payload: detalleData, match: { id: detalleId } });
      return { data: { id: detalleId, ...detalleData }, queued: true, error: null };
    }
    return { data: null, error };
  }
};

// Eliminar detalle de orden
export const deleteOrdenDetalle = async (detalleId) => {
  try {
    const { error } = await supabase
      .from('orden_detalle')
      .delete()
      .eq('id', detalleId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting orden detalle:', error);
    if (!navigator.onLine) {
      enqueueOperation({ type: 'delete', table: 'orden_detalle', payload: { id: detalleId } });
      return { error: null, queued: true };
    }
    return { error };
  }
};

// Marcar orden como recibida y actualizar stock de productos
export const recibirOrden = async (ordenId) => {
  try {
    // Obtener la orden con sus detalles
    const { data: orden, error: ordenError } = await getOrdenById(ordenId);
    if (ordenError) throw ordenError;

    // Actualizar stock de cada producto
    for (const detalle of orden.orden_detalle) {
      const nuevoStock = detalle.productos.stock + detalle.cantidad;
      
      const { error: stockError } = await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', detalle.productos.id);

      if (stockError) throw stockError;
    }

    // Marcar orden como recibida
    const { data, error } = await supabase
      .from('ordenes')
      .update({ estado: 'recibida' })
      .eq('id', ordenId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error receiving orden:', error);
    if (!navigator.onLine) {
      enqueueOperation({ type: 'update', table: 'ordenes', payload: { estado: 'recibida' }, match: { id: ordenId } });
      // Nota: para stocks, encolar una operación por producto
      try {
        const { data: orden } = await getOrdenById(ordenId)
        for (const detalle of (orden?.orden_detalle || [])) {
          enqueueOperation({ type: 'update', table: 'productos', payload: { stock: (detalle.productos.stock || 0) + detalle.cantidad }, match: { id: detalle.productos.id } })
        }
      } catch {}
      return { data: { id: ordenId, estado: 'recibida' }, queued: true, error: null };
    }
    return { data: null, error };
  }
};