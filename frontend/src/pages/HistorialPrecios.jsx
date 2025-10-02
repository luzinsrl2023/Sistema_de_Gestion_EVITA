import React, { useState, useEffect } from 'react';
import { History, TrendingUp, TrendingDown, Calendar, User, Building2, Package } from 'lucide-react';
import { getHistorialPrecios } from '../services/productos';
import { getProveedores } from '../services/proveedores';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

export default function HistorialPrecios() {
  const { theme } = useTheme();
  const [historial, setHistorial] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState('');

  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [historialRes, proveedoresRes] = await Promise.all([
        getHistorialPrecios(filtroProveedor || null),
        getProveedores()
      ]);

      if (!historialRes.error) {
        setHistorial(historialRes.data);
      }

      if (!proveedoresRes.error) {
        setProveedores(proveedoresRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtroProveedor]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', `bg-${theme.colors.primaryLight}`)}>
            <History className={cn('h-6 w-6', `text-${theme.colors.primaryText}`)} />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
              Historial de Cambios de Precios
            </h1>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              Registro completo de actualizaciones de precios por proveedor
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Filtrar por Proveedor
            </label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className={cn(
                'input w-full',
                `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`
              )}
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className={cn('rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        {loading ? (
          <div className="p-8 text-center">
            <p className={cn(`text-${theme.colors.textSecondary}`)}>Cargando historial...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="p-8 text-center">
            <History className={cn('h-12 w-12 mx-auto mb-4', `text-${theme.colors.textMuted}`)} />
            <p className={cn(`text-${theme.colors.text} font-medium`)}>No hay cambios registrados</p>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              Los cambios de precios aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {historial.map((item, index) => {
                const isPositive = item.porcentaje_cambio > 0;
                const Icon = isPositive ? TrendingUp : TrendingDown;
                const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
                const bgClass = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'relative pl-8 pb-8',
                      index === historial.length - 1 ? 'pb-0' : ''
                    )}
                  >
                    {/* Timeline line */}
                    {index !== historial.length - 1 && (
                      <div className={cn(
                        'absolute left-3 top-8 bottom-0 w-px',
                        `bg-${theme.colors.border}`
                      )} />
                    )}

                    {/* Timeline dot */}
                    <div className={cn(
                      'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center',
                      bgClass
                    )}>
                      <Icon className={cn('h-3 w-3', colorClass)} />
                    </div>

                    {/* Content */}
                    <div className={cn(
                      'rounded-lg p-4 border',
                      `bg-${theme.colors.background} border-${theme.colors.border}`
                    )}>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <div className={cn('p-2 rounded-lg', bgClass)}>
                              <Building2 className={cn('h-5 w-5', colorClass)} />
                            </div>
                            <div className="flex-1">
                              <h3 className={cn('font-semibold text-lg', `text-${theme.colors.text}`)}>
                                {item.proveedor_nombre}
                              </h3>
                              <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
                                Cambio de precios: {isPositive ? '+' : ''}{item.porcentaje_cambio}%
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className={cn('text-xs', `text-${theme.colors.textMuted}`)}>
                                Productos Afectados
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Package className={cn('h-4 w-4', `text-${theme.colors.primary}`)} />
                                <p className={cn('font-semibold', `text-${theme.colors.text}`)}>
                                  {item.productos_afectados}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className={cn('text-xs', `text-${theme.colors.textMuted}`)}>
                                Precio Anterior (Prom.)
                              </p>
                              <p className={cn('font-semibold mt-1', `text-${theme.colors.text}`)}>
                                {currencyFormatter.format(item.valor_anterior_promedio || 0)}
                              </p>
                            </div>

                            <div>
                              <p className={cn('text-xs', `text-${theme.colors.textMuted}`)}>
                                Precio Nuevo (Prom.)
                              </p>
                              <p className={cn('font-semibold mt-1', colorClass)}>
                                {currencyFormatter.format(item.valor_nuevo_promedio || 0)}
                              </p>
                            </div>

                            <div>
                              <p className={cn('text-xs', `text-${theme.colors.textMuted}`)}>
                                Diferencia
                              </p>
                              <p className={cn('font-semibold mt-1', colorClass)}>
                                {currencyFormatter.format((item.valor_nuevo_promedio || 0) - (item.valor_anterior_promedio || 0))}
                              </p>
                            </div>
                          </div>

                          {/* User and Date */}
                          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-700/50">
                            {item.user_email && (
                              <div className="flex items-center gap-2">
                                <User className={cn('h-4 w-4', `text-${theme.colors.textMuted}`)} />
                                <span className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
                                  {item.user_email}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className={cn('h-4 w-4', `text-${theme.colors.textMuted}`)} />
                              <span className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
                                {new Date(item.created_at).toLocaleString('es-AR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
