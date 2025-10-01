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
export const searchProducts = async (query, limit = 15) => {
  const trimmedQuery = query?.trim();
  if (!trimmedQuery) {
    return { data: [], error: null };
  }

  const sanitized = trimmedQuery.replace(/[%_]/g, (char) => `\\${char}`).replace(/'/g, "''");
  const wildcard = `%${sanitized}%`;
  const filters = [
    `nombre.ilike.${wildcard}`,
    `descripcion.ilike.${wildcard}`,
    `sku.ilike.${wildcard}`,
    `categoria.ilike.${wildcard}`
  ].join(',');

  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id,
        nombre,
        descripcion,
        sku,
        categoria,
        precio,
        costo,
        proveedores (
          id,
          nombre
        )
      `)
      .or(filters)
      .order('nombre', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const mapped = (data || []).map((producto) => ({
      id: producto.id,
      name: producto.nombre,
      description: producto.descripcion,
      sku: producto.sku,
      category_name: producto.categoria,
      price: Number(producto.precio ?? 0),
      cost: Number(producto.costo ?? 0),
      supplier_id: producto.proveedores?.id ?? null,
      supplier_name: producto.proveedores?.nombre ?? null,
    }));

    return { data: mapped, error: null };
  } catch (error) {
    console.error('Error searching products:', error);
    return { data: null, error };
  }
};

export const updateProductosPorProveedor = async (proveedorId, porcentajeAumento) => {
  try {
    const factor = 1 + (Number(porcentajeAumento) || 0) / 100;
    const timestamp = new Date().toISOString();

    const { data: productos, error } = await supabase
      .from('productos')
      .select('id, costo, precio')
      .eq('proveedor_id', proveedorId);

    if (error) throw error;

    if (!productos || productos.length === 0) {
      return { data: [], updated: 0, error: null };
    }

    const updates = productos
      .map((producto) => {
        const costo = Number(producto.costo ?? 0);
        const precioActual = Number(producto.precio ?? 0);
        const base = costo > 0 ? costo : precioActual;
        if (!base || !isFinite(base)) {
          return null;
        }

        const nuevoPrecio = parseFloat((base * factor).toFixed(2));
        if (!nuevoPrecio || !isFinite(nuevoPrecio) || nuevoPrecio <= 0) {
          return null;
        }

        return {
          id: producto.id,
          precio: nuevoPrecio,
          updated_at: timestamp,
        };
      })
      .filter(Boolean);

    if (!updates.length) {
      return { data: [], updated: 0, error: null };
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('productos')
      .upsert(updates, { onConflict: 'id' })
      .select('id, precio');

    if (updateError) throw updateError;

    return { data: updatedRows, updated: updates.length, error: null };
  } catch (error) {
    console.error('Error updating product prices by proveedor:', error);
    return { data: null, updated: 0, error };
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

