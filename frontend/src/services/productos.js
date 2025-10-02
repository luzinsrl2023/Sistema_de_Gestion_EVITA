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

// Buscar productos por SKU o nombre usando la función de Supabase
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

  // Si no hay query, usar búsqueda tradicional
  if (!trimmedQuery) {
    try {
      let builder = supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          sku,
          categoria_id,
          categorias(nombre),
          precio,
          precio_final,
          costo,
          stock,
          imagen_url,
          created_at,
          proveedores (
            id,
            nombre
          )
        `, { count: 'exact' });

      const categoryFilter = filters?.category;
      if (categoryFilter && categoryFilter !== 'all') {
        builder = builder.eq('categorias.nombre', categoryFilter);
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

      builder = builder.order('created_at', { ascending: false });
      builder = builder.range(safeOffset, safeOffset + safeLimit - 1);

      const { data, error, count } = await builder;

      if (error) throw error;

      const mapped = (data || []).map((producto) => ({
        id: producto.id,
        name: producto.nombre,
        description: producto.descripcion,
        sku: producto.sku,
        category_name: producto.categorias?.nombre || null,
        price: Number(producto.precio_final || producto.precio || 0),
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
  }

  // Usar la función RPC de Supabase para búsqueda avanzada
  try {
    const safeOffset = Math.max(0, offset | 0);
    const safeLimit = Math.min(Math.max(1, limit | 0), 50);

    const { data, error } = await supabase.rpc('buscar_productos', {
      busqueda: trimmedQuery,
      limite: safeLimit,
      desplazamiento: safeOffset
    });

    if (error) throw error;

    let filteredData = data || [];

    // Aplicar filtros adicionales en el cliente
    const categoryFilter = filters?.category;
    if (categoryFilter && categoryFilter !== 'all') {
      filteredData = filteredData.filter(p => p.category_name === categoryFilter);
    }

    const priceRange = filters?.priceRange || [];
    const minPrice = Number(priceRange[0]);
    const maxPrice = Number(priceRange[1]);
    if (!Number.isNaN(minPrice) || (!Number.isNaN(maxPrice) && maxPrice > 0)) {
      filteredData = filteredData.filter(p => {
        const price = Number(p.price ?? 0);
        const meetsMin = Number.isNaN(minPrice) || price >= minPrice;
        const meetsMax = Number.isNaN(maxPrice) || maxPrice <= 0 || price <= maxPrice;
        return meetsMin && meetsMax;
      });
    }

    switch (filters?.stock) {
      case 'out_of_stock':
        filteredData = filteredData.filter(p => Number(p.stock ?? 0) === 0);
        break;
      case 'low':
        filteredData = filteredData.filter(p => Number(p.stock ?? 0) <= 5);
        break;
      case 'available':
        filteredData = filteredData.filter(p => Number(p.stock ?? 0) > 0);
        break;
      default:
        break;
    }

    const mapped = filteredData.map((producto) => ({
      id: producto.id,
      name: producto.name,
      description: producto.description,
      sku: producto.sku,
      category_name: producto.category_name,
      price: Number(producto.price ?? 0),
      cost: 0,
      stock: Number(producto.stock ?? 0),
      image: null,
      supplier_id: producto.supplier_id ?? null,
      supplier_name: producto.supplier_name ?? null,
    }));

    // Como la función RPC devuelve un límite fijo, asumimos que hay más si llegamos al límite
    const hasMore = mapped.length === safeLimit;

    return {
      data: mapped,
      count: mapped.length,
      hasMore,
      error: null
    };
  } catch (error) {
    console.error('Error searching products with RPC:', error);
    return { data: null, count: 0, hasMore: false, error };
  }
};

export const getProductoFilters = async () => {
  try {
    const [categoriesRes, minPriceRes, maxPriceRes, maxStockRes] = await Promise.all([
      supabase
        .from('categorias')
        .select('nombre')
        .order('nombre', { ascending: true }),
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

    const categories = (categoriesRes.data || []).map(cat => cat.nombre).filter(Boolean);

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
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    // Usar la función RPC que registra el historial
    const { data, error } = await supabase.rpc('actualizar_precios_proveedor_con_historial', {
      p_proveedor_id: proveedorId,
      p_porcentaje: Number(porcentajeAumento),
      p_user_id: user?.id || null,
      p_user_email: user?.email || null
    });

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.error || 'Error al actualizar precios');
    }

    return {
      data: data,
      updated: data.productos_afectados,
      error: null
    };
  } catch (error) {
    console.error('Error updating product prices by proveedor:', error);
    return { data: null, updated: 0, error };
  }
};

// Obtener historial de cambios de precios
export const getHistorialPrecios = async (proveedorId = null) => {
  try {
    const { data, error } = await supabase.rpc('get_historial_precios', {
      p_proveedor_id: proveedorId,
      p_limite: 100
    });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching historial precios:', error);
    return { data: [], error };
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

