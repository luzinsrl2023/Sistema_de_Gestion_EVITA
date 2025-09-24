import React, { useState } from 'react'
import { Upload, X, Loader, File, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { uploadFile, deleteFile, BUCKETS } from '../../lib/supabaseStorage'

const FileUploader = ({ 
  bucketName = BUCKETS.DOCUMENTS,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  onFileUploaded,
  onFileDeleted,
  className = '',
  folder = null,
  disabled = false,
  preview = true
}) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [error, setError] = useState(null)

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Validate file
  const validateFile = (file) => {
    if (file.size > maxSize) {
      throw new Error(`El archivo es muy grande. Máximo ${formatFileSize(maxSize)}`)
    }

    // Check accepted types
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type)
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isValidType) {
      throw new Error(`Tipo de archivo no permitido. Formatos aceptados: ${acceptedTypes.join(', ')}`)
    }
  }

  // Handle file upload
  const handleUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const fileList = Array.from(files)
      const uploadPromises = fileList.map(async (file, index) => {
        validateFile(file)

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload file
        const result = await uploadFile(file, bucketName, fileName, { folder })
        
        // Update progress (simulate based on file index)
        setProgress(((index + 1) / fileList.length) * 100)

        if (!result.success) {
          throw new Error(result.error)
        }

        return result.data
      })

      const results = await Promise.all(uploadPromises)
      
      setUploadedFiles(prev => [...prev, ...results])
      
      // Notify parent component
      if (onFileUploaded) {
        results.forEach(result => onFileUploaded(result))
      }

      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Upload error:', err)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 1000)
    }
  }

  // Handle file deletion
  const handleDelete = async (fileData) => {
    try {
      const result = await deleteFile(bucketName, fileData.path)
      
      if (result.success) {
        setUploadedFiles(prev => prev.filter(f => f.path !== fileData.path))
        
        if (onFileDeleted) {
          onFileDeleted(fileData)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      setError(err.message)
      console.error('Delete error:', err)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
        disabled 
          ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed' 
          : uploading
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/30 hover:bg-gray-800/50',
        error && 'border-red-500 bg-red-500/10'
      )}>
        <div className="flex flex-col items-center justify-center gap-4">
          {uploading ? (
            <Loader className="h-8 w-8 text-blue-400 animate-spin" />
          ) : error ? (
            <AlertCircle className="h-8 w-8 text-red-400" />
          ) : (
            <Upload className="h-8 w-8 text-gray-400" />
          )}

          <div>
            <p className={cn(
              'text-sm font-medium',
              uploading ? 'text-blue-400' : error ? 'text-red-400' : 'text-white'
            )}>
              {uploading 
                ? 'Subiendo archivos...' 
                : error 
                  ? 'Error en la subida'
                  : 'Arrastra archivos aquí o haz clic para seleccionar'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes.join(', ')} • Máximo {formatFileSize(maxSize)}
              {multiple && ' • Múltiples archivos'}
            </p>
          </div>

          <label className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors',
            disabled || uploading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          )}>
            <Upload className="h-4 w-4" />
            Seleccionar archivos
            <input
              type="file"
              multiple={multiple}
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleUpload(e.target.files)}
              disabled={disabled || uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Progreso</span>
              <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Uploaded Files Preview */}
      {preview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white">Archivos subidos</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="text-green-400">
                    {getFileIcon(file.type)}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium truncate max-w-xs">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(file.size)} • Subido exitosamente
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader