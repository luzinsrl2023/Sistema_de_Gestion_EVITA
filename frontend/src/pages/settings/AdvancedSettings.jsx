import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Palette,
  User,
  Building2,
  Database,
  Shield,
  Bell,
  Download,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  Monitor,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Loader,
  FileText,
  Image as ImageIcon,
  Globe,
  Zap,
  HardDrive,
  Activity
} from 'lucide-react'
import { useTheme, themes } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'
import { uploadLogo, deleteFile, BUCKETS, initializeBuckets, listFiles } from '../../lib/supabaseStorage'
import FileUploader from '../../components/ui/FileUploader'

const AdvancedSettings = () => {
  const { currentTheme, changeTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('appearance')
  
  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    name: localStorage.getItem('evita-company-name') || '',
    cuit: localStorage.getItem('evita-company-cuit') || '',
    address: localStorage.getItem('evita-company-address') || '',
    phone: localStorage.getItem('evita-company-phone') || '',
    email: localStorage.getItem('evita-company-email') || '',
    website: localStorage.getItem('evita-company-website') || ''
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    language: localStorage.getItem('evita-language') || 'es',
    currency: localStorage.getItem('evita-currency') || 'ARS',
    timezone: localStorage.getItem('evita-timezone') || 'America/Argentina/Buenos_Aires',
    dateFormat: localStorage.getItem('evita-date-format') || 'DD/MM/YYYY',
    autoSave: localStorage.getItem('evita-auto-save') === 'true',
    notifications: localStorage.getItem('evita-notifications') === 'true'
  })

  // User Settings
  const [userSettings, setUserSettings] = useState({
    displayName: localStorage.getItem('evita-display-name') || '',
    email: localStorage.getItem('evita-user-email') || '',
    avatar: localStorage.getItem('evita-user-avatar') || null
  })

  // Storage Settings
  const [storageInfo, setStorageInfo] = useState({
    initialized: false,
    buckets: [],
    totalFiles: 0,
    totalSize: 0
  })

  // UI States
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadStorageInfo()
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadStorageInfo = async () => {
    try {
      const result = await initializeBuckets()
      const bucketPromises = Object.values(BUCKETS).map(async (bucket) => {
        const files = await listFiles(bucket)
        return {
          name: bucket,
          files: files.success ? files.data : [],
          count: files.success ? files.data.length : 0
        }
      })
      
      const buckets = await Promise.all(bucketPromises)
      const totalFiles = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
      
      setStorageInfo({
        initialized: result,
        buckets,
        totalFiles,
        totalSize: 0 // TODO: Calculate actual size
      })
    } catch (error) {
      console.error('Error loading storage info:', error)
    }
  }

  const saveCompanySettings = async () => {
    setLoading(true)
    try {
      Object.entries(companySettings).forEach(([key, value]) => {
        localStorage.setItem(`evita-company-${key}`, value)
      })
      localStorage.setItem('evita-company', JSON.stringify(companySettings))
      showNotification('Configuración de empresa guardada exitosamente')
    } catch (error) {
      showNotification('Error al guardar configuración de empresa', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveSystemSettings = async () => {
    setLoading(true)
    try {
      Object.entries(systemSettings).forEach(([key, value]) => {
        localStorage.setItem(`evita-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value.toString())
      })
      showNotification('Configuración del sistema guardada exitosamente')
    } catch (error) {
      showNotification('Error al guardar configuración del sistema', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = () => {
    if (confirm('¿Estás seguro de que deseas restablecer todas las configuraciones? Esta acción no se puede deshacer.')) {
      // Reset to defaults
      setCompanySettings({
        name: '',
        cuit: '',
        address: '',
        phone: '',
        email: '',
        website: ''
      })
      setSystemSettings({
        language: 'es',
        currency: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires',
        dateFormat: 'DD/MM/YYYY',
        autoSave: true,
        notifications: true
      })
      
      // Clear localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('evita-'))
      keys.forEach(key => localStorage.removeItem(key))
      
      showNotification('Configuraciones restablecidas correctamente', 'info')
    }
  }

  const exportSettings = () => {
    const settings = {
      company: companySettings,
      system: systemSettings,
      user: userSettings,
      theme: currentTheme,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evita-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    showNotification('Configuraciones exportadas exitosamente')
  }

  const sections = [
    {
      id: 'appearance',
      name: 'Apariencia',
      icon: Palette,
      description: 'Temas, colores y personalización visual'
    },
    {
      id: 'company',
      name: 'Empresa',
      icon: Building2,
      description: 'Información comercial y datos fiscales'
    },
    {
      id: 'system',
      name: 'Sistema',
      icon: SettingsIcon,
      description: 'Configuraciones generales del sistema'
    },
    {
      id: 'user',
      name: 'Usuario',
      icon: User,
      description: 'Perfil personal y preferencias'
    },
    {
      id: 'storage',
      name: 'Almacenamiento',
      icon: HardDrive,
      description: 'Gestión de archivos y almacenamiento'
    },
    {
      id: 'security',
      name: 'Seguridad',
      icon: Shield,
      description: 'Configuraciones de seguridad y privacidad'
    },
    {
      id: 'notifications',
      name: 'Notificaciones',
      icon: Bell,
      description: 'Alertas y notificaciones del sistema'
    },
    {
      id: 'advanced',
      name: 'Avanzado',
      icon: Zap,
      description: 'Opciones avanzadas y herramientas'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                <SettingsIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Configuración Avanzada</h1>
                <p className="text-sm text-gray-400">Personaliza tu experiencia en EVITA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportSettings}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Restablecer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={cn(
          "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md",
          notification.type === 'success' && "bg-green-600 text-white",
          notification.type === 'error' && "bg-red-600 text-white",
          notification.type === 'info' && "bg-blue-600 text-white",
          notification.type === 'warning' && "bg-yellow-600 text-black"
        )}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {notification.type === 'error' && <XCircle className="h-5 w-5" />}
            {notification.type === 'info' && <Info className="h-5 w-5" />}
            {notification.type === 'warning' && <AlertCircle className="h-5 w-5" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold text-white text-sm">Configuraciones</h3>
              </div>
              <nav className="p-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        activeSection === section.id
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{section.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{section.description}</div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Storage Info */}
            <div className="mt-4 bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                Estado del Sistema
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Archivos</span>
                  <span className="text-white font-mono">{storageInfo.totalFiles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Buckets</span>
                  <span className="text-white font-mono">{storageInfo.buckets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Storage</span>
                  <span className={cn(
                    "font-mono text-xs px-2 py-1 rounded",
                    storageInfo.initialized ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                  )}>
                    {storageInfo.initialized ? 'Activo' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              {/* Content will be rendered based on activeSection */}
              {activeSection === 'appearance' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Apariencia y Temas</h2>
                    <p className="text-gray-400">Personaliza el aspecto visual del sistema</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-white mb-4">Seleccionar Tema</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(themes).map(([key, theme]) => (
                          <div
                            key={key}
                            className={cn(
                              "relative p-4 rounded-lg border cursor-pointer transition-all group",
                              currentTheme === key
                                ? "border-green-500 bg-green-500/5"
                                : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                            )}
                            onClick={() => changeTheme(key)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-white">{theme.name}</h4>
                                  {currentTheme === key && (
                                    <div className="p-1 bg-green-500 rounded-full">
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 mb-3">{theme.description}</p>
                                
                                {/* Theme Preview */}
                                <div className="flex gap-2 mb-2">
                                  <div className={`w-4 h-4 rounded-full bg-${theme.colors.primary}`}></div>
                                  <div className={`w-4 h-4 rounded-full bg-${theme.colors.accent}`}></div>
                                  <div className={`w-4 h-4 rounded-full bg-${theme.colors.surface}`}></div>
                                </div>
                              </div>
                            </div>

                            {/* Background Type Indicator */}
                            <div className="flex gap-2 text-xs flex-wrap">
                              {theme.background?.type === 'gradient' && (
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
                                  Gradiente
                                </span>
                              )}
                              {theme.background?.type === 'pattern' && (
                                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded">
                                  Patrón
                                </span>
                              )}
                              {theme.background?.type === 'solid' && (
                                <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded">
                                  Sólido
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Logo Upload Section */}
                    <div className="border-t border-gray-800 pt-6">
                      <h3 className="font-semibold text-white mb-4">Logo de la Empresa</h3>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <FileUploader
                          bucketName={BUCKETS.LOGOS}
                          acceptedTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']}
                          maxSize={5 * 1024 * 1024}
                          multiple={false}
                          className="max-w-md"
                          onFileUploaded={(fileData) => {
                            localStorage.setItem('evita-logo', fileData.publicUrl)
                            localStorage.setItem('evita-logo-path', fileData.path)
                            showNotification('Logo subido exitosamente')
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'company' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Información de la Empresa</h2>
                    <p className="text-gray-400">Datos que aparecerán en facturas, reportes y documentos</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Nombre Comercial</label>
                        <input
                          type="text"
                          value={companySettings.name}
                          onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="EVITA S.R.L."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">CUIT</label>
                        <input
                          type="text"
                          value={companySettings.cuit}
                          onChange={(e) => setCompanySettings({...companySettings, cuit: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="30-12345678-9"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-white mb-2">Dirección</label>
                        <input
                          type="text"
                          value={companySettings.address}
                          onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Teléfono</label>
                        <input
                          type="text"
                          value={companySettings.phone}
                          onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="(11) 4000-0000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Email</label>
                        <input
                          type="email"
                          value={companySettings.email}
                          onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="contacto@evita.com.ar"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-white mb-2">Sitio Web</label>
                        <input
                          type="url"
                          value={companySettings.website}
                          onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="https://www.evita.com.ar"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={saveCompanySettings}
                        disabled={loading}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Datos de Empresa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add other sections as needed */}
              {activeSection !== 'appearance' && activeSection !== 'company' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <SettingsIcon className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Sección en Desarrollo</h3>
                    <p className="text-gray-400">Esta sección estará disponible próximamente</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedSettings