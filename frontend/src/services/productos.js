import { supabase } from '../lib/supabaseClient';

// Obtener todos los productos con información del proveedor
export const getProductos = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        proveedores (
          id,
          nombre,
          email,
          telefono
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching productos:', error);
    return { data: null, error };
  }
};

// Obtener producto por ID
export const getProductoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        proveedores (
          id,
          nombre,
          email,
          telefono
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching producto:', error);
    return { data: null, error };
  }
};

// Crear nuevo producto
export const createProducto = async (productoData) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([productoData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating producto:', error);
    return { data: null, error };
  }
};

// Actualizar producto
export const updateProducto = async (id, productoData) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update(productoData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating producto:', error);
    return { data: null, error };
  }
};

// Eliminar producto
export const deleteProducto = async (id) => {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting producto:', error);
    return { error };
  }
};

// Actualizar stock de producto
export const updateStock = async (id, nuevoStock) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating stock:', error);
    return { data: null, error };
  }
};

// Obtener productos con stock bajo (menos de 10 unidades)
export const getProductosStockBajo = async (limite = 10) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        proveedores (
          nombre
        )
      `)
      .lt('stock', limite)
      .order('stock', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching productos stock bajo:', error);
    return { data: null, error };
  }
};

// Buscar productos por SKU o nombre
export const searchProducts = async (query) => {
  if (!query) return { data: [], error: null };
  try {
    const { data, error } = await supabase.functions.invoke('search-products', {
      body: { query },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching products:', error);
    return { data: null, error };
  }
};

// Funciones de compatibilidad con el código existente
export async function listProductos() {
  const { data } = await getProductos();
  return data || [];
}

export async function upsertProducto(producto) {
  if (producto.id) {
    const { data } = await updateProducto(producto.id, producto);
    return data;
  } else {
    const { data } = await createProducto(producto);
    return data;
  }
}

