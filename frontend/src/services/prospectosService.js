import { supabase } from '../lib/supabaseClient'; // Ruta corregida al cliente de Supabase

/**
 * @typedef {Object} Prospecto
 * @property {number} [id] - El ID del prospecto (autogenerado).
 * @property {string} nombre - Nombre del prospecto.
 * @property {string} [empresa] - Empresa del prospecto.
 * @property {string} [email] - Correo electrónico del prospecto.
 * @property {string} [telefono] - Teléfono de contacto.
 * @property {string} [fuente] - Origen del prospecto (ej. 'Web', 'Referencia').
 * @property {'Nuevo' | 'Contactado' | 'Calificado' | 'Propuesta Enviada' | 'Negociación' | 'Ganado' | 'Perdido'} [estado] - Estado actual del prospecto.
 * @property {string} [responsable_id] - ID del usuario responsable (autogenerado por la RLS).
 */

/**
 * Crea un nuevo prospecto en la base de datos.
 * @param {Omit<Prospecto, 'id' | 'responsable_id'>} datosProspecto - Los datos del prospecto a crear.
 * @returns {Promise<Prospecto>} El prospecto recién creado.
 */
export const crearProspecto = async (datosProspecto) => {
  const { data, error } = await supabase
    .from('prospectos')
    .insert([datosProspecto])
    .select()
    .single(); // .single() para que devuelva el objeto creado, no un array

  if (error) {
    console.error('Error al crear el prospecto:', error.message);
    throw new Error(`Error al crear prospecto: ${error.message}`);
  }

  return data;
};

/**
 * Obtiene todos los prospectos asignados al usuario actual.
 * La política RLS se encarga de filtrar los resultados automáticamente.
 * @returns {Promise<Prospecto[]>} Una lista de los prospectos.
 */
export const obtenerProspectos = async () => {
  const { data, error } = await supabase
    .from('prospectos')
    .select('*')
    .order('created_at', { ascending: false }); // Ordenar por fecha de creación descendente

  if (error) {
    console.error('Error al obtener los prospectos:', error.message);
    throw new Error(`Error al obtener prospectos: ${error.message}`);
  }

  return data;
};

/**
 * Actualiza un prospecto existente.
 * @param {number} id - El ID del prospecto a actualizar.
 * @param {Partial<Omit<Prospecto, 'id' | 'responsable_id'>>} datosActualizados - Los campos a actualizar.
 * @returns {Promise<Prospecto>} El prospecto actualizado.
 */
export const actualizarProspecto = async (id, datosActualizados) => {
  const { data, error } = await supabase
    .from('prospectos')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar el prospecto:', error.message);
    throw new Error(`Error al actualizar prospecto: ${error.message}`);
  }

  return data;
};

/**
 * Elimina un prospecto de la base de datos.
 * @param {number} id - El ID del prospecto a eliminar.
 * @returns {Promise<void>}
 */
export const eliminarProspecto = async (id) => {
  const { error } = await supabase
    .from('prospectos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar el prospecto:', error.message);
    throw new Error(`Error al eliminar prospecto: ${error.message}`);
  }
};