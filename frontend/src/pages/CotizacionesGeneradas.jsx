import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Download, Edit, Trash2, Eye, Plus, Calendar, DollarSign } from 'lucide-react';
import { getCotizaciones, deleteCotizacion, getCotizacionesStats } from '../services/cotizacionesService';
import { exportSectionsToPDF } from '../common';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

export default function CotizacionesGeneradas() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [cotizaciones, setCotizaciones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cotizacionesRes, statsRes] = await Promise.all([
        getCotizaciones({ busqueda, fechaDesde, fechaHasta }),
        getCotizacionesStats()
      ]);

      if (!cotizacionesRes.error) {
        setCotizaciones(cotizacionesRes.data);
      }

      if (!statsRes.error) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [busqueda, fechaDesde, fechaHasta]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
      return;
    }

    const { error } = await deleteCotizacion(id);
    if (error) {
      alert('Error al eliminar la cotización');
      return;
    }

    alert('Cotización eliminada exitosamente');
    loadData();
  };

  const handleDownloadPDF = async (cotizacion) => {
    const items = typeof cotizacion.items === 'string' 
      ? JSON.parse(cotizacion.items) 
      : cotizacion.items;

    const head = ['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal'];
    const body = items.map(it => [
      it.nombre || '-',
      String(it.cantidad || 0),
      `$ ${Number(it.precio || 0).toFixed(2)}`,
      `$ ${(Number(it.cantidad || 0) * Number(it.precio || 0)).toFixed(2)}`
    ]);

    body.push([
      { text: 'Subtotal', colSpan: 3, alignment: 'right' },
      {}, {},
      `$ ${Number(cotizacion.subtotal).toFixed(2)}`
    ]);
    body.push([
      { text: 'IVA 21%', colSpan: 3, alignment: 'right' },
      {}, {},
      `$ ${Number(cotizacion.iva).toFixed(2)}`
    ]);
    body.push([
      { text: 'TOTAL', colSpan: 3, alignment: 'right', bold: true },
      {}, {},
      { text: `$ ${Number(cotizacion.total).toFixed(2)}`, bold: true }
    ]);

    await exportSectionsToPDF({
      title: `Cotización ${cotizacion.id}`,
      sections: [
        {
          title: `Cliente: ${cotizacion.cliente_nombre || '-'}`,
          head: [],
          body: [
            [{ text: `Email: ${cotizacion.cliente_email || '-'}` }],
            [{ text: `Fecha: ${cotizacion.fecha}` }],
            [{ text: `Validez: ${cotizacion.validez_dias} días` }],
            ...(cotizacion.notas ? [[{ text: `Notas: ${cotizacion.notas}` }]] : [])
          ]
        },
        { title: 'Detalle', head, body }
      ],
      filename: `${cotizacion.id}.pdf`,
      brand: 'EVITA',
      subtitle: 'Cotización de productos'
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', `bg-${theme.colors.primaryLight}`)}>
            <FileText className={cn('h-6 w-6', `text-${theme.colors.primaryText}`)} />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
              Cotizaciones Generadas
            </h1>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              Gestiona todas tus cotizaciones
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/cotizaciones')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
          )}
        >
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Total Cotizaciones</p>
                <p className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
                  {stats.totalCotizaciones}
                </p>
              </div>
              <FileText className={cn('h-8 w-8', `text-${theme.colors.primary}`)} />
            </div>
          </div>

          <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Este Mes</p>
                <p className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
                  {stats.cotizacionesMes}
                </p>
              </div>
              <Calendar className={cn('h-8 w-8', `text-${theme.colors.primary}`)} />
            </div>
          </div>

          <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Valor Total Mes</p>
                <p className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
                  {currencyFormatter.format(stats.valorTotalMes)}
                </p>
              </div>
              <DollarSign className={cn('h-8 w-8', `text-${theme.colors.primary}`)} />
            </div>
          </div>

          <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Promedio</p>
                <p className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
                  {currencyFormatter.format(stats.promedioPorCotizacion)}
                </p>
              </div>
              <DollarSign className={cn('h-8 w-8', `text-${theme.colors.primary}`)} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Buscar
            </label>
            <div className="relative">
              <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', `text-${theme.colors.textMuted}`)} />
              <input
                type="text"
                placeholder="Buscar por ID, cliente o notas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={cn(
                  'input pl-10',
                  `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`
                )}
              />
            </div>
          </div>
          <div>
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className={cn(
                'input',
                `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`
              )}
            />
          </div>
          <div>
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className={cn(
                'input',
                `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`
              )}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={cn('rounded-lg overflow-hidden', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        {loading ? (
          <div className="p-8 text-center">
            <p className={cn('text-${theme.colors.textSecondary}')}>Cargando...</p>
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className={cn('h-12 w-12 mx-auto mb-4', `text-${theme.colors.textMuted}`)} />
            <p className={cn('text-${theme.colors.text} font-medium')}>No hay cotizaciones</p>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              Crea tu primera cotización para comenzar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn('border-b', `border-${theme.colors.border}`)}>
                <tr>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    ID
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Cliente
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Fecha
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Total
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((cotizacion) => (
                  <tr
                    key={cotizacion.id}
                    className={cn('border-b transition-colors', `border-${theme.colors.border} hover:bg-${theme.colors.background}`)}
                  >
                    <td className={cn('px-4 py-3 text-sm font-mono', `text-${theme.colors.text}`)}>
                      {cotizacion.id}
                    </td>
                    <td className={cn('px-4 py-3', `text-${theme.colors.text}`)}>
                      <div>
                        <p className="font-medium">{cotizacion.cliente_nombre}</p>
                        {cotizacion.cliente_email && (
                          <p className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
                            {cotizacion.cliente_email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className={cn('px-4 py-3 text-sm', `text-${theme.colors.text}`)}>
                      {new Date(cotizacion.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className={cn('px-4 py-3 text-sm font-semibold', `text-${theme.colors.primaryText}`)}>
                      {currencyFormatter.format(cotizacion.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadPDF(cotizacion)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-${theme.colors.primary}`
                          )}
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cotizacion.id)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-red-400`
                          )}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
