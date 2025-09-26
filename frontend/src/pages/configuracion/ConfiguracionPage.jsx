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
import * as XLSX from 'xlsx'
import Modal from '../../components/common/Modal'

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { currentTheme, changeTheme, theme, logoUrl, setAppLogo } = useTheme()
  const [activeSection, setActiveSection] = useState('general')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportConfig, setExportConfig] = useState({ type: null, format: 'json' })
  
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
      const result = await uploadLogo(file, (progress) => {
        setLogoProgress(progress)
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Actualizar estado global
      setAppLogo(result.url, result.path)

      showSuccessMessage('Logo actualizado correctamente')
    } catch (error) {
      console.error('Error uploading logo:', error)
      showErrorMessage('No se pudo subir el logo: ' + error.message)
    } finally {
      setUploadingLogo(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    const currentLogoPath = localStorage.getItem('evita-logo-path')
    if (!currentLogoPath) return

    try {
      const result = await deleteFile(BUCKETS.LOGOS, currentLogoPath)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Limpiar estado global
      setAppLogo(null)

      showSuccessMessage('Logo eliminado correctamente')
    } catch (error) {
      console.error('Error removing logo:', error)
      showErrorMessage('No se pudo eliminar el logo: ' + error.message)
    }
  }

  const openExportModal = (type) => {
    setExportConfig({ type, format: 'json' });
    setIsExportModalOpen(true);
  };

  const handleExport = () => {
    const { type, format } = exportConfig;
    setIsExportModalOpen(false);

    try {
      let data;
      let filename = `${type}_evita`;

      if (type === 'todo') {
        data = {
          productos: JSON.parse(localStorage.getItem('evita-productos') || '[]'),
          clientes: JSON.parse(localStorage.getItem('evita-clientes') || '[]'),
          facturas: JSON.parse(localStorage.getItem('evita-facturas') || '[]'),
          proveedores: JSON.parse(localStorage.getItem('evita-suppliers') || '[]'),
          cotizaciones: JSON.parse(localStorage.getItem('evita-cotizaciones') || '[]'),
          ordenes: JSON.parse(localStorage.getItem('evita-ordenes-compra') || '[]'),
        };
        filename = 'evita_datos_completos';
      } else {
        const keyMap = {
          productos: 'evita-productos',
          clientes: 'evita-clientes',
          facturas: 'evita-facturas',
          proveedores: 'evita-suppliers',
        };
        data = JSON.parse(localStorage.getItem(keyMap[type]) || '[]');
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(type === 'todo' ? data : data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${filename}.json`);
      } else if (format === 'csv' || format === 'excel') {
        const wb = XLSX.utils.book_new();
        if (type === 'todo') {
          Object.keys(data).forEach(key => {
            if (data[key].length > 0) {
              const ws = XLSX.utils.json_to_sheet(data[key]);
              XLSX.utils.book_append_sheet(wb, ws, key);
            }
          });
        } else {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, type);
        }

        if (format === 'csv') {
          // For CSV, we'll just export the first sheet if there are multiple
          const sheetName = wb.SheetNames[0];
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          downloadBlob(blob, `${filename}.csv`);
        } else { // excel
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/octet-stream' });
          downloadBlob(blob, `${filename}.xlsx`);
        }
      }
      
      showSuccessMessage(`Datos de ${type} exportados exitosamente como ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      showErrorMessage(`Error al exportar datos de ${type}`);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">
                Configuración General
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Configuraciones básicas del sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Rendimiento
                  </h3>
                </div>
                <p className="text-sm mb-4 text-gray-400">
                  Configuraciones de rendimiento del sistema
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Guardado Automático
                      </p>
                      <p className="text-xs text-gray-400">
                        Guardar cambios automáticamente
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSave}
                        onChange={(e) => setAutoSave(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Tiempo de Sesión
                  </h3>
                </div>
                <p className="text-sm mb-4 text-gray-400">
                  Configuración de tiempo de inactividad
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Minutos de Inactividad
                    </label>
                    <select className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="120">2 horas</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'empresa':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">
                Información de la Empresa
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Datos fiscales y de contacto de tu empresa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Datos Fiscales
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      CUIT/CIF
                    </label>
                    <input
                      type="text"
                      value={companyCUIT}
                      onChange={(e) => setCompanyCUIT(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="XX-XXXXXXXX-X"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Dirección
                    </label>
                    <textarea
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                      placeholder="Dirección completa"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Contacto
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+34 912 345 678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Email
                    </label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt="Logo de la empresa"
                          className="w-16 h-16 object-contain rounded-lg border border-gray-700"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                            uploadingLogo
                              ? 'bg-gray-700 text-gray-400'
                              : 'bg-teal-600 text-white hover:bg-teal-700'
                          }`}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Subir Logo
                            </>
                          )}
                        </label>
                        {uploadingLogo && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${logoProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {Math.round(logoProgress)}% completado
                            </p>
                          </div>
                        )}
                        {logoUrl && (
                          <button
                            onClick={handleRemoveLogo}
                            className="mt-2 flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveCompanyData}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700"
              >
                <Check className="h-4 w-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        )

      case 'temas':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">
                Personalización Visual
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Temas y colores del sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(themes).map(([key, themeData]) => (
                <div
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={cn(
                    'p-6 rounded-xl border cursor-pointer transition-all',
                    currentTheme === key
                      ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-500/5'
                      : 'border-gray-800 hover:border-gray-700 bg-gray-900'
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: themeData.primary }}
                    ></div>
                    <h3 className="font-semibold text-white">
                      {themeData.name}
                    </h3>
                    {currentTheme === key && (
                      <div className="ml-auto">
                        <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-400">Primario:</div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: themeData.primary }}
                      ></div>
                      <div className="text-xs text-gray-400">{themeData.primary}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-400">Secundario:</div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: themeData.secondary }}
                      ></div>
                      <div className="text-xs text-gray-400">{themeData.secondary}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'notificaciones':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">
                Configuración de Notificaciones
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Alertas y recordatorios automáticos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Notificaciones por Email
                  </h3>
                </div>
                <p className="text-sm mb-4 text-gray-400">
                  Recibir alertas importantes por correo electrónico
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Email de Notificaciones
                      </p>
                      <p className="text-xs text-gray-400">
                        Recibir alertas por email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Alertas de Stock
                      </p>
                      <p className="text-xs text-gray-400">
                        Notificar cuando el stock está bajo
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stockAlerts}
                        onChange={(e) => setStockAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Recordatorios de Pagos
                      </p>
                      <p className="text-xs text-gray-400">
                        Recordatorios de pagos pendientes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentReminders}
                        onChange={(e) => setPaymentReminders(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Notificaciones del Sistema
                  </h3>
                </div>
                <p className="text-sm mb-4 text-gray-400">
                  Alertas visuales en la interfaz
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Notificaciones Emergentes
                      </p>
                      <p className="text-xs text-gray-400">
                        Mostrar alertas en pantalla
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                        disabled
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Sonidos de Notificación
                      </p>
                      <p className="text-xs text-gray-400">
                        Reproducir sonidos para alertas
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                        disabled
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveNotificationSettings}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700"
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
              <h2 className="text-2xl font-bold mb-2 text-white">
                Perfil de Usuario
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Tu información personal y preferencias
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <User className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Información Personal
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || 'Usuario EVITA'}
                      className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                    Rol
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente</option>
                    <option value="employee">Empleado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Zona Horaria
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                    <option value="America/Lima">Lima (GMT-5)</option>
                  </select>
                </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700"
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
              <h2 className="text-2xl font-bold mb-2 text-white">
                Configuración del Sistema
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Configuraciones avanzadas y herramientas de sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Base de Datos
                  </h3>
                </div>
                <p className="text-sm mb-4 text-gray-400">
                  Estado de conexión y herramientas de mantenimiento
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-white">
                      Conectado a Supabase
                    </span>
                  </div>
                  <button className="w-full px-3 py-2 rounded-lg border transition-colors border-gray-700 hover:bg-gray-800 text-white">
                    <RefreshCw className="h-4 w-4 inline mr-2" />
                    Verificar Conexión
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-gray-900 border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Download className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">
                    Respaldos
                  </h3>
                </div>
                <p className="text-sm mb-4 text-gray-400">
                  Exportar datos importantes del sistema
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => openExportModal('productos')}
                    className="w-full px-3 py-2 text-sm rounded-lg border transition-colors border-gray-700 hover:bg-gray-800 text-white"
                  >
                    Exportar Productos
                  </button>
                  <button 
                    onClick={() => openExportModal('clientes')}
                    className="w-full px-3 py-2 text-sm rounded-lg border transition-colors border-gray-700 hover:bg-gray-800 text-white"
                  >
                    Exportar Clientes
                  </button>
                  <button 
                    onClick={() => openExportModal('facturas')}
                    className="w-full px-3 py-2 text-sm rounded-lg border transition-colors border-gray-700 hover:bg-gray-800 text-white"
                  >
                    Exportar Facturas
                  </button>
                  <button 
                    onClick={() => openExportModal('proveedores')}
                    className="w-full px-3 py-2 text-sm rounded-lg border transition-colors border-gray-700 hover:bg-gray-800 text-white"
                  >
                    Exportar Proveedores
                  </button>
                  <button 
                    onClick={() => openExportModal('todo')}
                    className="w-full px-3 py-2 text-sm rounded-lg border transition-colors bg-green-600 hover:bg-green-700 text-white border-green-700"
                  >
                    Exportar Todo
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
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
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-4">Configuración</h2>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                        activeSection === section.id
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {section.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Exportar ${exportConfig.type}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Formato de Exportación
            </label>
            <select
              value={exportConfig.format}
              onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel (XLSX)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700"
            >
              <Download className="h-4 w-4 inline mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}