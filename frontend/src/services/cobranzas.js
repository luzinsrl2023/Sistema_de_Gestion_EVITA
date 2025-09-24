import { supabase } from '../lib/supabaseClient';

// Obtener todas las cobranzas con información del cliente y factura
export const getCobranzas = async () => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .select(`
        *,
        clientes (
          id,
          nombre,
          email,
          telefono
        ),
        facturas (
          id,
          numero_factura,
          monto,
          estado
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cobranzas:', error);
    return { data: null, error };
  }
};

// Obtener cobranza por ID
export const getCobranzaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .select(`
        *,
        clientes (
          id,
          nombre,
          email,
          telefono,
          direccion
        ),
        facturas (
          id,
          numero_factura,
          monto,
          estado,
          fecha
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cobranza:', error);
    return { data: null, error };
  }
};

// Crear nueva cobranza
export const createCobranza = async (cobranzaData) => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .insert([cobranzaData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating cobranza:', error);
    return { data: null, error };
  }
};

// Actualizar cobranza
export const updateCobranza = async (id, cobranzaData) => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .update(cobranzaData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating cobranza:', error);
    return { data: null, error };
  }
};

// Eliminar cobranza
export const deleteCobranza = async (id) => {
  try {
    const { error } = await supabase
      .from('cobranzas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting cobranza:', error);
    return { error };
  }
};

// Obtener cobranzas por cliente
export const getCobranzasByCliente = async (clienteId) => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .select(`
        *,
        facturas (
          numero_factura,
          monto,
          estado
        )
      `)
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cobranzas by cliente:', error);
    return { data: null, error };
  }
};

// Obtener cobranzas por método de pago
export const getCobranzasByMetodoPago = async (metodoPago) => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .select(`
        *,
        clientes (
          nombre
        ),
        facturas (
          numero_factura
        )
      `)
      .eq('metodo_pago', metodoPago)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cobranzas by metodo pago:', error);
    return { data: null, error };
  }
};

// Registrar pago de factura (crear cobranza y actualizar estado de factura)
export const registrarPagoFactura = async (facturaId, cobranzaData) => {
  try {
    // Crear la cobranza
    const { data: cobranza, error: cobranzaError } = await supabase
      .from('cobranzas')
      .insert([{ ...cobranzaData, factura_id: facturaId }])
      .select()
      .single();

    if (cobranzaError) throw cobranzaError;

    // Actualizar estado de la factura a 'pagada'
    const { data: factura, error: facturaError } = await supabase
      .from('facturas')
      .update({ estado: 'pagada' })
      .eq('id', facturaId)
      .select()
      .single();

    if (facturaError) throw facturaError;

    return { data: { cobranza, factura }, error: null };
  } catch (error) {
    console.error('Error registering pago factura:', error);
    return { data: null, error };
  }
};

// Obtener estado de cuenta de un cliente
export const getEstadoCuentaCliente = async (clienteId) => {
  try {
    // Obtener facturas del cliente
    const { data: facturas, error: facturasError } = await supabase
      .from('facturas')
      .select(`
        id,
        numero_factura,
        fecha,
        monto,
        estado,
        ventas (
          cliente_id
        )
      `)
      .eq('ventas.cliente_id', clienteId);

    if (facturasError) throw facturasError;

    // Obtener cobranzas del cliente
    const { data: cobranzas, error: cobranzasError } = await supabase
      .from('cobranzas')
      .select('*')
      .eq('cliente_id', clienteId);

    if (cobranzasError) throw cobranzasError;

    // Calcular totales
    const totalFacturado = facturas?.reduce((sum, factura) => sum + parseFloat(factura.monto || 0), 0) || 0;
    const totalCobrado = cobranzas?.reduce((sum, cobranza) => sum + parseFloat(cobranza.monto || 0), 0) || 0;
    const saldoPendiente = totalFacturado - totalCobrado;

    // Facturas pendientes
    const facturasPendientes = facturas?.filter(f => f.estado !== 'pagada') || [];

    return {
      data: {
        facturas,
        cobranzas,
        totales: {
          totalFacturado,
          totalCobrado,
          saldoPendiente
        },
        facturasPendientes
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching estado cuenta cliente:', error);
    return { data: null, error };
  }
};

// Obtener cobranzas del día
export const getCobranzasDelDia = async (fecha = new Date().toISOString().split('T')[0]) => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .select(`
        *,
        clientes (
          nombre
        ),
        facturas (
          numero_factura
        )
      `)
      .eq('fecha', fecha)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cobranzas del dia:', error);
    return { data: null, error };
  }
};

// Obtener resumen de cobranzas por período
export const getResumenCobranzas = async (fechaInicio, fechaFin) => {
  try {
    const { data, error } = await supabase
      .from('cobranzas')
      .select('monto, metodo_pago, fecha')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin);

    if (error) throw error;

    // Agrupar por método de pago
    const resumenPorMetodo = data?.reduce((acc, cobranza) => {
      const metodo = cobranza.metodo_pago;
      if (!acc[metodo]) {
        acc[metodo] = { cantidad: 0, total: 0 };
      }
      acc[metodo].cantidad += 1;
      acc[metodo].total += parseFloat(cobranza.monto || 0);
      return acc;
    }, {}) || {};

    const totalGeneral = data?.reduce((sum, cobranza) => sum + parseFloat(cobranza.monto || 0), 0) || 0;

    return {
      data: {
        cobranzas: data,
        resumenPorMetodo,
        totalGeneral,
        cantidadTotal: data?.length || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching resumen cobranzas:', error);
    return { data: null, error };
  }
};