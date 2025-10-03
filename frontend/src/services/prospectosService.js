// =============================================
// SERVICIO DE PROSPECTOS - Sistema de autenticación personalizado
// Basado en la vista prospectos_with_users
// =============================================

import { supabase } from '../lib/supabaseClient';
import * as authService from '../services/authService';

// =============================================
// FUNCIONES CRUD BÁSICAS
// =============================================

/**
 * Crea un nuevo prospecto
 */
export const crearProspecto = async (datosProspecto) => {
  try {
    // Usar el sistema de autenticación personalizado
    const session = authService.getSession();
    if (!session || !session.user) throw new Error('Usuario no autenticado');

    const datosCompletos = {
      ...datosProspecto,
      creado_por: session.user.id,
      responsable_id: datosProspecto.responsable_id || session.user.id
    };

    // Insertar en la tabla principal
    const { data, error } = await supabase
      .from('prospectos')
      .insert([datosCompletos])
      .select()
      .single();
    if (error) throw error;

    // Traer desde la vista para incluir responsable y creador
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
export const obtenerProspectos = async ({ estado = null, responsable_id = null, limite = 50, pagina = 1, busqueda = '', ordenarPor = 'created_at', orden = 'DESC' } = {}) => {
  try {
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
 * Obtiene un prospecto por ID
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
 * Actualiza un prospecto
 */
export const actualizarProspecto = async (id, datosActualizados) => {
  try {
    // Verificar autenticación con el sistema personalizado
    const session = authService.getSession();
    if (!session || !session.user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('prospectos')
      .update(datosActualizados)
      .eq('id', id);
    if (error) throw error;

    const { data, error: errorView } = await supabase
      .from('prospectos_with_users')
      .select('*')
      .eq('id', id)
      .single();
    if (errorView) throw errorView;

    return { data, error: null };
  } catch (error) {
    console.error('Error en actualizarProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Actualiza el estado de un prospecto
 */
export const actualizarEstadoProspecto = async (id, nuevoEstado) => {
  return actualizarProspecto(id, { estado: nuevoEstado, updated_at: new Date().toISOString() });
};

/**
 * Elimina un prospecto (soft delete)
 */
export const eliminarProspecto = async (id) => {
  return actualizarProspecto(id, { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() });
};

/**
 * Asigna un prospecto a un usuario
 */
export const asignarProspecto = async (prospectoId, usuarioId) => {
  return actualizarProspecto(prospectoId, { responsable_id: usuarioId, updated_at: new Date().toISOString() });
};

/**
 * Obtiene prospectos próximos a vencer
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
    // Usar el sistema de autenticación personalizado
    const session = authService.getSession();
    if (!session || !session.user) throw new Error('Usuario no autenticado');

    const isAdmin = session.user.email === 'claudiocaffre@evita.com' || session.user.email === 'test@example.com';

    let queryEstados = supabase
      .from('prospectos_with_users')
      .select('estado', { count: 'exact', head: false })
      .is('deleted_at', null);
    if (!isAdmin) queryEstados = queryEstados.or(`responsable_id.eq.${session.user.id},creado_por.eq.${session.user.id}`);

    const { data: dataEstados, error: errorEstados } = await queryEstados;

    let queryValor = supabase
      .from('prospectos_with_users')
      .select('estado, presupuesto_estimado')
      .is('deleted_at', null)
      .not('presupuesto_estimado', 'is', null);
    if (!isAdmin) queryValor = queryValor.or(`responsable_id.eq.${session.user.id},creado_por.eq.${session.user.id}`);

    const { data: dataValor, error: errorValor } = await queryValor;

    if (errorEstados || errorValor) throw errorEstados || errorValor;

    const estadisticas = {
      total: dataEstados.length,
      porEstado: {},
      valorTotal: 0,
      valorPorEstado: {}
    };

    dataEstados.forEach(p => estadisticas.porEstado[p.estado] = (estadisticas.porEstado[p.estado] || 0) + 1);
    dataValor.forEach(p => {
      estadisticas.valorTotal += parseFloat(p.presupuesto_estimado || 0);
      estadisticas.valorPorEstado[p.estado] = (estadisticas.valorPorEstado[p.estado] || 0) + parseFloat(p.presupuesto_estimado || 0);
    });

    return { data: estadisticas, error: null };
  } catch (error) {
    console.error('Error en obtenerEstadisticasProspectos:', error);
    return { data: null, error };
  }
};

