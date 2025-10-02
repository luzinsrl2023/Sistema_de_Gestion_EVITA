import { supabase } from '../lib/supabaseClient';

// ==================== PLAN DE CUENTAS ====================

export const getPlanCuentas = async () => {
  try {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
      .order('codigo', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching plan de cuentas:', error);
    return { data: [], error };
  }
};

export const getCuentasImputables = async () => {
  try {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
      .eq('imputable', true)
      .order('codigo', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching cuentas imputables:', error);
    return { data: [], error };
  }
};

// ==================== ASIENTOS CONTABLES ====================

export const getAsientos = async (filters = {}) => {
  try {
    let query = supabase
      .from('asientos_contables')
      .select('*')
      .order('fecha', { ascending: false })
      .order('numero', { ascending: false });

    if (filters.fechaDesde) {
      query = query.gte('fecha', filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      query = query.lte('fecha', filters.fechaHasta);
    }
    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching asientos:', error);
    return { data: [], error };
  }
};

export const getAsientoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('asientos_contables')
      .select(`
        *,
        movimientos:movimientos_contables(
          id,
          cuenta_id,
          debe,
          haber,
          descripcion,
          cuenta:plan_cuentas(codigo, nombre)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching asiento:', error);
    return { data: null, error };
  }
};

export const createAsiento = async (asientoData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Obtener el próximo número de asiento
    const { data: maxAsiento } = await supabase
      .from('asientos_contables')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1)
      .single();

    const nuevoNumero = (maxAsiento?.numero || 0) + 1;

    const { data, error } = await supabase
      .from('asientos_contables')
      .insert([{
        numero: nuevoNumero,
        fecha: asientoData.fecha,
        descripcion: asientoData.descripcion,
        tipo: asientoData.tipo || 'Diario',
        estado: 'Borrador',
        user_id: user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating asiento:', error);
    return { data: null, error };
  }
};

export const updateAsiento = async (id, asientoData) => {
  try {
    const { data, error } = await supabase
      .from('asientos_contables')
      .update(asientoData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating asiento:', error);
    return { data: null, error };
  }
};

export const deleteAsiento = async (id) => {
  try {
    const { error } = await supabase
      .from('asientos_contables')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting asiento:', error);
    return { error };
  }
};

// ==================== MOVIMIENTOS ====================

export const createMovimiento = async (movimientoData) => {
  try {
    const { data, error } = await supabase
      .from('movimientos_contables')
      .insert([movimientoData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating movimiento:', error);
    return { data: null, error };
  }
};

export const updateMovimiento = async (id, movimientoData) => {
  try {
    const { data, error } = await supabase
      .from('movimientos_contables')
      .update(movimientoData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating movimiento:', error);
    return { data: null, error };
  }
};

export const deleteMovimiento = async (id) => {
  try {
    const { error } = await supabase
      .from('movimientos_contables')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting movimiento:', error);
    return { error };
  }
};

// ==================== FUNCIONES ESPECIALES ====================

export const confirmarAsiento = async (asientoId) => {
  try {
    const { data, error } = await supabase.rpc('confirmar_asiento', {
      p_asiento_id: asientoId
    });

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.error || 'Error al confirmar asiento');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error confirming asiento:', error);
    return { data: null, error };
  }
};

export const getBalanceSumasYSaldos = async (fechaDesde, fechaHasta) => {
  try {
    const { data, error } = await supabase.rpc('obtener_balance_sumas_saldos', {
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta
    });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching balance:', error);
    return { data: [], error };
  }
};

// ==================== REPORTES ====================

export const getLibroDiario = async (fechaDesde, fechaHasta) => {
  try {
    const { data, error } = await supabase
      .from('libro_diario')
      .select('*')
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha', { ascending: true })
      .order('numero_asiento', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching libro diario:', error);
    return { data: [], error };
  }
};

export const getLibroMayor = async (cuentaId, fechaDesde, fechaHasta) => {
  try {
    let query = supabase
      .from('libro_mayor')
      .select('*')
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha', { ascending: true });

    if (cuentaId) {
      query = query.eq('cuenta_id', cuentaId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching libro mayor:', error);
    return { data: [], error };
  }
};
