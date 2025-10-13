import React from 'react';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';

/**
 * Componente de respaldo para cuando los gráficos fallan
 * Muestra una representación visual simple de los datos
 */
const ChartFallback = React.memo(({ 
  data = [], 
  type = 'line',
  height = 300,
  title = '',
  subtitle = '',
  className = ''
}) => {
  // Procesar datos para mostrar estadísticas básicas
  const stats = React.useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(item => parseFloat(item.value || 0));
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    return { total, average, max, min, count: values.length };
  }, [data]);

  // Icono según el tipo de gráfico
  const getIcon = () => {
    switch (type) {
      case 'area':
      case 'line':
        return <TrendingUp className="h-8 w-8" />;
      case 'bar':
        return <BarChart3 className="h-8 w-8" />;
      case 'pie':
        return <PieChart className="h-8 w-8" />;
      default:
        return <TrendingUp className="h-8 w-8" />;
    }
  };

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
      
      <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <div className="text-blue-400">
              {getIcon()}
            </div>
          </div>
          
          <h4 className="text-lg font-medium text-white mb-2">
            Gráfico no disponible
          </h4>
          
          <p className="text-gray-400 mb-4">
            Los datos están disponibles pero el gráfico no se puede mostrar.
          </p>
          
          {stats && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-400">
                  {stats.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-400">
                  {stats.average.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Promedio</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.max.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Máximo</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-red-400">
                  {stats.min.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Mínimo</p>
              </div>
            </div>
          )}
          
          {data && data.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {data.length} punto{data.length !== 1 ? 's' : ''} de datos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChartFallback.displayName = 'ChartFallback';

export default ChartFallback;

