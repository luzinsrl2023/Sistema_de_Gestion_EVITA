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
export const searchProducts = async (options = {}, legacyLimit) => {
  if (typeof options === 'string') {
    return searchProducts({ query: options, limit: legacyLimit ?? 12 });
  }

  const {
    query = '',
    limit = 12,
    offset = 0,
    filters = {}
  } = options;

  const trimmedQuery = query?.trim() ?? '';
  const sanitizedQuery = trimmedQuery
    ? trimmedQuery.replace(/[%_]/g, (char) => `\\${char}`).replace(/'/g, "''")
    : '';
  const wildcard = sanitizedQuery ? `%${sanitizedQuery}%` : null;

  const filterExpressions = wildcard
    ? [
        `nombre.ilike.${wildcard}`,
        `descripcion.ilike.${wildcard}`,
        `sku.ilike.${wildcard}`,
        `categoria.ilike.${wildcard}`
      ]
    : [];

  try {
    let builder = supabase
      .from('productos')
      .select(`
        id,
        nombre,
        descripcion,
        sku,
        categoria,
        precio,
        costo,
        stock,
        imagen_url,
        created_at,
        proveedores (
          id,
          nombre
        )
      `, { count: 'exact' });

    if (filterExpressions.length) {
      builder = builder.or(filterExpressions.join(','));
    }

    const categoryFilter = filters?.category;
    if (categoryFilter && categoryFilter !== 'all') {
      builder = builder.eq('categoria', categoryFilter);
    }

    const priceRange = filters?.priceRange || [];
    const minPrice = Number(priceRange[0]);
    if (!Number.isNaN(minPrice)) {
      builder = builder.gte('precio', minPrice);
    }
    const maxPrice = Number(priceRange[1]);
    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      builder = builder.lte('precio', maxPrice);
    }

    switch (filters?.stock) {
      case 'out_of_stock':
        builder = builder.eq('stock', 0);
        break;
      case 'low':
        builder = builder.lte('stock', 5);
        break;
      case 'available':
        builder = builder.gt('stock', 0);
        break;
      default:
        break;
    }

    const safeOffset = Math.max(0, offset | 0);
    const safeLimit = Math.min(Math.max(1, limit | 0), 50);

    builder = trimmedQuery
      ? builder.order('nombre', { ascending: true })
      : builder.order('created_at', { ascending: false });

    builder = builder.range(safeOffset, safeOffset + safeLimit - 1);

    const { data, error, count } = await builder;

    if (error) throw error;

    const mapped = (data || []).map((producto) => ({
      id: producto.id,
      name: producto.nombre,
      description: producto.descripcion,
      sku: producto.sku,
      category_name: producto.categoria,
      price: Number(producto.precio ?? 0),
      cost: Number(producto.costo ?? 0),
      stock: Number(producto.stock ?? 0),
      image: producto.imagen_url || null,
      supplier_id: producto.proveedores?.id ?? null,
      supplier_name: producto.proveedores?.nombre ?? null,
    }));

    const hasMore = typeof count === 'number'
      ? safeOffset + mapped.length < count
      : mapped.length === safeLimit;

    return {
      data: mapped,
      count: typeof count === 'number' ? count : mapped.length,
      hasMore,
      error: null
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return { data: null, count: 0, hasMore: false, error };
  }
};

export const getProductoFilters = async () => {
  try {
    const [categoriesRes, minPriceRes, maxPriceRes, maxStockRes] = await Promise.all([
      supabase
        .from('productos')
        .select('categoria')
        .not('categoria', 'is', null),
      supabase
        .from('productos')
        .select('precio')
        .order('precio', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('productos')
        .select('precio')
        .order('precio', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('productos')
        .select('stock')
        .order('stock', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (categoriesRes.error) throw categoriesRes.error;
    if (minPriceRes.error) throw minPriceRes.error;
    if (maxPriceRes.error) throw maxPriceRes.error;
    if (maxStockRes.error) throw maxStockRes.error;

    const categories = Array.from(
      new Set((categoriesRes.data || []).map((row) => row?.categoria).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'es'));

    const minPrice = Number(minPriceRes.data?.precio ?? 0) || 0;
    const maxPrice = Number(maxPriceRes.data?.precio ?? minPrice) || minPrice;
    const maxStock = Number(maxStockRes.data?.stock ?? 0) || 0;

    return {
      data: {
        categories,
        priceRange: [minPrice, maxPrice],
        maxStock
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching product filters:', error);
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

