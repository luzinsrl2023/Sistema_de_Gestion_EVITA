import { supabase } from '../lib/supabaseClient'

const TABLE_NAME = 'empresa_configuracion'

/**
 * Obtiene la configuración de la empresa.
 * Como se asume una sola empresa, siempre busca la primera fila.
 * @returns {Promise<object|null>} La configuración de la empresa o null si no existe.
 */
export const getCompanyConfig = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .limit(1)
    .single() // .single() devuelve un objeto en lugar de un array

  if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
    console.error('Error fetching company config:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Crea o actualiza la configuración de la empresa.
 * Si existe una configuración, la actualiza. Si no, crea una nueva.
 * @param {object} configData - Los datos de configuración a guardar.
 * @returns {Promise<object>} Los datos guardados.
 */
export const upsertCompanyConfig = async (configData) => {
  // Primero, intenta obtener la configuración existente
  const existingConfig = await getCompanyConfig()

  const dataToUpsert = {
    ...configData,
    updated_at: new Date().toISOString(),
  }

  let response
  if (existingConfig) {
    // Actualiza la configuración existente
    response = await supabase
      .from(TABLE_NAME)
      .update(dataToUpsert)
      .eq('id', existingConfig.id)
      .select()
      .single()
  } else {
    // Crea una nueva configuración
    response = await supabase
      .from(TABLE_NAME)
      .insert(dataToUpsert)
      .select()
      .single()
  }

  const { data, error } = response

  if (error) {
    console.error('Error upserting company config:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Actualiza la URL y el path del logo de la empresa.
 * @param {string} logo_url - La URL pública del nuevo logo.
 * @param {string} logo_path - El path del nuevo logo en Supabase Storage.
 * @returns {Promise<object>} Los datos actualizados.
 */
export const updateCompanyLogo = async (logo_url, logo_path) => {
  return await upsertCompanyConfig({ logo_url, logo_path })
}