import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook personalizado para temas consistentes en gráficos
 * Optimizado con useMemo para evitar recálculos innecesarios
 */
export const useChartTheme = () => {
  const { currentTheme, theme } = useTheme();

  // Configuración de colores para gráficos
  const chartColors = useMemo(() => {
    const colorPalettes = {
      default: {
        primary: '#10B981',
        secondary: '#3B82F6',
        accent: '#F59E0B',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#06B6D4',
        purple: '#8B5CF6',
        pink: '#EC4899',
        gray: '#6B7280'
      },
      blue: {
        primary: '#3B82F6',
        secondary: '#1D4ED8',
        accent: '#06B6D4',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#06B6D4',
        purple: '#8B5CF6',
        pink: '#EC4899',
        gray: '#6B7280'
      },
      green: {
        primary: '#10B981',
        secondary: '#059669',
        accent: '#06B6D4',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#06B6D4',
        purple: '#8B7280',
        pink: '#EC4899',
        gray: '#6B7280'
      },
      purple: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#EC4899',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#06B6D4',
        purple: '#8B5CF6',
        pink: '#EC4899',
        gray: '#6B7280'
      }
    };

    return colorPalettes[currentTheme] || colorPalettes.default;
  }, [currentTheme]);

  // Configuración de tema para TradingView Lightweight Charts
  const lightweightChartTheme = useMemo(() => {
    const isDark = theme?.colors?.background?.includes('dark') || 
                   theme?.colors?.background?.includes('#') && 
                   parseInt(theme.colors.background.replace('#', ''), 16) < 0x808080;

    return {
      layout: {
        background: { color: isDark ? '#1F2937' : '#FFFFFF' },
        textColor: isDark ? '#F9FAFB' : '#111827',
      },
      grid: {
        vertLines: { color: isDark ? '#374151' : '#E5E7EB' },
        horzLines: { color: isDark ? '#374151' : '#E5E7EB' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: isDark ? '#374151' : '#E5E7EB',
      },
      timeScale: {
        borderColor: isDark ? '#374151' : '#E5E7EB',
        timeVisible: true,
        secondsVisible: false,
      },
    };
  }, [theme]);

  // Configuración de tema para Recharts
  const rechartsTheme = useMemo(() => {
    const isDark = theme?.colors?.background?.includes('dark') || 
                   theme?.colors?.background?.includes('#') && 
                   parseInt(theme.colors.background.replace('#', ''), 16) < 0x808080;

    return {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      textColor: isDark ? '#F9FAFB' : '#111827',
      gridColor: isDark ? '#374151' : '#E5E7EB',
      axisColor: isDark ? '#9CA3AF' : '#6B7280',
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        textColor: isDark ? '#F9FAFB' : '#111827',
      }
    };
  }, [theme]);

  // Paleta de colores para series múltiples
  const seriesColors = useMemo(() => {
    const baseColors = [
      chartColors.primary,
      chartColors.secondary,
      chartColors.accent,
      chartColors.danger,
      chartColors.warning,
      chartColors.success,
      chartColors.info,
      chartColors.purple,
      chartColors.pink,
      chartColors.gray
    ];

    // Generar variaciones de cada color
    const generateColorVariations = (color, count = 3) => {
      const variations = [color];
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      for (let i = 1; i < count; i++) {
        const factor = 0.7 + (i * 0.1);
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        variations.push(`#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`);
      }
      return variations;
    };

    return baseColors.flatMap(color => generateColorVariations(color));
  }, [chartColors]);

  // Configuración de gradientes para gráficos de área
  const gradients = useMemo(() => {
    return {
      primary: {
        topColor: `${chartColors.primary}20`,
        bottomColor: `${chartColors.primary}05`,
        lineColor: chartColors.primary,
      },
      secondary: {
        topColor: `${chartColors.secondary}20`,
        bottomColor: `${chartColors.secondary}05`,
        lineColor: chartColors.secondary,
      },
      accent: {
        topColor: `${chartColors.accent}20`,
        bottomColor: `${chartColors.accent}05`,
        lineColor: chartColors.accent,
      }
    };
  }, [chartColors]);

  // Configuración de tooltips
  const tooltipConfig = useMemo(() => {
    const isDark = theme?.colors?.background?.includes('dark') || 
                   theme?.colors?.background?.includes('#') && 
                   parseInt(theme.colors.background.replace('#', ''), 16) < 0x808080;

    return {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderColor: isDark ? '#374151' : '#E5E7EB',
      textColor: isDark ? '#F9FAFB' : '#111827',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif'
    };
  }, [theme]);

  // Configuración de animaciones
  const animations = useMemo(() => {
    return {
      duration: 300,
      easing: 'ease-in-out',
      delay: 0,
      stagger: 50
    };
  }, []);

  // Función para obtener color por índice
  const getColorByIndex = useCallback((index) => {
    return seriesColors[index % seriesColors.length];
  }, [seriesColors]);

  // Función para obtener gradiente por nombre
  const getGradient = useCallback((name) => {
    return gradients[name] || gradients.primary;
  }, [gradients]);

  return {
    colors: chartColors,
    seriesColors,
    gradients,
    lightweightChartTheme,
    rechartsTheme,
    tooltipConfig,
    animations,
    getColorByIndex,
    getGradient,
    isDark: lightweightChartTheme.layout.background.color === '#1F2937'
  };
};
