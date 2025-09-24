import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Palette,
  User,
  Building2,
  Upload,
  Trash2,
  Loader,
  Check,
  Mail,
  Bell,
  Shield,
  Monitor,
  Database,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  Zap,
  Clock,
  Globe
} from 'lucide-react'
import { useTheme, themes } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import { uploadLogo, deleteFile, BUCKETS, initializeBuckets } from '../../lib/supabaseStorage'

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { currentTheme, changeTheme, theme } = useTheme()
  const [activeSection, setActiveSection] = useState('general')
  
  // Estados para datos de empresa
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('evita-company-name') || 'EVITA')
  const [companyCUIT, setCompanyCUIT] = useState(() => localStorage.getItem('evita-company-cuit') || '')
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('evita-company-address') || '')
  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem('evita-company-phone') || '')
  const [companyEmail, setCompanyEmail] = useState(() => localStorage.getItem('evita-company-email') || '')
  
  // Estados para configuración de notificaciones
  const [emailNotifications, setEmailNotifications] = useState(
    () => JSON.parse(localStorage.getItem('evita-email-notifications') || 'true')
  )
  const [stockAlerts, setStockAlerts] = useState(
    () => JSON.parse(localStorage.getItem('evita-stock-alerts') || 'true')
  )
  const [paymentReminders, setPaymentReminders] = useState(
    () => JSON.parse(localStorage.getItem('evita-payment-reminders') || 'true')
  )
  
  // Estados para logo
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoProgress, setLogoProgress] = useState(0)
  const [currentLogoPath, setCurrentLogoPath] = useState(() => localStorage.getItem('evita-logo-path') || null)
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem('evita-logo') || null)
  const [storageInitialized, setStorageInitialized] = useState(false)
  
  // Estados para configuración del sistema
  const [autoSave, setAutoSave] = useState(
    () => JSON.parse(localStorage.getItem('evita-auto-save') || 'true')
  )

  // Inicializar buckets de Supabase Storage
  useEffect(() => {
    const initStorage = async () => {
      try {
        await initializeBuckets()
        setStorageInitialized(true)
      } catch (error) {
        console.error('Error initializing storage:', error)
      }
    }
    initStorage()
  }, [])

  const sections = [
    {
      id: 'general',
      name: 'General',
      icon: SettingsIcon,
      description: 'Configuraciones básicas del sistema'
    },
    {
      id: 'empresa',
      name: 'Empresa',
      icon: Building2,
      description: 'Información y branding de tu empresa'
    },
    {
      id: 'temas',
      name: 'Apariencia',
      icon: Palette,
      description: 'Temas y personalización visual'
    },
    {
      id: 'notificaciones',
      name: 'Notificaciones',
      icon: Bell,
      description: 'Alertas y recordatorios automáticos'
    },
    {
      id: 'usuario',
      name: 'Perfil',
      icon: User,
      description: 'Tu información personal'
    },
    {
      id: 'sistema',
      name: 'Sistema',
      icon: Database,
      description: 'Configuraciones técnicas avanzadas'
    }
  ]

  const saveCompanyData = () => {
    try {
      const companyData = {
        name: companyName.trim(),
        cuit: companyCUIT.trim(),
        address: companyAddress.trim(),
        phone: companyPhone.trim(),
        email: companyEmail.trim()
      }
      
      localStorage.setItem('evita-company', JSON.stringify(companyData))
      localStorage.setItem('evita-company-name', companyData.name)
      localStorage.setItem('evita-company-cuit', companyData.cuit)
      localStorage.setItem('evita-company-address', companyData.address)
      localStorage.setItem('evita-company-phone', companyData.phone)
      localStorage.setItem('evita-company-email', companyData.email)
      
      showSuccessMessage('Datos de empresa guardados correctamente')
    } catch (error) {
      console.error('Error saving company data:', error)
      showErrorMessage('No se pudieron guardar los datos de la empresa')
    }
  }

  const saveNotificationSettings = () => {
    try {
      localStorage.setItem('evita-email-notifications', JSON.stringify(emailNotifications))
      localStorage.setItem('evita-stock-alerts', JSON.stringify(stockAlerts))
      localStorage.setItem('evita-payment-reminders', JSON.stringify(paymentReminders))
      
      showSuccessMessage('Configuración de notificaciones guardada')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      showErrorMessage('No se pudo guardar la configuración de notificaciones')
    }
  }

  const saveSystemSettings = () => {
    try {
      localStorage.setItem('evita-auto-save', JSON.stringify(autoSave))
      
      showSuccessMessage('Configuración del sistema guardada')
    } catch (error) {
      console.error('Error saving system settings:', error)
      showErrorMessage('No se pudo guardar la configuración del sistema')
    }
  }

  const showSuccessMessage = (message) => {
    console.log('✅ Success:', message)
    alert(message) // Temporal
  }

  const showErrorMessage = (message) => {
    console.error('❌ Error:', message)
    alert(message) // Temporal
  }

  const handleThemeChange = (themeName) => {
    changeTheme(themeName)
    showSuccessMessage(`Tema "${themes[themeName].name}" aplicado correctamente`)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showErrorMessage('Por favor selecciona una imagen válida (PNG, JPG, GIF, WebP)')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorMessage('La imagen no puede ser mayor a 5MB')
      return
    }

    setUploadingLogo(true)
    setLogoProgress(0)

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setLogoProgress(prev => Math.min(prev + 20, 90))
      }, 300)

      // Si ya existe un logo, eliminarlo primero
      if (currentLogoPath) {
        await deleteFile(BUCKETS.LOGOS, currentLogoPath)
      }

      // Subir nuevo logo
      const fileName = `company-logo-${Date.now()}.${file.name.split('.').pop()}`
      const result = await uploadLogo(file, fileName)

      clearInterval(progressInterval)
      setLogoProgress(100)

      if (result.success) {
        // Guardar información del logo
        localStorage.setItem('evita-logo', result.data.publicUrl)
        localStorage.setItem('evita-logo-path', result.data.path)
        setCurrentLogoPath(result.data.path)
        setLogoUrl(result.data.publicUrl)
        
        showSuccessMessage('Logo subido exitosamente')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      showErrorMessage('Error al subir el logo: ' + error.message)
    } finally {
      setTimeout(() => {
        setUploadingLogo(false)
        setLogoProgress(0)
      }, 1000)
    }
  }

  const handleLogoRemove = async () => {
    if (!currentLogoPath && !logoUrl) {
      showErrorMessage('No hay logo para eliminar')
      return
    }

    try {
      setUploadingLogo(true)
      
      if (currentLogoPath) {
        const result = await deleteFile(BUCKETS.LOGOS, currentLogoPath)
        if (!result.success) {
          throw new Error(result.error)
        }
      }
      
      localStorage.removeItem('evita-logo')
      localStorage.removeItem('evita-logo-path')
      setCurrentLogoPath(null)
      setLogoUrl(null)
      
      showSuccessMessage('Logo eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting logo:', error)
      showErrorMessage('Error al eliminar el logo: ' + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const getThemePreview = (themeData) => {
    const colors = themeData.colors
    return (
      <div className="flex gap-2 mb-3">
        <div className={`w-5 h-5 rounded-full bg-${colors.primary} border-2 border-white/20`}></div>
        <div className={`w-5 h-5 rounded-full bg-${colors.accent} border-2 border-white/20`}></div>
        <div className={`w-5 h-5 rounded-full bg-${colors.surface} border-2 border-white/20`}></div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-8">
            <div>
              <h2 className={cn("text-2xl font-bold mb-2", `text-${theme.colors.text}`)}>
                Configuración General
              </h2>
              <p className={cn("text-sm mb-6", `text-${theme.colors.textSecondary}`)}>
                Configuraciones básicas del sistema EVITA
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-${theme.colors.primary}/10`, `text-${theme.colors.primary}`)}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>Auto-guardado</h3>
                </div>
                <p className={cn("text-sm mb-4", `text-${theme.colors.textSecondary}`)}>
                  Guardar automáticamente los cambios mientras trabajas
                </p>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className={cn("form-checkbox h-4 w-4 rounded", `text-${theme.colors.primary}`)}
                  />
                  <span className={cn("ml-2 text-sm", `text-${theme.colors.text}`)}>
                    Activar auto-guardado
                  </span>
                </label>
              </div>

              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-${theme.colors.accent}/10`, `text-${theme.colors.accent}`)}>
                    <Globe className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>Idioma</h3>
                </div>
                <select className={cn(
                  "w-full px-3 py-2 rounded-lg border",
                  `bg-${theme.colors.background}`,
                  `border-${theme.colors.border}`,
                  `text-${theme.colors.text}`,
                  "focus:outline-none focus:ring-2",
                  `focus:ring-${theme.colors.primary}`
                )}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSystemSettings}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                  `bg-${theme.colors.primary}`,
                  `text-${theme.colors.primaryText}`,
                  `hover:bg-${theme.colors.primaryHover}`
                )}
              >
                <Check className="h-4 w-4" />
                Guardar Configuración
              </button>
            </div>
          </div>
        )

      case 'empresa':
        return (
          <div className="space-y-8">
            <div>
              <h2 className={cn("text-2xl font-bold mb-2", `text-${theme.colors.text}`)}>
                Información de la Empresa
              </h2>
              <p className={cn("text-sm mb-6", `text-${theme.colors.textSecondary}`)}>
                Esta información aparecerá en facturas, reportes y documentos PDF
              </p>
            </div>

            {/* Logo Section */}
            <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2 rounded-lg", `bg-${theme.colors.primary}/10`)}>
                  <svg fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", `text-${theme.colors.primary}`)}>
                    <path d="M8 10h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2z" fill="currentColor" opacity="0.3"/>
                    <path d="M10 14h8v1H10v-1zm0 2h6v1h-6v-1z" fill="currentColor"/>
                    <circle cx="9" cy="12" r="1" fill="currentColor"/>
                    <path d="M22 8l2 2-2 2-1-1 1-1-1-1 1-1z" fill="currentColor"/>
                    <circle cx="24" cy="7" r="0.8" fill="currentColor" opacity="0.8"/>
                    <circle cx="26" cy="9" r="0.6" fill="currentColor" opacity="0.6"/>
                    <circle cx="25" cy="11" r="0.4" fill="currentColor" opacity="0.4"/>
                  </svg>
                </div>
                <div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>Logo de la Empresa</h3>
                  <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                    Personaliza el logo que aparece en el sistema
                  </p>
                </div>
              </div>

              {/* Current Logo Preview */}
              {logoUrl && (
                <div className="mb-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                      <img src={logoUrl} alt="Logo actual" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <p className={cn("font-medium", `text-${theme.colors.text}`)}>Logo actual</p>
                      <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                        Almacenado en Supabase Storage
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {uploadingLogo && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                      {logoProgress === 100 ? 'Completado' : 'Subiendo...'}
                    </span>
                    <span className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                      {logoProgress}%
                    </span>
                  </div>
                  <div className={cn("w-full rounded-full h-2", `bg-${theme.colors.border}`)}>
                    <div 
                      className={cn("h-2 rounded-full transition-all duration-300", `bg-${theme.colors.primary}`)}
                      style={{ width: `${logoProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors",
                  uploadingLogo ? "opacity-50 cursor-not-allowed" : "",
                  `bg-${theme.colors.primary}`,
                  `text-${theme.colors.primaryText}`,
                  `hover:bg-${theme.colors.primaryHover}`
                )}>
                  {uploadingLogo ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={handleLogoRemove}
                  disabled={uploadingLogo || (!currentLogoPath && !logoUrl)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    (uploadingLogo || (!currentLogoPath && !logoUrl)) ? "opacity-50 cursor-not-allowed" : "",
                    "bg-red-600 hover:bg-red-700 text-white"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  Quitar
                </button>
              </div>

              <div className={cn("mt-3 text-xs", `text-${theme.colors.textSecondary}`)}>
                Formatos soportados: PNG, JPG, GIF, WebP • Tamaño máximo: 5MB
              </div>

              {/* Storage status */}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  storageInitialized ? "bg-green-400" : "bg-yellow-400"
                )}></div>
                <span className={cn(
                  storageInitialized ? "text-green-400" : "text-yellow-400"
                )}>
                  {storageInitialized ? "Almacenamiento listo" : "Inicializando almacenamiento..."}
                </span>
              </div>
            </div>

            {/* Company Information */}
            <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
              <h3 className={cn("font-semibold mb-4", `text-${theme.colors.text}`)}>
                Datos Corporativos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      `bg-${theme.colors.background}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      "placeholder-gray-400 focus:outline-none focus:ring-2",
                      `focus:ring-${theme.colors.primary}`,
                      "focus:border-transparent"
                    )}
                    placeholder="EVITA Artículos de Limpieza"
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    CUIT / RUC
                  </label>
                  <input
                    type="text"
                    value={companyCUIT}
                    onChange={(e) => setCompanyCUIT(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      `bg-${theme.colors.background}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      "placeholder-gray-400 focus:outline-none focus:ring-2",
                      `focus:ring-${theme.colors.primary}`,
                      "focus:border-transparent"
                    )}
                    placeholder="20-12345678-3"
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      `bg-${theme.colors.background}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      "placeholder-gray-400 focus:outline-none focus:ring-2",
                      `focus:ring-${theme.colors.primary}`,
                      "focus:border-transparent"
                    )}
                    placeholder="Av. Principal 123, Ciudad"
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      `bg-${theme.colors.background}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      "placeholder-gray-400 focus:outline-none focus:ring-2",
                      `focus:ring-${theme.colors.primary}`,
                      "focus:border-transparent"
                    )}
                    placeholder="(11) 5555-5555"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      `bg-${theme.colors.background}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      "placeholder-gray-400 focus:outline-none focus:ring-2",
                      `focus:ring-${theme.colors.primary}`,
                      "focus:border-transparent"
                    )}
                    placeholder="info@evita.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveCompanyData}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                  `bg-${theme.colors.primary}`,
                  `text-${theme.colors.primaryText}`,
                  `hover:bg-${theme.colors.primaryHover}`
                )}
              >
                <Check className="h-4 w-4" />
                Guardar Información
              </button>
            </div>
          </div>
        )

      case 'temas':
        return (
          <div className="space-y-8">
            <div>
              <h2 className={cn("text-2xl font-bold mb-2", `text-${theme.colors.text}`)}>
                Personalización Visual
              </h2>
              <p className={cn("text-sm mb-6", `text-${theme.colors.textSecondary}`)}>
                Elige el tema que mejor se adapte a tu estilo de trabajo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(themes).map(([key, themeData]) => (
                <div
                  key={key}
                  className={cn(
                    "relative p-5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105",
                    currentTheme === key
                      ? `border-${theme.colors.primary} bg-${theme.colors.primary}/5 shadow-lg`
                      : `border-${theme.colors.border} hover:border-${theme.colors.primary}/50`,
                    `bg-${theme.colors.surface}`
                  )}
                  onClick={() => handleThemeChange(key)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                          {themeData.name}
                        </h3>
                        {currentTheme === key && (
                          <div className={cn("p-1 rounded-full", `bg-${theme.colors.primary}`)}>
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className={cn("text-sm mb-3", `text-${theme.colors.textSecondary}`)}>
                        {themeData.description}
                      </p>
                      {getThemePreview(themeData)}
                    </div>
                  </div>

                  {/* Theme tags */}
                  <div className="flex gap-2 text-xs flex-wrap">
                    {key === 'default' && (
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">
                        Clásico
                      </span>
                    )}
                    {key === 'corporate' && (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                        Profesional
                      </span>
                    )}
                    {key === 'elegant' && (
                      <span className="px-2 py-1 bg-pink-500/10 text-pink-400 rounded">
                        Elegante
                      </span>
                    )}
                    {key === 'violetAbyss' && (
                      <span className="px-2 py-1 bg-violet-500/10 text-violet-400 rounded">
                        Misterioso
                      </span>
                    )}
                    {key === 'gridMatrix' && (
                      <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded">
                        Tecnológico
                      </span>
                    )}
                    {key === 'diagonalFire' && (
                      <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded">
                        Dinámico
                      </span>
                    )}

                    {/* Background type indicator */}
                    {themeData.background?.type === 'gradient' && (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
                        Gradiente
                      </span>
                    )}
                    {themeData.background?.type === 'pattern' && (
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded">
                        Patrón
                      </span>
                    )}
                    {themeData.background?.type === 'solid' && (
                      <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded">
                        Sólido
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
              <div className="flex items-center gap-3 mb-4">
                <Info className={cn("h-5 w-5", `text-${theme.colors.primary}`)} />
                <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                  Sobre los Temas
                </h3>
              </div>
              <ul className={cn("text-sm space-y-2", `text-${theme.colors.textSecondary}`)}>
                <li>• <strong>EVITA Clásico:</strong> Colores verdes corporativos, ideal para uso general</li>
                <li>• <strong>Empresarial Profesional:</strong> Tonos azules y grises para un ambiente profesional</li>
                <li>• <strong>Elegante Sofisticado:</strong> Paleta de rosados y morados con estilo sofisticado</li>
                <li>• <strong>Temas con Fondos Especiales:</strong> Experiencias visuales únicas con gradientes y patrones</li>
                <li>• Los textos siempre se mantienen legibles en todos los temas</li>
              </ul>
            </div>
          </div>
        )

      case 'notificaciones':
        return (
          <div className="space-y-8">
            <div>
              <h2 className={cn("text-2xl font-bold mb-2", `text-${theme.colors.text}`)}>
                Notificaciones y Alertas
              </h2>
              <p className={cn("text-sm mb-6", `text-${theme.colors.textSecondary}`)}>
                Configura cómo y cuándo recibir notificaciones del sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-${theme.colors.primary}/10`, `text-${theme.colors.primary}`)}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                    Notificaciones por Email
                  </h3>
                </div>
                <p className={cn("text-sm mb-4", `text-${theme.colors.textSecondary}`)}>
                  Recibe reportes y alertas importantes por correo electrónico
                </p>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className={cn("form-checkbox h-4 w-4 rounded", `text-${theme.colors.primary}`)}
                  />
                  <span className={cn("ml-2 text-sm", `text-${theme.colors.text}`)}>
                    Activar notificaciones por email
                  </span>
                </label>
              </div>

              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-${theme.colors.accent}/10`, `text-${theme.colors.accent}`)}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                    Alertas de Stock
                  </h3>
                </div>
                <p className={cn("text-sm mb-4", `text-${theme.colors.textSecondary}`)}>
                  Recibe avisos cuando el stock esté bajo o productos sin disponibilidad
                </p>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={stockAlerts}
                    onChange={(e) => setStockAlerts(e.target.checked)}
                    className={cn("form-checkbox h-4 w-4 rounded", `text-${theme.colors.primary}`)}
                  />
                  <span className={cn("ml-2 text-sm", `text-${theme.colors.text}`)}>
                    Activar alertas de stock
                  </span>
                </label>
              </div>

              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-yellow-500/10`, "text-yellow-400")}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                    Recordatorios de Pago
                  </h3>
                </div>
                <p className={cn("text-sm mb-4", `text-${theme.colors.textSecondary}`)}>
                  Enviar recordatorios automáticos a clientes con pagos pendientes
                </p>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={paymentReminders}
                    onChange={(e) => setPaymentReminders(e.target.checked)}
                    className={cn("form-checkbox h-4 w-4 rounded", `text-${theme.colors.primary}`)}
                  />
                  <span className={cn("ml-2 text-sm", `text-${theme.colors.text}`)}>
                    Activar recordatorios de pago
                  </span>
                </label>
              </div>

              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-blue-500/10`, "text-blue-400")}>
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                    Reportes Automáticos
                  </h3>
                </div>
                <p className={cn("text-sm mb-4", `text-${theme.colors.textSecondary}`)}>
                  Configura la frecuencia de reportes automáticos
                </p>
                <select className={cn(
                  "w-full px-3 py-2 rounded-lg border",
                  `bg-${theme.colors.background}`,
                  `border-${theme.colors.border}`,
                  `text-${theme.colors.text}`
                )}>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="nunca">Nunca</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveNotificationSettings}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                  `bg-${theme.colors.primary}`,
                  `text-${theme.colors.primaryText}`,
                  `hover:bg-${theme.colors.primaryHover}`
                )}
              >
                <Check className="h-4 w-4" />
                Guardar Configuración
              </button>
            </div>
          </div>
        )

      case 'usuario':
        return (
          <div className="space-y-8">
            <div>
              <h2 className={cn("text-2xl font-bold mb-2", `text-${theme.colors.text}`)}>
                Perfil de Usuario
              </h2>
              <p className={cn("text-sm mb-6", `text-${theme.colors.textSecondary}`)}>
                Administra tu información personal y preferencias de la cuenta
              </p>
            </div>

            <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
              <h3 className={cn("font-semibold mb-4", `text-${theme.colors.text}`)}>
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.user_metadata?.name || ''}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      `bg-${theme.colors.background}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`,
                      "placeholder-gray-400 focus:outline-none focus:ring-2",
                      `focus:ring-${theme.colors.primary}`
                    )}
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border opacity-50",
                      `bg-${theme.colors.background}`,
                      `border-${theme.colors.border}`,
                      `text-${theme.colors.text}`
                    )}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Rol
                  </label>
                  <select className={cn(
                    "w-full px-3 py-2 rounded-lg border",
                    `bg-${theme.colors.background}`,
                    `border-${theme.colors.border}`,
                    `text-${theme.colors.text}`
                  )}>
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente</option>
                    <option value="employee">Empleado</option>
                  </select>
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", `text-${theme.colors.text}`)}>
                    Zona Horaria
                  </label>
                  <select className={cn(
                    "w-full px-3 py-2 rounded-lg border",
                    `bg-${theme.colors.background}`,
                    `border-${theme.colors.border}`,
                    `text-${theme.colors.text}`
                  )}>
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                    <option value="America/Lima">Lima (GMT-5)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                  `bg-${theme.colors.primary}`,
                  `text-${theme.colors.primaryText}`,
                  `hover:bg-${theme.colors.primaryHover}`
                )}
              >
                <Check className="h-4 w-4" />
                Actualizar Perfil
              </button>
            </div>
          </div>
        )

      case 'sistema':
        return (
          <div className="space-y-8">
            <div>
              <h2 className={cn("text-2xl font-bold mb-2", `text-${theme.colors.text}`)}>
                Configuración del Sistema
              </h2>
              <p className={cn("text-sm mb-6", `text-${theme.colors.textSecondary}`)}>
                Configuraciones avanzadas y herramientas de sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-${theme.colors.primary}/10`, `text-${theme.colors.primary}`)}>
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                    Base de Datos
                  </h3>
                </div>
                <p className={cn("text-sm mb-4", `text-${theme.colors.textSecondary}`)}>
                  Estado de conexión y herramientas de mantenimiento
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className={cn("text-sm", `text-${theme.colors.text}`)}>
                      Conectado a Supabase
                    </span>
                  </div>
                  <button className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors",
                    `border-${theme.colors.border}`,
                    `hover:bg-${theme.colors.border}/10`
                  )}>
                    <RefreshCw className="h-4 w-4 inline mr-2" />
                    Verificar Conexión
                  </button>
                </div>
              </div>

              <div className={cn("p-6 rounded-xl border", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", `bg-${theme.colors.accent}/10`, `text-${theme.colors.accent}`)}>
                    <Download className="h-5 w-5" />
                  </div>
                  <h3 className={cn("font-semibold", `text-${theme.colors.text}`)}>
                    Respaldos
                  </h3>
                </div>
                <p className={cn("text-sm mb-4", `text-${theme.colors.textSecondary}`)}>
                  Exportar datos importantes del sistema
                </p>
                <div className="space-y-2">
                  <button className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg border transition-colors",
                    `border-${theme.colors.border}`,
                    `hover:bg-${theme.colors.border}/10`
                  )}>
                    Exportar Productos
                  </button>
                  <button className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg border transition-colors",
                    `border-${theme.colors.border}`,
                    `hover:bg-${theme.colors.border}/10`
                  )}>
                    Exportar Clientes
                  </button>
                  <button className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg border transition-colors",
                    `border-${theme.colors.border}`,
                    `hover:bg-${theme.colors.border}/10`
                  )}>
                    Exportar Facturas
                  </button>
                </div>
              </div>
            </div>

            <div className={cn("p-6 rounded-xl border border-red-500/20 bg-red-500/5")}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="font-semibold text-red-400">Zona de Peligro</h3>
              </div>
              <p className="text-sm text-red-300 mb-4">
                Estas acciones no se pueden deshacer. Procede con precaución.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Resetear Configuración
                </button>
                <button className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-sm font-medium transition-colors">
                  Limpiar Todos los Datos
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn(
      "min-h-screen",
      theme.background?.type === 'solid' ? theme.background.value : "bg-transparent"
    )}>
      {/* Layout con sidebar */}
      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className={cn(
          "w-80 p-6 border-r backdrop-blur-sm",
          `bg-${theme.colors.surface}/80`,
          `border-${theme.colors.border}`
        )}>
          {/* Header del sidebar */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-xl", `bg-${theme.colors.primary}/10`)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-5 w-5", `text-${theme.colors.primary}`)}>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <div>
                <h1 className={cn("text-xl font-bold", `text-${theme.colors.text}`)}>
                  Configuración
                </h1>
                <p className={cn("text-sm", `text-${theme.colors.textSecondary}`)}>
                  Sistema EVITA
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                    isActive
                      ? `bg-${theme.colors.primary} text-${theme.colors.primaryText} shadow-lg scale-[1.02]`
                      : `text-${theme.colors.textSecondary} hover:text-${theme.colors.text} hover:bg-${theme.colors.surface} hover:scale-[1.01]`
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className={cn("font-medium", isActive ? `text-${theme.colors.primaryText}` : `text-${theme.colors.text}`)}>
                      {section.name}
                    </div>
                    <div className={cn("text-xs", isActive ? `text-${theme.colors.primaryText}/80` : `text-${theme.colors.textSecondary}`)}>
                      {section.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className={cn(
            "rounded-2xl border h-full overflow-y-auto",
            `bg-${theme.colors.surface}/30`,
            `border-${theme.colors.border}`,
            "backdrop-blur-sm"
          )}>
            <div className="p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}