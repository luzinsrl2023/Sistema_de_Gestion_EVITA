import React, { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_LOGO_DATA_URL } from '../common/brandAssets'

const ThemeContext = createContext({})

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Professional theme configurations with beautiful backgrounds
export const themes = {
  default: {
    name: 'EVITA Clásico',
    description: 'Colores verdes corporativos, ideal para uso general',
    colors: {
      primary: 'green-500',
      primaryHover: 'green-600',
      primaryLight: 'green-500/10',
      primaryText: 'green-400',
      accent: 'green-500',
      background: 'slate-900',
      surface: 'slate-800',
      border: 'slate-700',
      text: 'white',
      textSecondary: 'slate-400',
      textMuted: 'slate-500',
      success: 'green-500',
      warning: 'yellow-500',
      error: 'red-500'
    },
    background: {
      type: 'solid',
      value: 'bg-slate-900'
    }
  },
  corporate: {
    name: 'Empresarial Profesional',
    description: 'Tonos azules y grises para un ambiente profesional',
    colors: {
      primary: 'blue-600',
      primaryHover: 'blue-700',
      primaryLight: 'blue-500/10',
      primaryText: 'blue-300',
      accent: 'indigo-600',
      background: 'slate-950',
      surface: 'slate-900/90',
      border: 'slate-700',
      text: 'white',
      textSecondary: 'slate-300',
    },
    background: {
      type: 'gradient',
      component: 'DeepOceanBackground'
    }
  },
  elegant: {
    name: 'Elegante Sofisticado',
    description: 'Paleta de rosados y morados con estilo sofisticado',
    colors: {
      primary: 'pink-600',
      primaryHover: 'pink-700',
      primaryLight: 'pink-500/10',
      primaryText: 'pink-300',
      accent: 'purple-600',
      background: 'gray-950',
      surface: 'gray-900/85',
      border: 'gray-700',
      text: 'white',
      textSecondary: 'gray-300',
    },
    background: {
      type: 'gradient',
      component: 'PinkGlowBackground'
    }
  },
  violetAbyss: {
    name: 'Abismo Violeta',
    description: 'Profundidades misteriosas con toques violetas',
    colors: {
      primary: 'violet-600',
      primaryHover: 'violet-700',
      primaryLight: 'violet-500/10',
      primaryText: 'violet-400',
      accent: 'purple-600',
      background: 'black',
      surface: 'gray-900/50',
      border: 'violet-800/30',
      text: 'white',
      textSecondary: 'violet-200',
    },
    background: {
      type: 'gradient',
      component: 'VioletAbyssBackground'
    }
  },
  gridMatrix: {
    name: 'Matrix Grid',
    description: 'Rejilla tecnológica con ambiente futurista',
    colors: {
      primary: 'emerald-600',
      primaryHover: 'emerald-700',
      primaryLight: 'emerald-500/10',
      primaryText: 'emerald-300',
      accent: 'green-500',
      background: 'black',
      surface: 'gray-900/80',
      border: 'gray-600',
      text: 'white',
      textSecondary: 'gray-300',
    },
    background: {
      type: 'pattern',
      component: 'GridMatrixBackground'
    }
  },
  diagonalFire: {
    name: 'Fuego Diagonal',
    description: 'Patrones dinámicos con energía naranja',
    colors: {
      primary: 'orange-600',
      primaryHover: 'orange-700',
      primaryLight: 'orange-500/10',
      primaryText: 'orange-400',
      accent: 'red-600',
      background: 'gray-950',
      surface: 'gray-900/50',
      border: 'orange-800/30',
      text: 'white',
      textSecondary: 'orange-200',
    },
    background: {
      type: 'pattern',
      component: 'DiagonalFireBackground'
    }
  },
  variablePattern: {
    name: 'Patrón Variable',
    description: 'Diseño geométrico con espaciado dinámico',
    colors: {
      primary: 'orange-600',
      primaryHover: 'orange-700',
      primaryLight: 'orange-500/10',
      primaryText: 'orange-400',
      accent: 'yellow-600',
      background: 'gray-950',
      surface: 'gray-900/40',
      border: 'orange-800/40',
      text: 'white',
      textSecondary: 'orange-200',
    },
    background: {
      type: 'pattern',
      component: 'VariablePatternBackground'
    }
  },
  roseTwilight: {
    name: 'Crepúsculo Rosa',
    description: 'Suave resplandor rosado desde arriba',
    colors: {
      primary: 'rose-600',
      primaryHover: 'rose-700',
      primaryLight: 'rose-500/10',
      primaryText: 'rose-400',
      accent: 'pink-600',
      background: 'black',
      surface: 'gray-900/40',
      border: 'rose-800/30',
      text: 'white',
      textSecondary: 'rose-200',
    },
    background: {
      type: 'gradient',
      component: 'RoseTwilightBackground'
    }
  },
  pinkAurora: {
    name: 'Aurora Rosa',
    description: 'Aurora boreal con tonos rosados brillantes',
    colors: {
      primary: 'pink-600',
      primaryHover: 'pink-700',
      primaryLight: 'pink-500/10',
      primaryText: 'pink-400',
      accent: 'fuchsia-600',
      background: 'black',
      surface: 'gray-900/30',
      border: 'pink-800/40',
      text: 'white',
      textSecondary: 'pink-200',
    },
    background: {
      type: 'gradient',
      component: 'PinkAuroraBackground'
    }
  },
  topSpotlight: {
    name: 'Foco Superior',
    description: 'Iluminación concentrada desde arriba',
    colors: {
      primary: 'gray-600',
      primaryHover: 'gray-700',
      primaryLight: 'gray-500/10',
      primaryText: 'gray-300',
      accent: 'white',
      background: 'black',
      surface: 'gray-900/20',
      border: 'gray-700/50',
      text: 'white',
      textSecondary: 'gray-300',
    },
    background: {
      type: 'gradient',
      component: 'TopSpotlightBackground'
    }
  },
  stellarMist: {
    name: 'Niebla Estelar',
    description: 'Múltiples nebulosas de colores vibrantes',
    colors: {
      primary: 'purple-600',
      primaryHover: 'purple-700',
      primaryLight: 'purple-500/10',
      primaryText: 'purple-400',
      accent: 'emerald-600',
      background: 'black',
      surface: 'gray-900/30',
      border: 'purple-800/40',
      text: 'white',
      textSecondary: 'purple-200',
    },
    background: {
      type: 'gradient',
      component: 'StellarMistBackground'
    }
  }
}

// Background Components
const BackgroundComponents = {
  PinkGlowBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-white z-[-1]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #ec4899 100%)`,
          backgroundSize: "100% 100%",
        }}
      />
    </div>
  ),
  VioletAbyssBackground: () => (
    <div className="fixed inset-0 w-full h-full z-[-1]">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #2b092b 100%)",
        }}
      />
    </div>
  ),
  GridMatrixBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-black z-[-1]">
      <div
        className="absolute inset-0"
        style={{
          background: "#000000",
          backgroundImage: `linear-gradient(to right, rgba(75, 85, 99, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(75, 85, 99, 0.4) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  ),
  DiagonalFireBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-[#0f0f0f] text-white z-[-1]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, rgba(255, 140, 0, 0.12) 0, rgba(255, 140, 0, 0.12) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(-45deg, rgba(255, 69, 0, 0.08) 0, rgba(255, 69, 0, 0.08) 1px, transparent 1px, transparent 22px)`,
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  ),
  VariablePatternBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-[#0f0f0f] text-white z-[-1]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(30deg, rgba(255, 100, 0, 0.1) 0, rgba(255, 100, 0, 0.1) 1px, transparent 1px, transparent 10px, rgba(255, 100, 0, 0.15) 11px, rgba(255, 100, 0, 0.15) 12px, transparent 12px, transparent 40px)`,
        }}
      />
    </div>
  ),
  RoseTwilightBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-black z-[-1]">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244, 114, 182, 0.25), transparent 70%), #000000",
        }}
      />
    </div>
  ),
  PinkAuroraBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden z-[-1]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top, rgba(255, 255, 255, 0.08) 0%, rgba(255, 140, 250, 0.08) 20%, rgba(0, 0, 0, 0.0) 60%)`,
        }}
      />
    </div>
  ),
  DeepOceanBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-black z-[-1]">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(70% 55% at 50% 50%, #2a5d77 0%, #184058 18%, #0f2a43 34%, #0a1b30 50%, #071226 66%, #040d1c 80%, #020814 92%, #01040d 97%, #000309 100%), radial-gradient(160% 130% at 10% 10%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%), radial-gradient(160% 130% at 90% 90%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%)"
        }}
      />
    </div>
  ),
  TopSpotlightBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden z-[-1]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 20%, rgba(0, 0, 0, 0.0) 60%)`,
        }}
      />
    </div>
  ),
  StellarMistBackground: () => (
    <div className="fixed inset-0 w-full h-full bg-black z-[-1]">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 140% 50% at 15% 60%, rgba(124, 58, 237, 0.11), transparent 48%), radial-gradient(ellipse 90% 80% at 85% 25%, rgba(245, 101, 101, 0.09), transparent 58%), radial-gradient(ellipse 120% 65% at 40% 90%, rgba(34, 197, 94, 0.13), transparent 52%), radial-gradient(ellipse 100% 45% at 70% 5%, rgba(251, 191, 36, 0.07), transparent 42%), radial-gradient(ellipse 80% 75% at 90% 80%, rgba(168, 85, 247, 0.10), transparent 55%), #000000`,
        }}
      />
    </div>
  )
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default')
  const [theme, setTheme] = useState(themes.default)
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_DATA_URL)
  const [isCustomLogo, setIsCustomLogo] = useState(false)

  // Function to validate image URL
  const validateImageUrl = (url) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(false);
        return;
      }
      
      // Check if it's a blob URL (which becomes invalid after reload)
      if (url.startsWith('blob:')) {
        resolve(false);
        return;
      }
      
      // For data URLs, they should be valid
      if (url.startsWith('data:')) {
        resolve(true);
        return;
      }
      
      // For regular URLs, try to check if it's accessible
      // We'll just return true for now as we can't easily validate remote URLs without loading them
      resolve(true);
    });
  };

  useEffect(() => {
    const initializeTheme = async () => {
      // Load theme from localStorage
      const savedTheme = localStorage.getItem('evita-theme')
      if (savedTheme && themes[savedTheme]) {
        setCurrentTheme(savedTheme)
        setTheme(themes[savedTheme])
      }
      
      // Try to load logo from localStorage first
      let savedLogo = localStorage.getItem('evita-logo')
      let isValid = savedLogo ? await validateImageUrl(savedLogo) : false;
      
      if (isValid && savedLogo) {
        setLogoUrl(savedLogo)
        setIsCustomLogo(savedLogo !== DEFAULT_LOGO_DATA_URL)
      } else {
        // If localStorage logo is invalid, try to load from database
        try {
          const { getCompanyConfig } = await import('../services/companyService');
          const companyConfig = await getCompanyConfig();
          
          if (companyConfig?.logo_url) {
            // Update localStorage with the valid URL from database
            localStorage.setItem('evita-logo', companyConfig.logo_url);
            setLogoUrl(companyConfig.logo_url)
            setIsCustomLogo(companyConfig.logo_url !== DEFAULT_LOGO_DATA_URL)
          } else {
            setLogoUrl(DEFAULT_LOGO_DATA_URL)
            setIsCustomLogo(false)
          }
        } catch (error) {
          console.error('Error loading company config:', error);
          setLogoUrl(DEFAULT_LOGO_DATA_URL)
          setIsCustomLogo(false)
        }
      }
    };
    
    initializeTheme();
  }, [])

  const setAppLogo = async (url, path) => {
    if (url) {
      localStorage.setItem('evita-logo', url)
      if (path) {
        localStorage.setItem('evita-logo-path', path)
      } else {
        localStorage.removeItem('evita-logo-path')
      }
      setLogoUrl(url)
      setIsCustomLogo(url !== DEFAULT_LOGO_DATA_URL)
      
      // Also update in the company config database
      try {
        const { upsertCompanyConfig } = await import('../services/companyService');
        await upsertCompanyConfig({ logo_url: url, logo_path: path || null });
      } catch (error) {
        console.error('Error updating company config with logo:', error);
      }
    } else {
      localStorage.removeItem('evita-logo')
      localStorage.removeItem('evita-logo-path')
      setLogoUrl(DEFAULT_LOGO_DATA_URL)
      setIsCustomLogo(false)
      
      // Also update in the company config database
      try {
        const { upsertCompanyConfig } = await import('../services/companyService');
        await upsertCompanyConfig({ logo_url: null, logo_path: null });
      } catch (error) {
        console.error('Error updating company config to remove logo:', error);
      }
    }
  }

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName)
      setTheme(themes[themeName])
      localStorage.setItem('evita-theme', themeName)
      
      // Update CSS custom properties
      updateCSSProperties(themes[themeName])
    }
  }

  const updateCSSProperties = (theme) => {
    const root = document.documentElement
    
    // Update CSS custom properties for dynamic theming
    root.style.setProperty('--primary-50', `rgb(var(--${theme.colors.primary.split('-')[0]}-50))`)
    root.style.setProperty('--primary-100', `rgb(var(--${theme.colors.primary.split('-')[0]}-100))`)
    root.style.setProperty('--primary-200', `rgb(var(--${theme.colors.primary.split('-')[0]}-200))`)
    root.style.setProperty('--primary-300', `rgb(var(--${theme.colors.primary.split('-')[0]}-300))`)
    root.style.setProperty('--primary-400', `rgb(var(--${theme.colors.primary.split('-')[0]}-400))`)
    root.style.setProperty('--primary-500', `rgb(var(--${theme.colors.primary.split('-')[0]}-500))`)
    root.style.setProperty('--primary-600', `rgb(var(--${theme.colors.primary.split('-')[0]}-600))`)
    root.style.setProperty('--primary-700', `rgb(var(--${theme.colors.primary.split('-')[0]}-700))`)
    root.style.setProperty('--primary-800', `rgb(var(--${theme.colors.primary.split('-')[0]}-800))`)
    root.style.setProperty('--primary-900', `rgb(var(--${theme.colors.primary.split('-')[0]}-900))`)
  }

  const getThemeClasses = () => {
    return {
      primary: `bg-${theme.colors.primary} hover:bg-${theme.colors.primaryHover}`,
      primaryLight: `bg-${theme.colors.primaryLight} text-${theme.colors.primaryText}`,
      background: `bg-${theme.colors.background}`,
      surface: `bg-${theme.colors.surface}`,
      border: `border-${theme.colors.border}`,
      text: `text-${theme.colors.text}`,
      textSecondary: `text-${theme.colors.textSecondary}`,
    }
  }

  const renderBackground = () => {
    if (theme.background?.type === 'solid') {
      return null // Use regular CSS classes
    }
    
    const BackgroundComponent = BackgroundComponents[theme.background?.component]
    return BackgroundComponent ? <BackgroundComponent /> : null
  }

  const value = {
    currentTheme,
    theme,
    themes,
    changeTheme,
    getThemeClasses,
    renderBackground,
    logoUrl,
    isCustomLogo,
    setAppLogo,
  }

  return (
    <ThemeContext.Provider value={value}>
      {theme.background?.type !== 'solid' && renderBackground()}
      <div className={theme.background?.type === 'solid' ? theme.background.value : 'relative'}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}