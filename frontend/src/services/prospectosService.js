// =============================================
// SERVICIO DE PROSPECTOS - supabase-js
// Basado en la vista prospectos_with_users
// =============================================

import { supabase } from '../lib/supabaseClient';

// =============================================
// FUNCIONES CRUD BÁSICAS
// =============================================

/**
 * Crea un nuevo prospecto en la base de datos
 */
export const crearProspecto = async (datosProspecto) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const datosCompletos = {
      ...datosProspecto,
      creado_por: user.id,
      responsable_id: datosProspecto.responsable_id || user.id
    };

    const { data, error } = await supabase
      .from('prospectos')
      .insert([datosCompletos])
      .select()
      .single();

    if (error) throw error;

    // Consultar desde la vista para devolver con relaciones
    const { data: prospectoView, error: errorView } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .eq('id', data.id)
      .single();

    if (errorView) throw errorView;

    return { data: prospectoView, error: null };
  } catch (error) {
    console.error('Error en crearProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Obtiene todos los prospectos activos
 */
export const obtenerProspectos = async (opciones = {}) => {
  try {
    const {
      estado = null,
      responsable_id = null,
      limite = 50,
      pagina = 1,
      busqueda = '',
      ordenarPor = 'created_at',
      orden = 'DESC'
    } = opciones;

    let query = supabase
      .from('prospectos_with_users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (estado) query = query.eq('estado', estado);
    if (responsable_id) query = query.eq('responsable_id', responsable_id);
    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,empresa.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
    }

    query = query.order(ordenarPor, { ascending: orden === 'ASC' });
    const desde = (pagina - 1) * limite;
    query = query.range(desde, desde + limite - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, count, error: null };
  } catch (error) {
    console.error('Error en obtenerProspectos:', error);
    return { data: [], count: 0, error };
  }
};

/**
 * Obtiene un prospecto específico por ID
 */
export const obtenerProspectoPorId = async (prospectoId) => {
  try {
    const { data, error } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .eq('id', prospectoId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en obtenerProspectoPorId:', error);
    return { data: null, error };
  }
};

/**
 * Actualiza un prospecto existente
 */
export const actualizarProspecto = async (id, datosActualizados) => {
  try {
    const { data, error } = await supabase
      .from('prospectos')
      .update(datosActualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { data: prospectoView, error: errorView } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .eq('id', data.id)
      .single();

    if (errorView) throw errorView;

    return { data: prospectoView, error: null };
  } catch (error) {
    console.error('Error en actualizarProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Elimina un prospecto (soft delete)
 */
export const eliminarProspecto = async (id) => {
  try {
    const { data, error } = await supabase
      .from('prospectos')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { data: prospectoView, error: errorView } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .eq('id', id)
      .single();

    if (errorView) throw errorView;

    return { data: prospectoView, error: null };
  } catch (error) {
    console.error('Error en eliminarProspecto:', error);
    return { data: null, error };
  }
};

// =============================================
// FUNCIONES AVANZADAS
// =============================================

/**
 * Actualiza el estado de un prospecto
 */
export const actualizarEstadoProspecto = async (id, nuevoEstado) => {
  try {
    const { error } = await supabase
      .from('prospectos')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    const { data: prospectoView, error: errorView } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .eq('id', id)
      .single();

    if (errorView) throw errorView;

    return { data: prospectoView, error: null };
  } catch (error) {
    console.error('Error en actualizarEstadoProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Asigna un prospecto a un usuario
 */
export const asignarProspecto = async (prospectoId, usuarioId) => {
  try {
    const { error } = await supabase
      .from('prospectos')
      .update({
        responsable_id: usuarioId,
        updated_at: new Date().toISOString()
      })
      .eq('id', prospectoId);

    if (error) throw error;

    const { data: prospectoView, error: errorView } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .eq('id', prospectoId)
      .single();

    if (errorView) throw errorView;

    return { data: prospectoView, error: null };
  } catch (error) {
    console.error('Error en asignarProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Obtiene prospectos próximos a vencer (por fecha de cierre)
 */
export const obtenerProspectosProximosAVencer = async (dias = 7) => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const { data, error } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .is('deleted_at', null)
      .not('fecha_cierre_esperada', 'is', null)
      .gte('fecha_cierre_esperada', new Date().toISOString().split('T')[0])
      .lte('fecha_cierre_esperada', fechaLimite.toISOString().split('T')[0])
      .order('fecha_cierre_esperada', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en obtenerProspectosProximosAVencer:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene estadísticas de prospectos
 */
export const obtenerEstadisticasProspectos = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const isAdmin = user.user_metadata?.role === 'admin';

    let queryEstados = supabase
      .from('prospectos_with_users')
      .select('estado', { count: 'exact', head: false })
      .is('deleted_at', null);

    if (!isAdmin) {
      queryEstados = queryEstados.or(`responsable_id.eq.${user.id},creado_por.eq.${user.id}`);
    }

    const { data: dataEstados, error: errorEstados } = await queryEstados;

    let queryValor = supabase
      .from('prospectos_with_users')
      .select('estado, presupuesto_estimado')
      .is('deleted_at', null)
      .not('presupuesto_estimado', 'is', null);

    if (!isAdmin) {
      queryValor = queryValor.or(`responsable_id.eq.${user.id},creado_por.eq.${user.id}`);
    }

    const { data: dataValor, error: errorValor } = await queryValor;

    if (errorEstados || errorValor) throw errorEstados || errorValor;

    const estadisticas = {
      total: dataEstados.length,
      porEstado: {},
      valorTotal: 0,
      valorPorEstado: {}
    };

    dataEstados.forEach(prospecto => {
      estadisticas.porEstado[prospecto.estado] =
        (estadisticas.porEstado[prospecto.estado] || 0) + 1;
    });

    dataValor.forEach(prospecto => {
      estadisticas.valorTotal += parseFloat(prospecto.presupuesto_estimado || 0);
      estadisticas.valorPorEstado[prospecto.estado] =
        (estadisticas.valorPorEstado[prospecto.estado] || 0) +
        parseFloat(prospecto.presupuesto_estimado || 0);
    });

    return { data: estadisticas, error: null };
  } catch (error) {
    console.error('Error en obtenerEstadisticasProspectos:', error);
    return { data: null, error };
  }
};