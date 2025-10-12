import React, { useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * Componente especializado para gráficos de torta/pie
 * Mantiene Recharts para mejor compatibilidad con datos categóricos
 * Optimizado con React.memo y useMemo
 */
const PieChartComponent = React.memo(({ 
  data = [], 
  height = 300,
  title = '',
  subtitle = '',
  showLegend = true,
  showTooltip = true,
  onSliceClick = null,
  className = '',
  colorScheme = 'default',
  innerRadius = 0,
  outerRadius = 80
}) => {
  // Configuración de colores
  const colors = useMemo(() => {
    const colorSchemes = {
      default: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
      blue: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A', '#312E81', '#4C1D95'],
      green: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#022C22'],
      purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#3B0764'],
      orange: ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F', '#451A03']
    };

    return colorSchemes[colorScheme] || colorSchemes.default;
  }, [colorScheme]);

  // Datos procesados con colores
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  }, [data, colors]);

  // Handler optimizado para clicks
  const handleSliceClick = useCallback((data) => {
    if (onSliceClick) {
      onSliceClick(data);
    }
  }, [onSliceClick]);

  // Tooltip personalizado
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-gray-300">
            Valor: {data.value}
          </p>
          <p className="text-gray-400">
            Porcentaje: {data.payload.percent ? (data.payload.percent * 100).toFixed(1) : 0}%
          </p>
        </div>
      );
    }
    return null;
  }, []);

  // Leyenda personalizada
  const CustomLegend = useCallback(({ payload }) => {
    if (!showLegend || !payload) return null;
    
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }, [showLegend]);

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
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              onClick={handleSliceClick}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend content={<CustomLegend />} />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

PieChartComponent.displayName = 'PieChartComponent';

export default PieChartComponent;
