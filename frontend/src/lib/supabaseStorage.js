import React, { useState } from 'react'
import { supabase } from './supabaseAuth'

// Configuración de buckets
const BUCKETS = {
  LOGOS: 'company-logos',
  INVOICES: 'invoices',
  DOCUMENTS: 'documents',
  PRODUCTS: 'product-images',
  AVATARS: 'avatars'
}

/**
 * Inicializa los buckets necesarios en Supabase Storage
 */
export const initializeBuckets = async () => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }

    const existingBuckets = buckets.map(bucket => bucket.name)

    // Crear buckets que no existen
    for (const [key, bucketName] of Object.entries(BUCKETS)) {
      if (!existingBuckets.includes(bucketName)) {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: key === 'LOGOS' || key === 'PRODUCTS', // Logos y productos son públicos
          fileSizeLimit: key === 'INVOICES' ? 50000000 : 10000000, // 50MB para facturas, 10MB para otros
          allowedMimeTypes: key === 'LOGOS' || key === 'PRODUCTS' 
            ? ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
            : ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'text/plain']
        })
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error)
        } else {
          console.log(`Bucket ${bucketName} created successfully`)
        }
      }
    }
  } catch (error) {
    console.error('Error initializing buckets:', error)
  }
}

/**
 * Sube un archivo a Supabase Storage
 * @param {File} file - El archivo a subir
 * @param {string} bucketName - Nombre del bucket
 * @param {string} fileName - Nombre del archivo (opcional, usa el nombre original si no se proporciona)
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Resultado de la subida
 */
export const uploadFile = async (file, bucketName, fileName = null, options = {}) => {
  try {
    if (!file) {
      throw new Error('No se proporcionó archivo')
    }

    if (!Object.values(BUCKETS).includes(bucketName)) {
      throw new Error(`Bucket ${bucketName} no está configurado`)
    }

    const fileExt = file.name.split('.').pop()
    const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = options.folder ? `${options.folder}/${finalFileName}` : finalFileName

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: options.upsert || false
      })

    if (error) {
      throw error
    }

    // Obtener URL pública si el bucket es público
    let publicUrl = null
    if (bucketName === BUCKETS.LOGOS || bucketName === BUCKETS.PRODUCTS) {
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)
      
      publicUrl = publicData.publicUrl
    } else {
      // Crear URL firmada para archivos privados (válida por 1 hora)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600)
      
      if (!signedError && signedData) {
        publicUrl = signedData.signedUrl
      }
    }

    return {
      success: true,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl,
        bucketName,
        fileName: finalFileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: error.message || 'Error al subir archivo'
    }
  }
}

/**
 * Elimina un archivo de Supabase Storage
 * @param {string} bucketName - Nombre del bucket
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteFile = async (bucketName, filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      throw error
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    return {
      success: false,
      error: error.message || 'Error al eliminar archivo'
    }
  }
}

/**
 * Lista archivos en un bucket
 * @param {string} bucketName - Nombre del bucket
 * @param {string} folder - Carpeta (opcional)
 * @returns {Promise<Object>} Lista de archivos
 */
export const listFiles = async (bucketName, folder = '') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folder, {
        limit: 100,
        offset: 0
      })

    if (error) {
      throw error
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error listing files:', error)
    return {
      success: false,
      error: error.message || 'Error al listar archivos'
    }
  }
}

/**
 * Obtiene la URL pública de un archivo
 * @param {string} bucketName - Nombre del bucket
 * @param {string} filePath - Ruta del archivo
 * @returns {string|null} URL pública del archivo
 */
export const getPublicUrl = (bucketName, filePath) => {
  try {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error('Error getting public URL:', error)
    return null
  }
}

/**
 * Crea una URL firmada para un archivo privado
 * @param {string} bucketName - Nombre del bucket
 * @param {string} filePath - Ruta del archivo
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns {Promise<string|null>} URL firmada del archivo
 */
export const createSignedUrl = async (bucketName, filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      throw error
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error creating signed URL:', error)
    return null
  }
}

/**
 * Hook personalizado para manejar subida de archivos con estado
 * @param {string} bucketName - Nombre del bucket
 * @returns {Object} Estado y funciones de subida
 */
export const useFileUpload = (bucketName) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const upload = async (file, fileName, options = {}) => {
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Simular progreso (Supabase no proporciona progreso real)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadFile(file, bucketName, fileName, options)
      
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setTimeout(() => {
          setProgress(0)
          setUploading(false)
        }, 500)
      } else {
        setError(result.error)
        setUploading(false)
        setProgress(0)
      }

      return result
    } catch (err) {
      setError(err.message)
      setUploading(false)
      setProgress(0)
      return { success: false, error: err.message }
    }
  }

  return {
    uploading,
    progress,
    error,
    upload
  }
}

// Exportar constantes de buckets
export { BUCKETS }

// Funciones de utilidad para tipos específicos de archivos
export const uploadLogo = (file, fileName) => uploadFile(file, BUCKETS.LOGOS, fileName)
export const uploadInvoice = (file, fileName, folder = 'invoices') => uploadFile(file, BUCKETS.INVOICES, fileName, { folder })
export const uploadDocument = (file, fileName, folder = 'documents') => uploadFile(file, BUCKETS.DOCUMENTS, fileName, { folder })
export const uploadProductImage = (file, fileName) => uploadFile(file, BUCKETS.PRODUCTS, fileName)