import React, { useMemo, useCallback } from 'react';
import LightweightChart from './LightweightChart';

/**
 * Componente especializado para gráficos de series temporales
 * Optimizado para datos de ventas, compras y otros KPIs temporales
 */
const TimeSeriesChart = React.memo(({ 
  data = [], 
  height = 300,
  title = '',
  subtitle = '',
  showLegend = false,
  legendData = [],
  onDataHover = null,
  className = '',
  theme = 'dark'
}) => {
  // Transformar datos para TradingView
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item, index) => ({
      time: item.time || index,
      value: parseFloat(item.value || 0)
    }));
  }, [data]);

  // Handler optimizado para hover
  const handleDataHover = useCallback((hoverData) => {
    if (onDataHover) {
      onDataHover(hoverData);
    }
  }, [onDataHover]);

  // Configuración específica para series temporales
  const chartOptions = useMemo(() => ({
    handleScroll: {
      mouseWheel: true,
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
          type="area"
          height={height}
          options={chartOptions}
          onDataUpdate={handleDataHover}
          theme={theme}
          className="w-full"
        />
        
        {showLegend && legendData.length > 0 && (
          <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3">
            <div className="space-y-2">
              {legendData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-white">{item.label}</span>
                  <span className="text-gray-400">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TimeSeriesChart.displayName = 'TimeSeriesChart';

export default TimeSeriesChart;
