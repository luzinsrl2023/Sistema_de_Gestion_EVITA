import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Package, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [logoUrl, setLogoUrl] = useState(() => {
    try {
      return localStorage.getItem('evita-logo') || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      console.log('✅ User detected in Login component:', user)
      navigate('/tablero')
    }

    // Log system status for debugging
    console.log('🎆 EVITA Sistema de Gestión cargado')
    console.log('🚀 Demo disponible: test@example.com / password123')
    console.log('📄 Current user state:', user)
    
    // Listen for logo changes
    const handleStorageChange = (e) => {
      if (e.key === 'evita-logo') {
        setLogoUrl(e.newValue)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      console.log('🚀 Attempting login with EVITA system...')
      const { session, error } = await login(formData.email, formData.password)
      
      console.log('📊 Login result:', { session, error })
      
      if (error) {
        console.error('❌ Login error:', error)
        setErrors({ general: 'Email o contraseña incorrectos. Usa las credenciales de demo: test@example.com / password123' })
      } else if (session?.user) {
        console.log('✅ Login successful, user data:', session.user)
        console.log('🔄 Waiting for navigation...')
        // The navigation is handled by the useEffect hook watching the user state
      } else {
        console.log('⚠️ Login succeeded but no user data')
        setErrors({ general: 'Error en la autenticación. Inténtalo de nuevo.' })
      }
    } catch (error) {
      console.error('⚠️ Login exception:', error)
      setErrors({ general: 'Error al iniciar sesión. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo de la empresa" 
                  className="w-full h-full object-contain rounded-2xl"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    // Show default logo if image fails to load
                    const defaultLogo = e.target.parentNode.querySelector('.default-logo')
                    if (defaultLogo) defaultLogo.style.display = 'block'
                  }}
                />
              ) : (
                <svg 
                  fill="none" 
                  viewBox="0 0 48 48" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-9 h-9 text-white default-logo"
                >
                  {/* EVITA Logo - Cleaning supplies with sparkle effect */}
                  <path d="M12 15h24c1.7 0 3 1.3 3 3v12c0 1.7-1.3 3-3 3H12c-1.7 0-3-1.3-3-3V18c0-1.7 1.3-3 3-3z" fill="currentColor" opacity="0.3"/>
                  <path d="M15 21h12v1.5H15V21zm0 3h9v1.5h-9V24z" fill="currentColor"/>
                  <circle cx="13.5" cy="18" r="1.5" fill="currentColor"/>
                  <path d="M33 12l3 3-3 3-1.5-1.5 1.5-1.5-1.5-1.5L33 12z" fill="currentColor"/>
                  <circle cx="36" cy="10.5" r="1.2" fill="currentColor" opacity="0.8"/>
                  <circle cx="39" cy="13.5" r="0.9" fill="currentColor" opacity="0.6"/>
                  <circle cx="37.5" cy="16.5" r="0.6" fill="currentColor" opacity="0.4"/>
                </svg>
              )}
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            {logoUrl ? 'Bienvenido' : 'EVITA Artículos de Limpieza'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sistema de Gestión Empresarial
          </p>
          <p className="mt-1 text-xs text-green-400">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-gray-800 border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-gray-800 border ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors`}
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

        </div>

        {/* Demo credentials */}
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-400">
              🚀 Demo del Sistema EVITA
            </p>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: 'test@example.com',
                  password: 'password123'
                })
              }}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
            >
              Usar Demo
            </button>
          </div>
          <div className="text-sm text-gray-300">
            <p className="flex items-center gap-2">
              <span className="text-green-400">✉️</span>
              <strong>Email:</strong> test@example.com
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-400">🔑</span>
              <strong>Contraseña:</strong> password123
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            📝 Utiliza estas credenciales para probar todas las funciones del sistema
          </p>
        </div>
      </div>
    </div>
  )
}