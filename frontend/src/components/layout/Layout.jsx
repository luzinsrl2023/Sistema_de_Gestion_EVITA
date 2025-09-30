import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useDebounce } from '../../hooks/useDebounce'
import { searchProducts } from '../../services/productos'
import { searchClients } from '../../services/clientes'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  Building2,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  FileText,
  BarChart3,
  Contact2
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Tablero', href: '/tablero', icon: LayoutDashboard },
  { name: 'Ventas', icon: FileText, children: [
    { name: 'Cotizaciones', href: '/cotizaciones' },
    { name: 'Facturador', href: '/facturador' },
    { name: 'Administrador de Comprobantes', href: '/facturas' },
    { name: 'Clientes', href: '/clientes' },
  ]},
  { name: 'Compras', icon: ShoppingCart, children: [
    { name: 'Órdenes', href: '/compras' },
    { name: 'Nueva orden', href: '/compras/nueva' },
    { name: 'Actualización masiva de Productos', href: '/compras/actualizacion-productos' },
    { name: 'Proveedores', href: '/proveedores' },
    { name: 'Productos', href: '/productos' },
  ]},
  { name: 'Cobranzas', icon: Receipt, children: [
    { name: 'Cuentas Corrientes', href: '/cobranzas/cuentas-corrientes' },
    { name: 'Recibos', href: '/cobranzas/recibos' },
  ]},
  { name: 'Reportes', icon: BarChart3, children: [
    { name: 'Tablero', href: '/reportes' },
    { name: 'Ventas', href: '/reportes/ventas' },
    { name: 'Compras', href: '/reportes/compras' },
    { name: 'Stock', href: '/reportes/stock' },
  ]},
  { name: 'Prospectos', href: '/prospectos', icon: Contact2 },
  { name: 'Configuración', href: '/configuracion', icon: SettingsIcon },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { getThemeClasses, theme, logoUrl } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Global Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState({ productos: [], clientes: [] })
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearchTerm.length < 2) {
      setSearchOpen(false);
      setSearchResults({ productos: [], clientes: [] });
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const [productsResult, clientsResult] = await Promise.all([
          searchProducts(debouncedSearchTerm),
          searchClients(debouncedSearchTerm)
        ]);

        setSearchResults({
          productos: productsResult.data || [],
          clientes: clientsResult.data || []
        });
        setSearchOpen(true);
      } catch (error) {
        console.error('Error performing global search:', error);
        setSearchResults({ productos: [], clientes: [] });
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm]);

  const [notifications] = useState([
    { id: 1, title: 'Stock Bajo', message: 'Jabón para platos EVITA', time: '5 min', type: 'warning' },
    { id: 2, title: 'Nueva Venta', message: 'Pedido #INV-001234 completado', time: '15 min', type: 'success' },
    { id: 3, title: 'Pago Pendiente', message: 'Cliente Ana Gómez - Factura vencida', time: '1 hora', type: 'error' }
  ])

  const [openMenus, setOpenMenus] = useState({})
  const toggleMenu = (name) => setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }))

  const themeClasses = getThemeClasses()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={cn(
      "min-h-screen",
      theme.background?.type === 'solid' ? theme.background.value : "bg-transparent"
    )}>
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className={cn("fixed left-0 top-0 h-full w-64 border-r", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className={cn("flex items-center justify-between p-4 border-b", `border-${theme.colors.border}`)}>
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg", `bg-${theme.colors.primary}`)}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Logo failed to load:', e.target.src)
                      e.target.style.display = 'none'
                      // Show default logo if image fails to load
                      const parent = e.target.parentNode
                      const defaultLogo = parent.querySelector('.default-logo')
                      if (defaultLogo) {
                        defaultLogo.style.display = 'block'
                        parent.style.backgroundColor = '#10b981' // green-500
                      }
                    }}
                  />
                ) : (
                  <svg 
                    fill="none" 
                    viewBox="0 0 32 32" 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="w-6 h-6 text-white default-logo"
                  >
                    <path d="M8 10h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2z" fill="currentColor" opacity="0.3"/>
                    <path d="M10 14h8v1H10v-1zm0 2h6v1h-6v-1z" fill="currentColor"/>
                    <circle cx="9" cy="12" r="1" fill="currentColor"/>
                    <path d="M22 8l2 2-2 2-1-1 1-1-1-1 1-1z" fill="currentColor"/>
                    <circle cx="24" cy="7" r="0.8" fill="currentColor" opacity="0.8"/>
                    <circle cx="26" cy="9" r="0.6" fill="currentColor" opacity="0.6"/>
                    <circle cx="25" cy="11" r="0.4" fill="currentColor" opacity="0.4"/>
                  </svg>
                )}
              </div>
              <div>
                <h1 className={cn("text-lg font-bold leading-tight", `text-${theme.colors.text}`)}>
                  {logoUrl ? 'Sistema EVITA' : 'EVITA'}
                </h1>
                <p className={cn("text-xs -mt-0.5 font-medium", `text-${theme.colors.primaryText}`)}>
                  {logoUrl ? 'Gestión Empresarial' : 'Artículos de Limpieza'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={cn("p-1 hover:text-white", `text-${theme.colors.textSecondary}`)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const hasChildren = Array.isArray(item.children)
              const isParentActive = hasChildren && item.children.some(ch => location.pathname.startsWith(ch.href))

              if (!hasChildren) {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? `bg-${theme.colors.primaryLight} text-${theme.colors.primaryText}`
                        : `text-${theme.colors.textSecondary} hover:bg-${theme.colors.surface} hover:text-${theme.colors.text}`
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              }

              return (
                <div key={item.name}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-semibold",
                      isParentActive ? `text-${theme.colors.primaryText}` : `text-${theme.colors.textSecondary}`
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </span>
                    {openMenus[item.name] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {openMenus[item.name] && (
                    <div className="ml-8 space-y-1">
                      {item.children.map((child) => {
                        const isActive = location.pathname === child.href
                        return (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "block px-3 py-1.5 rounded-md text-sm",
                              isActive
                                ? `bg-${theme.colors.primaryLight} text-${theme.colors.primaryText}`
                                : `text-${theme.colors.textSecondary} hover:bg-${theme.colors.surface} hover:text-${theme.colors.text}`
                            )}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:border-r lg:block", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
        <div className={cn("flex items-center gap-3 p-6 border-b", `border-${theme.colors.border}`)}>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg", `bg-${theme.colors.primary}`)}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <svg fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                <path d="M8 10h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2z" fill="currentColor" opacity="0.3"/>
                <path d="M10 14h8v1H10v-1zm0 2h6v1h-6v-1z" fill="currentColor"/>
                <circle cx="9" cy="12" r="1" fill="currentColor"/>
                <path d="M22 8l2 2-2 2-1-1 1-1-1-1 1-1z" fill="currentColor"/>
                <circle cx="24" cy="7" r="0.8" fill="currentColor" opacity="0.8"/>
                <circle cx="26" cy="9" r="0.6" fill="currentColor" opacity="0.6"/>
                <circle cx="25" cy="11" r="0.4" fill="currentColor" opacity="0.4"/>
              </svg>
            )}
          </div>
          <div>
            <h1 className={cn("text-lg font-bold leading-tight", `text-${theme.colors.text}`)}>EVITA</h1>
            <p className={cn("text-xs -mt-0.5 font-medium", `text-${theme.colors.primaryText}`)}>Artículos de Limpieza</p>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const hasChildren = Array.isArray(item.children)
            const isParentActive = hasChildren && item.children.some(ch => location.pathname.startsWith(ch.href))

            if (!hasChildren) {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? `bg-${theme.colors.primaryLight} text-${theme.colors.primaryText}`
                      : `text-${theme.colors.textSecondary} hover:bg-${theme.colors.surface} hover:text-${theme.colors.text}`
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            }

            return (
              <div key={item.name}>
                <button
                  type="button"
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-semibold",
                    isParentActive ? `text-${theme.colors.primaryText}` : `text-${theme.colors.textSecondary}`
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </span>
                  {openMenus[item.name] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openMenus[item.name] && (
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => {
                      const isActive = location.pathname === child.href
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={cn(
                            "block px-3 py-1.5 rounded-md text-sm",
                            isActive
                              ? `bg-${theme.colors.primaryLight} text-${theme.colors.primaryText}`
                              : `text-${theme.colors.textSecondary} hover:bg-${theme.colors.surface} hover:text-${theme.colors.text}`
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User section */}
        <div className={cn("absolute bottom-0 left-0 right-0 p-4 border-t", `border-${theme.colors.border}`)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", `bg-${theme.colors.surface}`)}>
                <span className={cn("text-sm font-medium", `text-${theme.colors.text}`)}>
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-sm">
                <p className={cn("font-medium truncate max-w-[120px]", `text-${theme.colors.text}`)}>
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </p>
                <p className={`text-${theme.colors.textSecondary}`}>Admin</p>
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={handleSignOut}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105",
                  "bg-gradient-to-r from-red-600/10 to-red-500/10",
                  "border border-red-500/20 hover:border-red-400/40",
                  "text-red-400 hover:text-red-300",
                  "hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-500/20",
                  "hover:shadow-lg hover:shadow-red-500/25",
                  "active:scale-95"
                )}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-medium hidden lg:block">Salir</span>
              </button>
              
              {/* Tooltip for mobile */}
              <div className="lg:hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Cerrar sesión
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className={cn("border-b px-4 py-4 lg:px-6", `bg-${theme.colors.surface}`, `border-${theme.colors.border}`)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className={cn("p-2 hover:text-white lg:hidden", `text-${theme.colors.textSecondary}`)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative max-w-md w-full" onMouseLeave={() => setSearchOpen(false)}>
                <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4", `text-${theme.colors.textSecondary}`)} />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      navigate(`/productos?q=${encodeURIComponent(searchTerm.trim())}`)
                      setSearchOpen(false)
                    }
                  }}
                  placeholder="Buscar productos, clientes..."
                  className={cn(
                    "w-full border rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent",
                    `bg-${theme.colors.background}`,
                    `border-${theme.colors.border}`,
                    `text-${theme.colors.text}`,
                    `focus:ring-${theme.colors.primary}`
                  )}
                />

                {searchOpen && (searchResults.productos.length > 0 || searchResults.clientes.length > 0) && (
                  <div className={cn(
                    "absolute z-50 mt-2 w-full rounded-lg border shadow-xl",
                    `bg-${theme.colors.surface}`,
                    `border-${theme.colors.border}`
                  )}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {/* Productos */}
                    {searchResults.productos.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-400">Productos</div>
                        {searchResults.productos.map((p) => (
                          <button
                            key={`p-${p.id || p.sku}`}
                            onClick={() => {
                              navigate(`/productos?q=${encodeURIComponent(searchTerm.trim())}`)
                              setSearchOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className={cn("text-sm", `text-${theme.colors.text}`)}>{p.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                            </div>
                          </button>
                        ))}
                        <div className="px-2 pb-2">
                          <button
                            onClick={() => {
                              navigate(`/productos?q=${encodeURIComponent(searchTerm.trim())}`)
                              setSearchOpen(false)
                            }}
                            className="w-full text-xs text-green-400 hover:text-green-300 text-left px-2 py-1"
                          >
                            Ver todos los productos
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Clientes */}
                    {searchResults.clientes.length > 0 && (
                      <div className="p-2 border-t border-gray-700/70">
                        <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-400">Clientes</div>
                        {searchResults.clientes.map((c) => (
                          <button
                            key={`c-${c.id}`}
                            onClick={() => {
                              navigate(`/clientes?q=${encodeURIComponent(searchTerm.trim())}`)
                              setSearchOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className={cn("text-sm", `text-${theme.colors.text}`)}>{c.name}</span>
                              <span className="text-xs text-gray-400">{c.email}</span>
                            </div>
                          </button>
                        ))}
                        <div className="px-2 pb-2">
                          <button
                            onClick={() => {
                              navigate(`/clientes?q=${encodeURIComponent(searchTerm.trim())}`)
                              setSearchOpen(false)
                            }}
                            className="w-full text-xs text-green-400 hover:text-green-300 text-left px-2 py-1"
                          >
                            Ver todos los clientes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={cn("relative p-2 hover:text-white transition-colors", `text-${theme.colors.textSecondary}`)}
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className={cn("absolute top-1 right-1 h-2 w-2 rounded-full ring-2", `bg-${theme.colors.primary}`, `ring-${theme.colors.surface}`)}></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-700">
                      <h3 className="text-white font-semibold">Notificaciones</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-2 h-2 mt-2 rounded-full",
                                notification.type === 'warning' && "bg-yellow-400",
                                notification.type === 'success' && "bg-green-400",
                                notification.type === 'error' && "bg-red-400"
                              )}></div>
                              <div className="flex-1">
                                <h4 className="text-white text-sm font-medium">{notification.title}</h4>
                                <p className="text-gray-400 text-xs mt-1">{notification.message}</p>
                                <p className="text-gray-500 text-xs mt-1">Hace {notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400">
                          No hay notificaciones
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-700">
                      <button className="text-sm text-green-400 hover:text-green-300 transition-colors">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden lg:flex lg:items-center lg:gap-3">
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", `bg-${theme.colors.surface}`)}>
                  <span className={cn("text-sm font-medium", `text-${theme.colors.text}`)}>
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className={cn("font-medium", `text-${theme.colors.text}`)}>
                    {user?.user_metadata?.name || user?.email?.split('@')[0]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

    </div>
  )
}