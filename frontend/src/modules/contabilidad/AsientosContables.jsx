import React, { useState, useEffect } from 'react';
import { Plus, Save, Check, X, Trash2, Calculator, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import {
  getAsientos,
  getAsientoById,
  createAsiento,
  updateAsiento,
  deleteAsiento,
  getCuentasImputables,
  createMovimiento,
  updateMovimiento,
  deleteMovimiento,
  confirmarAsiento
} from '../../services/contabilidad';

export default function AsientosContables() {
  const { theme } = useTheme();
  const [asientos, setAsientos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsiento, setEditingAsiento] = useState(null);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Formulario de asiento
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    tipo: 'Diario',
    movimientos: [
      { cuenta_id: '', debe: 0, haber: 0, descripcion: '' },
      { cuenta_id: '', debe: 0, haber: 0, descripcion: '' }
    ]
  });

  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    loadData();
  }, [filtroEstado, fechaDesde, fechaHasta]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asientosRes, cuentasRes] = await Promise.all([
        getAsientos({ estado: filtroEstado, fechaDesde, fechaHasta }),
        getCuentasImputables()
      ]);

      if (!asientosRes.error) setAsientos(asientosRes.data);
      if (!cuentasRes.error) setCuentas(cuentasRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoAsiento = () => {
    setEditingAsiento(null);
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      tipo: 'Diario',
      movimientos: [
        { cuenta_id: '', debe: 0, haber: 0, descripcion: '' },
        { cuenta_id: '', debe: 0, haber: 0, descripcion: '' }
      ]
    });
    setShowModal(true);
  };

  const handleEditAsiento = async (asiento) => {
    const { data } = await getAsientoById(asiento.id);
    if (data) {
      setEditingAsiento(data);
      setFormData({
        fecha: data.fecha,
        descripcion: data.descripcion,
        tipo: data.tipo,
        movimientos: data.movimientos.map(m => ({
          id: m.id,
          cuenta_id: m.cuenta_id,
          debe: m.debe,
          haber: m.haber,
          descripcion: m.descripcion || ''
        }))
      });
      setShowModal(true);
    }
  };

  const handleAgregarMovimiento = () => {
    setFormData({
      ...formData,
      movimientos: [
        ...formData.movimientos,
        { cuenta_id: '', debe: 0, haber: 0, descripcion: '' }
      ]
    });
  };

  const handleEliminarMovimiento = (index) => {
    if (formData.movimientos.length <= 2) {
      alert('Debe haber al menos 2 movimientos');
      return;
    }
    const newMovimientos = formData.movimientos.filter((_, i) => i !== index);
    setFormData({ ...formData, movimientos: newMovimientos });
  };

  const handleMovimientoChange = (index, field, value) => {
    const newMovimientos = [...formData.movimientos];
    newMovimientos[index][field] = value;
    setFormData({ ...formData, movimientos: newMovimientos });
  };

  const calcularTotales = () => {
    const totalDebe = formData.movimientos.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0);
    const totalHaber = formData.movimientos.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0);
    return { totalDebe, totalHaber, diferencia: totalDebe - totalHaber };
  };

  const handleGuardar = async () => {
    const { totalDebe, totalHaber } = calcularTotales();
    
    if (totalDebe !== totalHaber) {
      alert('El asiento no está balanceado. Debe = Haber');
      return;
    }

    if (!formData.descripcion) {
      alert('Debe ingresar una descripción');
      return;
    }

    try {
      let asientoId;

      if (editingAsiento) {
        // Actualizar asiento existente
        await updateAsiento(editingAsiento.id, {
          fecha: formData.fecha,
          descripcion: formData.descripcion,
          tipo: formData.tipo
        });
        asientoId = editingAsiento.id;

        // Eliminar movimientos antiguos
        for (const mov of editingAsiento.movimientos) {
          await deleteMovimiento(mov.id);
        }
      } else {
        // Crear nuevo asiento
        const { data, error } = await createAsiento({
          fecha: formData.fecha,
          descripcion: formData.descripcion,
          tipo: formData.tipo
        });

        if (error) throw error;
        asientoId = data.id;
      }

      // Crear movimientos
      for (const mov of formData.movimientos) {
        if (mov.cuenta_id && (mov.debe > 0 || mov.haber > 0)) {
          await createMovimiento({
            asiento_id: asientoId,
            cuenta_id: mov.cuenta_id,
            debe: parseFloat(mov.debe || 0),
            haber: parseFloat(mov.haber || 0),
            descripcion: mov.descripcion
          });
        }
      }

      alert('Asiento guardado exitosamente');
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving asiento:', error);
      alert('Error al guardar el asiento');
    }
  };

  const handleConfirmar = async (asientoId) => {
    if (!confirm('¿Está seguro de confirmar este asiento? No podrá modificarlo después.')) {
      return;
    }

    const { data, error } = await confirmarAsiento(asientoId);
    
    if (error || !data?.success) {
      alert(data?.error || 'Error al confirmar el asiento');
      return;
    }

    alert('Asiento confirmado exitosamente');
    loadData();
  };

  const handleEliminar = async (asientoId) => {
    if (!confirm('¿Está seguro de eliminar este asiento?')) {
      return;
    }

    const { error } = await deleteAsiento(asientoId);
    
    if (error) {
      alert('Error al eliminar el asiento');
      return;
    }

    alert('Asiento eliminado exitosamente');
    loadData();
  };

  const totales = calcularTotales();

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
              Asientos Contables
            </h1>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              Registra y gestiona los asientos del libro diario
            </p>
          </div>
        </div>
        <button
          onClick={handleNuevoAsiento}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
          )}
        >
          <Plus className="h-4 w-4" />
          Nuevo Asiento
        </button>
      </div>

      {/* Filtros */}
      <div className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={cn('input w-full', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
            >
              <option value="">Todos</option>
              <option value="Borrador">Borrador</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
          <div>
            <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
              Desde
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
              Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className={cn('input w-full', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Asientos */}
      <div className={cn('rounded-lg overflow-hidden', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        {loading ? (
          <div className="p-8 text-center">
            <p className={cn(`text-${theme.colors.textSecondary}`)}>Cargando...</p>
          </div>
        ) : asientos.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className={cn('h-12 w-12 mx-auto mb-4', `text-${theme.colors.textMuted}`)} />
            <p className={cn(`text-${theme.colors.text} font-medium`)}>No hay asientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn('border-b', `border-${theme.colors.border}`)}>
                <tr>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Número
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Fecha
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Descripción
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Tipo
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Estado
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {asientos.map((asiento) => (
                  <tr
                    key={asiento.id}
                    className={cn('border-b transition-colors', `border-${theme.colors.border} hover:bg-${theme.colors.background}`)}
                  >
                    <td className={cn('px-4 py-3 text-sm font-mono', `text-${theme.colors.text}`)}>
                      #{asiento.numero}
                    </td>
                    <td className={cn('px-4 py-3 text-sm', `text-${theme.colors.text}`)}>
                      {new Date(asiento.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className={cn('px-4 py-3 text-sm', `text-${theme.colors.text}`)}>
                      {asiento.descripcion}
                    </td>
                    <td className={cn('px-4 py-3 text-sm', `text-${theme.colors.text}`)}>
                      {asiento.tipo}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        asiento.estado === 'Confirmado' ? 'bg-green-500/10 text-green-400' :
                        asiento.estado === 'Anulado' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      )}>
                        {asiento.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {asiento.estado === 'Borrador' && (
                          <>
                            <button
                              onClick={() => handleEditAsiento(asiento)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-${theme.colors.primary}`
                              )}
                              title="Editar"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleConfirmar(asiento.id)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-green-400`
                              )}
                              title="Confirmar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(asiento.id)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-red-400`
                              )}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Asiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={cn('rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn('text-xl font-bold', `text-${theme.colors.text}`)}>
                {editingAsiento ? 'Editar Asiento' : 'Nuevo Asiento'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={cn('p-2 rounded-lg transition-colors', `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary}`)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Datos del Asiento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className={cn('input w-full', `bg-${theme.colors.background} border-${theme.colors.border} text-${theme.colors.text}`)}
                  />
                </div>
                <div>
                  <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className={cn('input w-full', `bg-${theme.colors.background} border-${theme.colors.border} text-${theme.colors.text}`)}
                  >
                    <option value="Apertura">Apertura</option>
                    <option value="Diario">Diario</option>
                    <option value="Ajuste">Ajuste</option>
                    <option value="Cierre">Cierre</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className={cn('text-sm mb-1 block', `text-${theme.colors.textSecondary}`)}>
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del asiento"
                    className={cn('input w-full', `bg-${theme.colors.background} border-${theme.colors.border} text-${theme.colors.text}`)}
                  />
                </div>
              </div>

              {/* Movimientos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn('text-sm font-semibold', `text-${theme.colors.text}`)}>
                    Movimientos
                  </label>
                  <button
                    onClick={handleAgregarMovimiento}
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors',
                      `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    Agregar
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.movimientos.map((mov, index) => (
                    <div key={index} className={cn('p-3 rounded-lg grid grid-cols-12 gap-2', `bg-${theme.colors.background}`)}>
                      <div className="col-span-5">
                        <select
                          value={mov.cuenta_id}
                          onChange={(e) => handleMovimientoChange(index, 'cuenta_id', e.target.value)}
                          className={cn('input w-full text-sm', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                        >
                          <option value="">Seleccionar cuenta</option>
                          {cuentas.map((cuenta) => (
                            <option key={cuenta.id} value={cuenta.id}>
                              {cuenta.codigo} - {cuenta.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          value={mov.debe}
                          onChange={(e) => handleMovimientoChange(index, 'debe', e.target.value)}
                          placeholder="Debe"
                          className={cn('input w-full text-sm', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          value={mov.haber}
                          onChange={(e) => handleMovimientoChange(index, 'haber', e.target.value)}
                          placeholder="Haber"
                          className={cn('input w-full text-sm', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={mov.descripcion}
                          onChange={(e) => handleMovimientoChange(index, 'descripcion', e.target.value)}
                          placeholder="Detalle"
                          className={cn('input w-full text-sm', `bg-${theme.colors.surface} border-${theme.colors.border} text-${theme.colors.text}`)}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          onClick={() => handleEliminarMovimiento(index)}
                          className={cn('p-2 rounded-lg transition-colors', `hover:bg-${theme.colors.surface} text-red-400`)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className={cn('p-4 rounded-lg', `bg-${theme.colors.background}`)}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Total Debe</p>
                    <p className={cn('text-lg font-bold', `text-${theme.colors.text}`)}>
                      {currencyFormatter.format(totales.totalDebe)}
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Total Haber</p>
                    <p className={cn('text-lg font-bold', `text-${theme.colors.text}`)}>
                      {currencyFormatter.format(totales.totalHaber)}
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Diferencia</p>
                    <p className={cn(
                      'text-lg font-bold',
                      totales.diferencia === 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {currencyFormatter.format(Math.abs(totales.diferencia))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors',
                    `bg-${theme.colors.background} text-${theme.colors.text} hover:bg-${theme.colors.border}`
                  )}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
                  )}
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
