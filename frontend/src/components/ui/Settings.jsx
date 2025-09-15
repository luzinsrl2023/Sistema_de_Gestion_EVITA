import React, { useState } from 'react'
import {
  Settings as SettingsIcon,
  Palette,
  User,
  Moon,
  Sun,
  Monitor,
  Check,
  X,
  Building2
} from 'lucide-react'
import { useTheme, themes } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

export default function Settings({ isOpen, onClose, onLogoChange }) {
  const { currentTheme, changeTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('themes')
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('evita-company-name') || '')
  const [companyCUIT, setCompanyCUIT] = useState(() => localStorage.getItem('evita-company-cuit') || '')
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('evita-company-address') || '')
  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem('evita-company-phone') || '')

  const saveCompany = () => {
    const payload = {
      name: companyName.trim(),
      cuit: companyCUIT.trim(),
      address: companyAddress.trim(),
      phone: companyPhone.trim(),
    }
    try {
      localStorage.setItem('evita-company', JSON.stringify(payload))
      localStorage.setItem('evita-company-name', payload.name)
      localStorage.setItem('evita-company-cuit', payload.cuit)
      localStorage.setItem('evita-company-address', payload.address)
      localStorage.setItem('evita-company-phone', payload.phone)
      alert('Datos de empresa guardados')
    } catch (e) {
      console.error('No se pudo guardar datos de empresa', e)
      alert('No se pudo guardar datos de empresa')
    }
  }


  if (!isOpen) return null

  const handleThemeChange = (themeName) => {
    changeTheme(themeName)
  }
  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        localStorage.setItem('evita-logo', reader.result)
        onLogoChange && onLogoChange(reader.result)
      } catch (err) {
        console.error('No se pudo guardar el logo:', err)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = () => {
    try {
      localStorage.removeItem('evita-logo')
      onLogoChange && onLogoChange(null)
    } catch (err) {
      console.error('No se pudo eliminar el logo:', err)
    }
  }


  const getThemePreview = (theme) => {
    const colors = theme.colors
    return (
      <div className="flex gap-2 mb-2">
        <div className={`w-4 h-4 rounded-full bg-${colors.primary}`}></div>
        <div className={`w-4 h-4 rounded-full bg-${colors.accent}`}></div>
        <div className={`w-4 h-4 rounded-full bg-${colors.surface}`}></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose}></div>

        <div className="relative transform overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-xl transition-all w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Configuración del Sistema</h3>
                <p className="text-sm text-gray-400">Personaliza tu experiencia en EVITA</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-48 border-r border-gray-800 p-4">
                <button
                  onClick={() => setActiveTab('company')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    activeTab === 'company'
                      ? "bg-green-500/10 text-green-400"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Empresa
                </button>

              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('themes')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    activeTab === 'themes'
                      ? "bg-green-500/10 text-green-400"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Palette className="h-4 w-4" />
                  Temas
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    activeTab === 'profile'
                      ? "bg-green-500/10 text-green-400"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <User className="h-4 w-4" />
                  Perfil
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === 'themes' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Seleccionar Tema</h4>
                    <p className="text-gray-400 text-sm mb-6">
                      Elige el tema que mejor se adapte a tu estilo de trabajo.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {Object.entries(themes).map(([key, theme]) => (
                      <div
                        key={key}
                        className={cn(
                          "relative p-4 rounded-lg border cursor-pointer transition-all",
                          currentTheme === key
                            ? "border-green-500 bg-green-500/5"
                            : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                        )}
                        onClick={() => handleThemeChange(key)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-medium text-white">{theme.name}</h5>
                              {currentTheme === key && (
                                <div className="p-1 bg-green-500 rounded-full">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{theme.description}</p>
                            {getThemePreview(theme)}
                          </div>
                        </div>

                        {/* Theme preview with background type indicator */}
                        <div className="mt-3 pt-3 border-t border-gray-700">
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
                            {key === 'variablePattern' && (
                              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded">
                                Geométrico
                              </span>
                            )}
                            {key === 'roseTwilight' && (
                              <span className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded">
                                Suave
                              </span>
                            )}
                            {key === 'pinkAurora' && (
                              <span className="px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 rounded">
                                Aurora
                              </span>
                            )}
                            {key === 'topSpotlight' && (
                              <span className="px-2 py-1 bg-white/10 text-white rounded">
                                Iluminado
                              </span>
                            )}
                            {key === 'stellarMist' && (
                              <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
                                Estelar
                              </span>
                            )}

                            {/* Background type indicator */}
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
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <h5 className="font-medium text-white mb-2">Logo de la empresa</h5>
                    <p className="text-sm text-gray-400 mb-3">
                      Sube un logo en PNG o JPG. Se guarda localmente para la demo.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleLogoUpload}
                        className="text-sm text-gray-300"
                      />
                      <button
                        onClick={handleLogoRemove}
                        className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Quitar logo
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">

                    <h5 className="font-medium text-white mb-2">Sobre los Temas</h5>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• <strong>EVITA Clásico:</strong> Colores verdes corporativos, ideal para uso general</li>
                      <li>• <strong>Empresarial Profesional:</strong> Tonos azules y grises para un ambiente profesional</li>
                      <li>• <strong>Elegante Sofisticado:</strong> Paleta de rosados y morados con estilo sofisticado</li>
                      <li>• <strong>Temas con Fondos Especiales:</strong> Experiencias visuales únicas con gradientes y patrones</li>
                      <li>• Los textos siempre se mantienen legibles en todos los temas</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'company' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Datos de la Empresa</h4>
                    <p className="text-gray-400 text-sm mb-6">Estos datos aparecerán en los PDF (recibos, reportes, facturas).</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Nombre Comercial</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="EVITA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">CUIT</label>
                      <input
                        type="text"
                        value={companyCUIT}
                        onChange={(e) => setCompanyCUIT(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="20-12345678-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Dirección</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Calle 123, Ciudad"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Teléfono</label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="(11) 5555-5555"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={saveCompany}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Guardar Datos de Empresa
                    </button>
                  </div>
                </div>
              )}


              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Configuración de Perfil</h4>
                    <p className="text-gray-400 text-sm mb-6">
                      Personaliza tu información de usuario.
                    </p>
                  </div>

              {activeTab === 'company' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Datos de la Empresa</h4>
                    <p className="text-gray-400 text-sm mb-6">Estos datos aparecerán en los PDF (recibos, reportes, facturas).</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Nombre Comercial</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="EVITA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">CUIT</label>
                      <input
                        type="text"
                        value={companyCUIT}
                        onChange={(e) => setCompanyCUIT(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="20-12345678-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Dirección</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Calle 123, Ciudad"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Teléfono</label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="(11) 5555-5555"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={saveCompany}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Guardar Datos de Empresa
                    </button>
                  </div>
                </div>
              )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Nombre de Usuario
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Preferencia de Tema
                      </label>
                      <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="auto">Automático (según el sistema)</option>
                        <option value="default">EVITA Clásico</option>
                        <option value="corporate">Empresarial Profesional</option>
                        <option value="elegant">Elegante Sofisticado</option>
                        <option value="violetAbyss">Abismo Violeta</option>
                        <option value="stellarMist">Niebla Estelar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Idioma
                      </label>
                      <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}