import React, { useEffect, useRef, useMemo, useState } from 'react';
import { createChart } from 'lightweight-charts';
import ChartFallback from './ChartFallback';

/**
 * Componente base reutilizable para gráficos TradingView Lightweight Charts
 * Optimizado para performance con React.memo y useMemo
 */
const LightweightChart = React.memo(({ 
  data = [], 
  type = 'line',
  height = 300,
  width = '100%',
  options = {},
  className = '',
  onDataUpdate = null,
  theme = 'dark',
  title = '',
  subtitle = ''
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  // Configuración del tema
  const chartOptions = useMemo(() => ({
    layout: {
      background: { color: theme === 'dark' ? '#1F2937' : '#FFFFFF' },
      textColor: theme === 'dark' ? '#F9FAFB' : '#111827',
    },
    grid: {
      vertLines: { color: theme === 'dark' ? '#374151' : '#E5E7EB' },
      horzLines: { color: theme === 'dark' ? '#374151' : '#E5E7EB' },
    },
    crosshair: {
      mode: 1,
    },
    rightPriceScale: {
      borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    },
    timeScale: {
      borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
      timeVisible: true,
      secondsVisible: false,
    },
    ...options
  }), [theme, options]);

  // Configuración de la serie según el tipo
  const seriesOptions = useMemo(() => {
    const baseOptions = {
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
    };

    switch (type) {
      case 'area':
        return {
          ...baseOptions,
          topColor: 'rgba(16, 185, 129, 0.2)',
          bottomColor: 'rgba(16, 185, 129, 0.05)',
          lineColor: '#10B981',
        };
      case 'bar':
        return {
          ...baseOptions,
          upColor: '#10B981',
          downColor: '#EF4444',
        };
      case 'histogram':
        return {
          ...baseOptions,
          color: '#3B82F6',
        };
      default: // line
        return {
          ...baseOptions,
          color: '#10B981',
        };
    }
  }, [type]);

  // Inicializar el gráfico
  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart = null;
    let series = null;

    try {
      // Crear el gráfico
      chart = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: typeof width === 'number' ? width : chartContainerRef.current.clientWidth,
        height: height,
      });

      chartRef.current = chart;

      // Verificar que el chart se creó correctamente
      if (!chart) {
        console.error('Failed to create chart');
        return;
      }

      // Crear la serie según el tipo con verificación de métodos
      switch (type) {
        case 'area':
          if (typeof chart.addAreaSeries === 'function') {
            series = chart.addAreaSeries(seriesOptions);
          } else {
            console.warn('addAreaSeries not available, falling back to line series');
            series = chart.addLineSeries(seriesOptions);
          }
          break;
        case 'bar':
          if (typeof chart.addBarSeries === 'function') {
            series = chart.addBarSeries(seriesOptions);
          } else {
            console.warn('addBarSeries not available, falling back to line series');
            series = chart.addLineSeries(seriesOptions);
          }
          break;
        case 'histogram':
          if (typeof chart.addHistogramSeries === 'function') {
            series = chart.addHistogramSeries(seriesOptions);
          } else {
            console.warn('addHistogramSeries not available, falling back to line series');
            series = chart.addLineSeries(seriesOptions);
          }
          break;
        default:
          series = chart.addLineSeries(seriesOptions);
      }

      seriesRef.current = series;

      // Configurar tooltip personalizado
      if (chart && series) {
        chart.subscribeCrosshairMove((param) => {
          if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > height) {
            return;
          }

          const data = param.seriesData.get(series);
          if (data && onDataUpdate) {
            onDataUpdate({
              time: param.time,
              value: data.value || data.close,
              point: param.point
            });
          }
        });
      }

      // Manejar resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    } catch (error) {
      console.error('Error in chart initialization:', error);
      setHasError(true);
      // Clean up on error
      if (chart) {
        try {
          chart.remove();
        } catch (cleanupError) {
          console.error('Error cleaning up chart:', cleanupError);
        }
      }
    }
  }, [chartOptions, seriesOptions, height, width, type, onDataUpdate]);

  // Actualizar datos cuando cambien
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  // Si hay error, mostrar fallback
  if (hasError) {
    return (
      <ChartFallback
        data={data}
        type={type}
        height={height}
        title={title}
        subtitle={subtitle}
        className={className}
      />
    );
  }

  return (
    <div 
      ref={chartContainerRef} 
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
    />
  );
});

LightweightChart.displayName = 'LightweightChart';

export default LightweightChart;
