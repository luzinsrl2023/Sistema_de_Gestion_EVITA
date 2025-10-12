import React, { useEffect, useRef, useMemo } from 'react';
import { createChart } from 'lightweight-charts';

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
  theme = 'dark'
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

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

    // Crear el gráfico
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: typeof width === 'number' ? width : chartContainerRef.current.clientWidth,
      height: height,
    });

    chartRef.current = chart;

    // Crear la serie según el tipo
    let series;
    switch (type) {
      case 'area':
        series = chart.addAreaSeries(seriesOptions);
        break;
      case 'bar':
        series = chart.addBarSeries(seriesOptions);
        break;
      case 'histogram':
        series = chart.addHistogramSeries(seriesOptions);
        break;
      default:
        series = chart.addLineSeries(seriesOptions);
    }

    seriesRef.current = series;

    // Configurar tooltip personalizado
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
  }, [chartOptions, seriesOptions, height, width, type, onDataUpdate]);

  // Actualizar datos cuando cambien
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);
    }
  }, [data]);

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
