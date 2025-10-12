import React, { useMemo, useCallback } from 'react';
import LightweightChart from './LightweightChart';

/**
 * Componente especializado para gráficos de barras comparativas
 * Optimizado para comparar datos entre categorías o períodos
 */
const BarChart = React.memo(({ 
  data = [], 
  height = 300,
  title = '',
  subtitle = '',
  xAxisLabel = '',
  yAxisLabel = '',
  showValues = true,
  onBarClick = null,
  className = '',
  theme = 'dark',
  colorScheme = 'default'
}) => {
  // Transformar datos para TradingView
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item, index) => ({
      time: item.label || item.name || index,
      open: parseFloat(item.value || 0),
      high: parseFloat(item.value || 0),
      low: parseFloat(item.value || 0),
      close: parseFloat(item.value || 0)
    }));
  }, [data]);

  // Configuración de colores
  const seriesOptions = useMemo(() => {
    const colorSchemes = {
      default: {
        upColor: '#10B981',
        downColor: '#EF4444',
      },
      blue: {
        upColor: '#3B82F6',
        downColor: '#1D4ED8',
      },
      purple: {
        upColor: '#8B5CF6',
        downColor: '#7C3AED',
      },
      orange: {
        upColor: '#F59E0B',
        downColor: '#D97706',
      }
    };

    return colorSchemes[colorScheme] || colorSchemes.default;
  }, [colorScheme]);

  // Handler optimizado para clicks
  const handleBarClick = useCallback((clickData) => {
    if (onBarClick) {
      onBarClick(clickData);
    }
  }, [onBarClick]);

  // Configuración específica para barras
  const chartOptions = useMemo(() => ({
    handleScroll: {
      mouseWheel: false,
      pressedMouseMove: true,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
  }), []);

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-xl font-semibold text-white mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="relative">
        <LightweightChart
          data={chartData}
          type="bar"
          height={height}
          options={chartOptions}
          theme={theme}
          className="w-full"
        />
        
        {/* Labels de ejes */}
        {(xAxisLabel || yAxisLabel) && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-4">
            {xAxisLabel && (
              <span className="text-xs text-gray-400">{xAxisLabel}</span>
            )}
            {yAxisLabel && (
              <span className="text-xs text-gray-400 transform -rotate-90 origin-left">
                {yAxisLabel}
              </span>
            )}
          </div>
        )}
        
        {/* Valores en las barras */}
        {showValues && (
          <div className="absolute top-4 left-4 space-y-1">
            {data.map((item, index) => (
              <div key={index} className="text-xs text-gray-300">
                {item.label || item.name}: {item.value}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

BarChart.displayName = 'BarChart';

export default BarChart;
