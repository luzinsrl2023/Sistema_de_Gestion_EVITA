import React, { useState } from 'react';
import { Download, FileText, Calculator } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { getBalanceSumasYSaldos } from '../../services/contabilidad';
import { exportTableToPDF } from '../../common';

export default function BalanceSumasYSaldos() {
  const { theme } = useTheme();
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);

  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  });

  const handleGenerar = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert('Debe seleccionar ambas fechas');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await getBalanceSumasYSaldos(fechaDesde, fechaHasta);
      
      if (error) throw error;
      setBalance(data);
    } catch (error) {
      console.error('Error generating balance:', error);
      alert('Error al generar el balance');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const head = ['Código', 'Cuenta', 'Debe', 'Haber', 'Saldo Deudor', 'Saldo Acreedor'];
    const body = balance.map(item => [
      item.codigo,
      item.nombre,
      currencyFormatter.format(item.debe),
      currencyFormatter.format(item.haber),
      currencyFormatter.format(item.saldo_deudor),
      currencyFormatter.format(item.saldo_acreedor)
    ]);

    // Agregar totales
    const totales = calcularTotales();
    body.push([
      { text: 'TOTALES', colSpan: 2, alignment: 'right', bold: true },
      {},
      { text: currencyFormatter.format(totales.totalDebe), bold: true },
      { text: currencyFormatter.format(totales.totalHaber), bold: true },
      { text: currencyFormatter.format(totales.totalSaldoDeudor), bold: true },
      { text: currencyFormatter.format(totales.totalSaldoAcreedor), bold: true }
    ]);

    exportTableToPDF({
      title: 'Balance de Sumas y Saldos - EVITA',
      subtitle: `Período: ${new Date(fechaDesde).toLocaleDateString('es-AR')} al ${new Date(fechaHasta).toLocaleDateString('es-AR')}`,
      head,
      body,
      filename: `balance_sumas_saldos_${fechaDesde}_${fechaHasta}.pdf`
    });
  };

  const calcularTotales = () => {
    return balance.reduce((acc, item) => ({
      totalDebe: acc.totalDebe + parseFloat(item.debe || 0),
      totalHaber: acc.totalHaber + parseFloat(item.haber || 0),
      totalSaldoDeudor: acc.totalSaldoDeudor + parseFloat(item.saldo_deudor || 0),
      totalSaldoAcreedor: acc.totalSaldoAcreedor + parseFloat(item.saldo_acreedor || 0)
    }), {
      totalDebe: 0,
      totalHaber: 0,
      totalSaldoDeudor: 0,
      totalSaldoAcreedor: 0
    });
  };

  const totales = balance.length > 0 ? calcularTotales() : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', `bg-${theme.colors.primaryLight}`)}>
            <Calculator className={cn('h-6 w-6', `text-${theme.colors.primaryText}`)} />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
              Balance de Sumas y Saldos
            </h1>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              Resumen contable según normas argentinas
            </p>
          </div>
        </div>
        {balance.length > 0 && (
          <button
            onClick={handleExportPDF}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
            )}
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className={cn('input w-full', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
            />
          </div>
          <div>
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className={cn('input w-full', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerar}
              disabled={loading}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
                `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`,
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Calculator className="h-4 w-4" />
              {loading ? 'Generando...' : 'Generar Balance'}
            </button>
          </div>
        </div>
      </div>

      {/* Balance */}
      {balance.length > 0 && (
        <div className={cn('rounded-lg overflow-hidden', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn('border-b', `border-${theme.colors.border}`)}>
                <tr>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Código
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Cuenta
                  </th>
                  <th className={cn('px-4 py-3 text-right text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Debe
                  </th>
                  <th className={cn('px-4 py-3 text-right text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Haber
                  </th>
                  <th className={cn('px-4 py-3 text-right text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Saldo Deudor
                  </th>
                  <th className={cn('px-4 py-3 text-right text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Saldo Acreedor
                  </th>
                </tr>
              </thead>
              <tbody>
                {balance.map((item, index) => (
                  <tr
                    key={index}
                    className={cn('border-b transition-colors', `border-${theme.colors.border} hover:bg-${theme.colors.background}`)}
                  >
                    <td className={cn('px-4 py-3 text-sm font-mono', `text-${theme.colors.text}`)}>
                      {item.codigo}
                    </td>
                    <td className={cn('px-4 py-3 text-sm', `text-${theme.colors.text}`)}>
                      {item.nombre}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.text}`)}>
                      {currencyFormatter.format(item.debe)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.text}`)}>
                      {currencyFormatter.format(item.haber)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.text}`)}>
                      {currencyFormatter.format(item.saldo_deudor)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.text}`)}>
                      {currencyFormatter.format(item.saldo_acreedor)}
                    </td>
                  </tr>
                ))}
                {/* Totales */}
                {totales && (
                  <tr className={cn('border-t-2 font-bold', `border-${theme.colors.border} bg-${theme.colors.background}`)}>
                    <td colSpan="2" className={cn('px-4 py-3 text-sm text-right', `text-${theme.colors.text}`)}>
                      TOTALES
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.primaryText}`)}>
                      {currencyFormatter.format(totales.totalDebe)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.primaryText}`)}>
                      {currencyFormatter.format(totales.totalHaber)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.primaryText}`)}>
                      {currencyFormatter.format(totales.totalSaldoDeudor)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-right font-mono', `text-${theme.colors.primaryText}`)}>
                      {currencyFormatter.format(totales.totalSaldoAcreedor)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {balance.length === 0 && !loading && (
        <div className={cn('p-8 text-center rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
          <FileText className={cn('h-12 w-12 mx-auto mb-4', `text-${theme.colors.textMuted}`)} />
          <p className={cn(`text-${theme.colors.text} font-medium`)}>No hay datos para mostrar</p>
          <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
            Selecciona un rango de fechas y genera el balance
          </p>
        </div>
      )}
    </div>
  );
}
