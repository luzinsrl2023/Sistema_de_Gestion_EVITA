import { supabase } from '../lib/supabaseClient';

// Obtener todos los proveedores
export const getProveedores = async () => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching proveedores:', error);
    return { data: null, error };
  }
};

// Obtener proveedor por ID
export const getProveedorById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching proveedor:', error);
    return { data: null, error };
  }
};

// Crear nuevo proveedor
export const createProveedor = async (proveedorData) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .insert([proveedorData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating proveedor:', error);
    return { data: null, error };
  }
};

// Actualizar proveedor
export const updateProveedor = async (id, proveedorData) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .update(proveedorData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating proveedor:', error);
    return { data: null, error };
  }
};

// Eliminar proveedor
export const deleteProveedor = async (id) => {
  try {
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting proveedor:', error);
    return { error };
  }
};