// =============================================
// SERVICIO DE PROSPECTOS - supabase-js
// Módulo completo para gestión de prospectos
// =============================================

import { supabase } from '../lib/supabaseClient';

const PROSPECTO_BASE_COLUMNS = [
  'id',
  'nombre',
  'apellido',
  'email',
  'telefono',
  'cargo',
  'empresa',
  'sitio_web',
  'industria',
  'tamano_empresa', // ya sin tilde
  'pais',
  'ciudad',
  'direccion',
  'estado',
  'prioridad',
  'fuente',
  'presupuesto_estimado',
  'moneda_presupuesto',
  'notas',
  'descripcion_oportunidad',
  'fecha_proximo_contacto',
  'fecha_cierre_esperada',
  'responsable_id',
  'creado_por',
  'created_at',
  'updated_at',
  'deleted_at',
  'campos_adicionales'
].join(',');

const PROSPECTO_RELATION_COLUMNS = [
  'responsable:auth.users!responsable_id(id,email,raw_user_meta_data)',
  'creador:auth.users!creado_por(id,email,raw_user_meta_data)'
].join(',');

const PROSPECTO_SELECT_COLUMNS = `${PROSPECTO_BASE_COLUMNS},${PROSPECTO_RELATION_COLUMNS}`;
const PROSPECTO_SELECT_WITH_RESPONSABLE = `${PROSPECTO_BASE_COLUMNS},responsable:auth.users!responsable_id(id,email,raw_user_meta_data)`;

// =============================================
// FUNCIONES CRUD BÁSICAS
// =============================================

/**
 * Crea un nuevo prospecto en la base de datos
 * @param {Object} datosProspecto - Datos del prospecto a crear
 * @returns {Object} - Prospecto creado o error
 */
export const crearProspecto = async (datosProspecto) => {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Preparar datos con el usuario creador
    const datosCompletos = {
      ...datosProspecto,
      creado_por: user.id,
      responsable_id: datosProspecto.responsable_id || user.id
    };

    const { data, error } = await supabase
      .from('prospectos')
      .insert([datosCompletos])
      .select(PROSPECTO_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('Error al crear prospecto:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en crearProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Obtiene todos los prospectos activos
 * @param {Object} opciones - Opciones de filtrado y paginación
 * @returns {Array} - Lista de prospectos
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
      .from('prospectos')
      .select(PROSPECTO_SELECT_COLUMNS, { count: 'exact' })
      .is('deleted_at', null);

    // Aplicar filtros
    if (estado) {
      query = query.eq('estado', estado);
    }

    if (responsable_id) {
      query = query.eq('responsable_id', responsable_id);
    }

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,empresa.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
    }

    // Aplicar ordenamiento
    query = query.order(ordenarPor, { ascending: orden === 'ASC' });

    // Aplicar paginación
    const desde = (pagina - 1) * limite;
    query = query.range(desde, desde + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener prospectos:', error);
      throw error;
    }

    return { data, count, error: null };
  } catch (error) {
    console.error('Error en obtenerProspectos:', error);
    return { data: [], count: 0, error };
  }
};

/**
 * Obtiene un prospecto específico por ID
 * @param {string} id - ID del prospecto
 * @returns {Object} - Prospecto encontrado
 */
export const obtenerProspectoPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('prospectos')
      .select(PROSPECTO_SELECT_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error al obtener prospecto:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en obtenerProspectoPorId:', error);
    return { data: null, error };
  }
};

/**
 * Actualiza un prospecto existente
 * @param {string} id - ID del prospecto
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Object} - Prospecto actualizado
 */
export const actualizarProspecto = async (id, datosActualizados) => {
  try {
    const { data, error } = await supabase
      .from('prospectos')
      .update(datosActualizados)
      .eq('id', id)
      .select(PROSPECTO_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('Error al actualizar prospecto:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en actualizarProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Actualiza el estado de un prospecto
 * @param {string} id - ID del prospecto
 * @param {string} nuevoEstado - Nuevo estado del prospecto
 * @returns {Object} - Prospecto actualizado
 */
export const actualizarEstadoProspecto = async (id, nuevoEstado) => {
  try {
    const { data, error } = await supabase
      .from('prospectos')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(PROSPECTO_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('Error al actualizar estado:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en actualizarEstadoProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Elimina un prospecto (soft delete)
 * @param {string} id - ID del prospecto
 * @returns {Object} - Resultado de la eliminación
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
      .select(PROSPECTO_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('Error al eliminar prospecto:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en eliminarProspecto:', error);
    return { data: null, error };
  }
};

// =============================================
// FUNCIONES AVANZADAS
// =============================================

/**
 * Obtiene estadísticas de prospectos
 * @returns {Object} - Estadísticas de prospectos
 */
export const obtenerEstadisticasProspectos = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar si es administrador
    const isAdmin = user.user_metadata?.role === 'admin';

    // Consulta de conteo por estado
    let queryEstados = supabase
      .from('prospectos')
      .select('estado', { count: 'exact', head: false })
      .is('deleted_at', null);

    if (!isAdmin) {
      queryEstados = queryEstados.or(`responsable_id.eq.${user.id},creado_por.eq.${user.id}`);
    }

    const { data: dataEstados, error: errorEstados } = await queryEstados;

    // Consulta de valor total por estado
    let queryValor = supabase
      .from('prospectos')
      .select('estado, presupuesto_estimado')
      .is('deleted_at', null)
      .not('presupuesto_estimado', 'is', null);

    if (!isAdmin) {
      queryValor = queryValor.or(`responsable_id.eq.${user.id},creado_por.eq.${user.id}`);
    }

    const { data: dataValor, error: errorValor } = await queryValor;

    if (errorEstados || errorValor) {
      throw errorEstados || errorValor;
    }

    // Procesar estadísticas
    const estadisticas = {
      total: dataEstados.length,
      porEstado: {},
      valorTotal: 0,
      valorPorEstado: {}
    };

    // Contar por estado
    dataEstados.forEach(prospecto => {
      estadisticas.porEstado[prospecto.estado] =
        (estadisticas.porEstado[prospecto.estado] || 0) + 1;
    });

    // Sumar valores por estado
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

/**
 * Asigna un prospecto a un usuario
 * @param {string} prospectoId - ID del prospecto
 * @param {string} usuarioId - ID del usuario a asignar
 * @returns {Object} - Prospecto actualizado
 */
export const asignarProspecto = async (prospectoId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('prospectos')
      .update({
        responsable_id: usuarioId,
        updated_at: new Date().toISOString()
      })
      .eq('id', prospectoId)
      .select(PROSPECTO_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('Error al asignar prospecto:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en asignarProspecto:', error);
    return { data: null, error };
  }
};

/**
 * Obtiene prospectos próximos a vencer (por fecha de cierre)
 * @param {number} dias - Días para considerar como próximo a vencer
 * @returns {Array} - Lista de prospectos próximos a vencer
 */
export const obtenerProspectosProximosAVencer = async (dias = 7) => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const { data, error } = await supabase
      .from('prospectos')
      .select(PROSPECTO_SELECT_WITH_RESPONSABLE)
      .is('deleted_at', null)
      .not('fecha_cierre_esperada', 'is', null)
      .gte('fecha_cierre_esperada', new Date().toISOString().split('T')[0])
      .lte('fecha_cierre_esperada', fechaLimite.toISOString().split('T')[0])
      .order('fecha_cierre_esperada', { ascending: true });

    if (error) {
      console.error('Error al obtener prospectos próximos a vencer:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en obtenerProspectosProximosAVencer:', error);
    return { data: [], error };
  }
};