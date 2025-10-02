// =============================================
// COMPONENTE: PaginaProspectos.jsx
// Descripción: Página principal de gestión de prospectos - Versión Mejorada
// =============================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  FileText,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import {
  obtenerProspectos,
  eliminarProspecto,
  obtenerEstadisticasProspectos,
  obtenerProspectosProximosAVencer
} from '../services/prospectosService';
import FormularioProspecto from '../components/prospectos/FormularioProspecto';

// Configuración de colores para estados con mejor accesibilidad
const estadoColores = {
  'Nuevo': { bg: 'bg-blue-500', text: 'text-blue-500', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  'Contactado': { bg: 'bg-orange-500', text: 'text-orange-500', bgLight: 'bg-orange-50', border: 'border-orange-200' },
  'En_seguimiento': { bg: 'bg-yellow-500', text: 'text-yellow-500', bgLight: 'bg-yellow-50', border: 'border-yellow-200' },
  'Calificado': { bg: 'bg-green-500', text: 'text-green-500', bgLight: 'bg-green-50', border: 'border-green-200' },
  'Propuesta_enviada': { bg: 'bg-purple-500', text: 'text-purple-500', bgLight: 'bg-purple-50', border: 'border-purple-200' },
  'En_negociacion': { bg: 'bg-red-500', text: 'text-red-500', bgLight: 'bg-red-50', border: 'border-red-200' },
  'Convertido': { bg: 'bg-emerald-500', text: 'text-emerald-500', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  'Perdido': { bg: 'bg-gray-500', text: 'text-gray-500', bgLight: 'bg-gray-50', border: 'border-gray-200' },
  'No_calificado': { bg: 'bg-slate-500', text: 'text-slate-500', bgLight: 'bg-slate-50', border: 'border-slate-200' }
};

// Configuración de colores para prioridades
const prioridadColores = {
  'Baja': { bg: 'bg-green-500', text: 'text-green-500', bgLight: 'bg-green-50', border: 'border-green-200' },
  'Media': { bg: 'bg-yellow-500', text: 'text-yellow-500', bgLight: 'bg-yellow-50', border: 'border-yellow-200' },
  'Alta': { bg: 'bg-red-500', text: 'text-red-500', bgLight: 'bg-red-50', border: 'border-red-200' },
  'Urgente': { bg: 'bg-red-600', text: 'text-red-600', bgLight: 'bg-red-50', border: 'border-red-300' }
};

const PaginaProspectos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Verificar si el usuario es test@example.com
  const isTestUser = user?.email === 'test@example.com';

  // Estados del componente
  const [prospectos, setProspectos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [prospectosProximosVencer, setProspectosProximosVencer] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtrado y paginación mejorados
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('created_at');
  const [ordenAscendente, setOrdenAscendente] = useState(false);
  const [totalProspectos, setTotalProspectos] = useState(0);

  // Estados del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [prospectoEditar, setProspectoEditar] = useState(null);

  // Estados de feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Estados adicionales para funcionalidades avanzadas
  const [vistaDetallada, setVistaDetallada] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [notas, setNotas] = useState('');
  const [documentos, setDocumentos] = useState([]);
  const [recordatorios, setRecordatorios] = useState([]);
  const [estadisticasAvanzadas, setEstadisticasAvanzadas] = useState(null);

  // Obtener responsables únicos para el filtro
  const responsablesUnicos = useMemo(() => {
    const responsables = prospectos
      .map(p => p.responsable)
      .filter((r, index, arr) => r && arr.indexOf(r) === index);
    return responsables;
  }, [prospectos]);

  // Función mejorada para formatear usuarios
  const safeParse = (value) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  };

  const formatUserDisplay = (user) => {
    if (!user) return 'Sin asignar';
    const value = typeof user === 'string' ? safeParse(user) : user;
    return value?.full_name || value?.nombre || value?.email || value?.id || 'Usuario desconocido';
  };

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Cargar datos iniciales mejorado
  const cargarDatos = useCallback(async () => {
    // No cargar datos si es usuario de prueba
    if (isTestUser) {
      setCargando(false);
      setCargandoEstadisticas(false);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const [resultadoProspectos, resultadoEstadisticas, resultadoProximos] = await Promise.all([
        obtenerProspectos({
          busqueda,
          estado: filtroEstado,
          prioridad: filtroPrioridad,
          responsable: filtroResponsable,
          ordenarPor,
          ordenAscendente,
          pagina: pagina + 1,
          limite: filasPorPagina
        }),
        obtenerEstadisticasProspectos(),
        obtenerProspectosProximosAVencer(7)
      ]);

      if (resultadoProspectos.error) throw resultadoProspectos.error;
      if (resultadoEstadisticas.error) throw resultadoEstadisticas.error;
      if (resultadoProximos.error) throw resultadoProximos.error;

      setProspectos(resultadoProspectos.data || []);
      setTotalProspectos(resultadoProspectos.count || 0);
      setEstadisticas(resultadoEstadisticas.data);
      setProspectosProximosVencer(resultadoProximos.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setCargando(false);
      setCargandoEstadisticas(false);
    }
  }, [busqueda, filtroEstado, filtroPrioridad, filtroResponsable, ordenarPor, ordenAscendente, pagina, filasPorPagina, isTestUser]);

  // Datos de ejemplo para funcionalidades avanzadas
  useEffect(() => {
    // Datos de ejemplo para estadísticas avanzadas
    setEstadisticasAvanzadas({
      tasaConversion: 24.5,
      valorPromedio: '$1,250,000',
      tiempoPromedio: 45
    });

    // Datos de ejemplo para actividades
    setActividades([
      {
        tipo: 'llamada',
        descripcion: 'Llamada de seguimiento con Juan Pérez',
        usuario: 'María González',
        fecha: new Date(Date.now() - 1000 * 60 * 30) // 30 minutos atrás
      },
      {
        tipo: 'email',
        descripcion: 'Envío de propuesta comercial',
        usuario: 'Carlos Rodríguez',
        fecha: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 horas atrás
      },
      {
        tipo: 'reunion',
        descripcion: 'Reunión de presentación',
        usuario: 'Ana López',
        fecha: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 día atrás
      },
      {
        tipo: 'llamada',
        descripcion: 'Contacto inicial con empresa ABC',
        usuario: 'María González',
        fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 días atrás
      },
      {
        tipo: 'email',
        descripcion: 'Seguimiento de cotización',
        usuario: 'Carlos Rodríguez',
        fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 días atrás
      }
    ]);

    // Datos de ejemplo para documentos
    setDocumentos([
      {
        nombre: 'propuesta_comercial_empresa_ABC.pdf',
        tamaño: '2.4 MB',
        fecha: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        nombre: 'presentacion_corporativa.pdf',
        tamaño: '1.8 MB',
        fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      },
      {
        nombre: 'contrato_modelo.docx',
        tamaño: '856 KB',
        fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
      }
    ]);

    // Datos de ejemplo para recordatorios
    setRecordatorios([
      {
        titulo: 'Llamar a Juan Pérez',
        fecha: 'Mañana 10:00',
        prospecto: 'Juan Pérez - Empresa ABC'
      },
      {
        titulo: 'Enviar cotización pendiente',
        fecha: 'Hoy 16:00',
        prospecto: 'María García - Empresa XYZ'
      },
      {
        titulo: 'Reunión de seguimiento',
        fecha: 'Viernes 14:30',
        prospecto: 'Carlos López - Empresa DEF'
      }
    ]);
  }, []);

  // Manejadores de eventos mejorados
  const handleCambioPagina = (event, nuevaPagina) => {
    setPagina(nuevaPagina);
  };

  const handleCambioFilasPorPagina = (event) => {
    setFilasPorPagina(parseInt(event.target.value, 10));
    setPagina(0);
  };

  const handleBusqueda = (event) => {
    setBusqueda(event.target.value);
    setPagina(0);
  };

  const handleFiltroEstado = (event) => {
    setFiltroEstado(event.target.value);
    setPagina(0);
  };

  const handleFiltroPrioridad = (event) => {
    setFiltroPrioridad(event.target.value);
    setPagina(0);
  };

  const handleFiltroResponsable = (event) => {
    setFiltroResponsable(event.target.value);
    setPagina(0);
  };

  const handleOrdenar = (campo) => {
    if (ordenarPor === campo) {
      setOrdenAscendente(!ordenAscendente);
    } else {
      setOrdenarPor(campo);
      setOrdenAscendente(false);
    }
    setPagina(0);
  };

  const handleNuevoProspecto = () => {
    setProspectoEditar(null);
    setModalAbierto(true);
  };

  const handleEditarProspecto = (prospecto) => {
    setProspectoEditar(prospecto);
    setModalAbierto(true);
  };

  const handleEliminarProspecto = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar este prospecto?')) return;

    try {
      const { error } = await eliminarProspecto(id);
      if (error) throw error;

      setSnackbarMessage('Prospecto eliminado exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      await cargarDatos();
    } catch (err) {
      console.error('Error al eliminar prospecto:', err);
      setSnackbarMessage(err.message || 'Error al eliminar el prospecto');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleGuardarProspecto = async () => {
    setModalAbierto(false);
    setProspectoEditar(null);
    setSnackbarMessage('Prospecto guardado exitosamente');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    await cargarDatos();
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setProspectoEditar(null);
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFiltroResponsable('');
    setPagina(0);
  };

  const handleAgregarActividad = async (prospectoId, actividad) => {
    try {
      // Aquí se agregaría la actividad al prospecto
      setSnackbarMessage('Actividad agregada exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('Error al agregar actividad');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleAgregarNota = async (prospectoId) => {
    try {
      // Aquí se agregaría la nota al prospecto
      setSnackbarMessage('Nota agregada exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setNotas('');
    } catch (err) {
      setSnackbarMessage('Error al agregar nota');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSubirDocumento = async (prospectoId, archivo) => {
    try {
      // Aquí se subiría el documento al prospecto
      setSnackbarMessage('Documento subido exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('Error al subir documento');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Renderizado de componentes auxiliares mejorados
  const renderEstadisticas = () => {
    if (cargandoEstadisticas) {
      return (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!estadisticas) return null;

    const estadisticasItems = [
      { label: 'Total Prospectos', value: estadisticas.total, icon: Users, color: 'blue' },
      { label: 'Nuevos', value: estadisticas.porEstado['Nuevo'] || 0, icon: UserPlus, color: 'green' },
      { label: 'En Seguimiento', value: estadisticas.porEstado['En_seguimiento'] || 0, icon: Clock, color: 'yellow' },
      { label: 'Valor Total', value: formatCurrency(estadisticas.valorTotal || 0), icon: DollarSign, color: 'purple' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {estadisticasItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={cn('p-4 rounded-lg', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', `bg-${item.color}-500/10`)}>
                  <Icon className={cn('h-5 w-5', `text-${item.color}-500`)} />
                </div>
                <div>
                  <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>{item.label}</p>
                  <p className={cn('text-xl font-bold', `text-${theme.colors.text}`)}>{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderProspectosProximosVencer = () => {
    if (prospectosProximosVencer.length === 0) return null;

    return (
      <div className={cn('p-4 rounded-lg mb-6', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h3 className={cn('text-lg font-semibold', `text-${theme.colors.text}`)}>
            Próximos a vencer ({prospectosProximosVencer.length})
          </h3>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {prospectosProximosVencer.map(prospecto => (
            <div key={prospecto.id} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className={cn('font-medium', `text-${theme.colors.text}`)}>
                {prospecto.nombre} {prospecto.apellido} - {prospecto.empresa}
              </p>
              <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
                Cierra: {new Date(prospecto.fecha_cierre_esperada).toLocaleDateString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizado de estadísticas avanzadas con gráficos
  const renderEstadisticasAvanzadas = () => {
    if (!estadisticasAvanzadas) return null;

    return (
      <div className={cn('p-6 rounded-lg mb-6', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <h3 className={cn('text-lg font-semibold mb-4', `text-${theme.colors.text}`)}>
          Análisis de Prospectos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={cn('text-3xl font-bold mb-2', `text-${theme.colors.primary}`)}>
              {estadisticasAvanzadas.tasaConversion}%
            </div>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Tasa de Conversión</p>
          </div>
          <div className="text-center">
            <div className={cn('text-3xl font-bold mb-2', `text-${theme.colors.success}`)}>
              {estadisticasAvanzadas.valorPromedio}
            </div>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Valor Promedio</p>
          </div>
          <div className="text-center">
            <div className={cn('text-3xl font-bold mb-2', `text-${theme.colors.warning}`)}>
              {estadisticasAvanzadas.tiempoPromedio}d
            </div>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>Tiempo de Cierre</p>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado de actividades recientes
  const renderActividadesRecientes = () => {
    if (actividades.length === 0) return null;

    return (
      <div className={cn('p-6 rounded-lg mb-6', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('text-lg font-semibold', `text-${theme.colors.text}`)}>
            Actividades Recientes
          </h3>
          <button className={cn('text-sm px-3 py-1 rounded-lg transition-colors', `bg-${theme.colors.primary} text-${theme.colors.text}`)}>
            Ver Todas
          </button>
        </div>
        <div className="space-y-3">
          {actividades.slice(0, 5).map((actividad, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className={cn('w-2 h-2 rounded-full', `bg-${actividad.tipo === 'llamada' ? 'blue' : actividad.tipo === 'email' ? 'green' : 'orange'}-500`)}></div>
              <div className="flex-1">
                <p className={cn('text-sm font-medium', `text-${theme.colors.text}`)}>
                  {actividad.descripcion}
                </p>
                <p className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
                  {actividad.usuario} • {new Date(actividad.fecha).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizado de documentos adjuntos
  const renderDocumentosAdjuntos = () => {
    if (documentos.length === 0) return null;

    return (
      <div className={cn('p-6 rounded-lg mb-6', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('text-lg font-semibold', `text-${theme.colors.text}`)}>
            Documentos Adjuntos
          </h3>
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              onChange={(e) => {
                // Handle file upload
                Array.from(e.target.files).forEach(file => {
                  handleSubirDocumento(null, file);
                });
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={cn('text-sm px-3 py-1 rounded-lg transition-colors cursor-pointer', `bg-${theme.colors.primary} text-${theme.colors.text}`)}
            >
              Subir Archivo
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documentos.map((doc, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
              <FileText className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', `text-${theme.colors.text}`)}>
                  {doc.nombre}
                </p>
                <p className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
                  {doc.tamaño} • {new Date(doc.fecha).toLocaleDateString()}
                </p>
              </div>
              <button className={cn('p-1 rounded transition-colors', `hover:bg-${theme.colors.error} text-${theme.colors.textSecondary}`)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizado de recordatorios
  const renderRecordatorios = () => {
    if (recordatorios.length === 0) return null;

    return (
      <div className={cn('p-6 rounded-lg mb-6', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('text-lg font-semibold', `text-${theme.colors.text}`)}>
            Recordatorios Próximos
          </h3>
          <button className={cn('text-sm px-3 py-1 rounded-lg transition-colors', `bg-${theme.colors.warning} text-${theme.colors.text}`)}>
            Gestionar
          </button>
        </div>
        <div className="space-y-3">
          {recordatorios.slice(0, 3).map((recordatorio, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className={cn('text-sm font-medium', `text-${theme.colors.text}`)}>
                  {recordatorio.titulo}
                </p>
                <p className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
                  {recordatorio.fecha} • {recordatorio.prospecto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Bloquear acceso para test@example.com
  if (isTestUser) {
    return (
      <div className="p-6">
        <div className={cn('p-4 rounded-lg mb-4', `bg-${theme.colors.warning} border border-${theme.colors.warningBorder}`)}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Acceso Restringido</h3>
              <p className="text-sm text-yellow-700">
                El módulo de Prospectos no está disponible para usuarios de prueba.
              </p>
              <p className="text-sm text-yellow-700">
                Contacta al administrador para obtener acceso completo.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className={cn('p-4 rounded-lg mb-4', `bg-${theme.colors.error} border border-${theme.colors.errorBorder}`)}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={cargarDatos}
          className={cn(
            'px-4 py-2 rounded-lg transition-colors',
            `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
          )}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado mejorado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', `bg-${theme.colors.primaryLight}`)}>
            <Users className={cn('h-6 w-6', `text-${theme.colors.primaryText}`)} />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', `text-${theme.colors.text}`)}>
              Gestión de Prospectos
            </h1>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              Sistema completo de seguimiento y gestión de oportunidades de negocio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVistaCompacta(!vistaCompacta)}
            className={cn(
              'px-3 py-2 rounded-lg transition-colors text-sm',
              `bg-${theme.colors.background} text-${theme.colors.text} hover:bg-${theme.colors.border}`
            )}
          >
            {vistaCompacta ? 'Vista Completa' : 'Vista Compacta'}
          </button>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={cn(
              'px-3 py-2 rounded-lg transition-colors text-sm',
              `bg-${theme.colors.background} text-${theme.colors.text} hover:bg-${theme.colors.border}`
            )}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </button>
          <button
            onClick={handleNuevoProspecto}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
            )}
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Estadísticas básicas */}
      {renderEstadisticas()}

      {/* Estadísticas avanzadas */}
      {renderEstadisticasAvanzadas()}

      {/* Actividades recientes */}
      {renderActividadesRecientes()}

      {/* Prospectos próximos a vencer */}
      {renderProspectosProximosVencer()}

      {/* Recordatorios */}
      {renderRecordatorios()}

      {/* Filtros avanzados */}
      {renderFiltrosAvanzados()}

      {/* Documentos adjuntos */}
      {renderDocumentosAdjuntos()}

      {/* Tabla de prospectos mejorada */}
      <div className={cn('rounded-lg overflow-hidden', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
        {cargando ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : prospectos.length === 0 ? (
          <div className="text-center p-8">
            <Users className={cn('h-12 w-12 mx-auto mb-4', `text-${theme.colors.textMuted}`)} />
            <h3 className={cn('text-lg font-semibold mb-2', `text-${theme.colors.text}`)}>
              No se encontraron prospectos
            </h3>
            <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
              {Object.keys({ busqueda, filtroEstado, filtroPrioridad, filtroResponsable }).some(key => key) ?
                'Ajusta los filtros para ver más resultados' :
                'Crea tu primer prospecto para comenzar'}
            </p>
            {Object.keys({ busqueda, filtroEstado, filtroPrioridad, filtroResponsable }).some(key => key) && (
              <button
                onClick={handleLimpiarFiltros}
                className={cn(
                  'mt-4 px-4 py-2 rounded-lg transition-colors',
                  `bg-${theme.colors.primary} text-${theme.colors.text} hover:bg-${theme.colors.primaryHover}`
                )}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn('border-b', `border-${theme.colors.border}`)}>
                <tr>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Prospecto
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Empresa
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Contacto
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Estado
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Prioridad
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Responsable
                  </th>
                  <th className={cn('px-4 py-3 text-right text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Valor
                  </th>
                  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Creación
                  </th>
                  <th className={cn('px-4 py-3 text-center text-xs font-semibold uppercase', `text-${theme.colors.textSecondary}`)}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {prospectos.map((prospecto) => {
                  const estadoConfig = estadoColores[prospecto.estado] || { bg: 'bg-gray-500', text: 'text-gray-500', bgLight: 'bg-gray-50', border: 'border-gray-200' };
                  const prioridadConfig = prioridadColores[prospecto.prioridad] || { bg: 'bg-gray-500', text: 'text-gray-500', bgLight: 'bg-gray-50', border: 'border-gray-200' };

                  return (
                    <tr
                      key={prospecto.id}
                      className={cn('border-b transition-colors', `border-${theme.colors.border} hover:bg-${theme.colors.background}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {prospecto.nombre?.charAt(0)}{prospecto.apellido?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className={cn('font-medium', `text-${theme.colors.text}`)}>
                              {prospecto.nombre} {prospecto.apellido}
                            </p>
                            {prospecto.cargo && (
                              <p className={cn('text-xs', `text-${theme.colors.textSecondary}`)}>
                                {prospecto.cargo}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className={cn('text-sm', `text-${theme.colors.text}`)}>
                            {prospecto.empresa || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {prospecto.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className={cn('text-sm', `text-${theme.colors.text}`)}>{prospecto.email}</span>
                            </div>
                          )}
                          {prospecto.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className={cn('text-sm', `text-${theme.colors.text}`)}>{prospecto.telefono}</span>
                            </div>
                          )}
                          {prospecto.ubicacion && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className={cn('text-sm', `text-${theme.colors.text}`)}>{prospecto.ubicacion}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          estadoConfig.bgLight,
                          estadoConfig.text
                        )}>
                          {prospecto.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          prioridadConfig.bgLight,
                          prioridadConfig.text
                        )}>
                          {prospecto.prioridad}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm', `text-${theme.colors.text}`)}>
                          {formatUserDisplay(prospecto.responsable)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn('font-medium', `text-${theme.colors.text}`)}>
                          {formatCurrency(prospecto.presupuesto_estimado)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
                          {new Date(prospecto.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => handleEditarProspecto(prospecto)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-${theme.colors.primary}`
                            )}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/prospectos/${prospecto.id}`)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-${theme.colors.info}`
                            )}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarProspecto(prospecto.id)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary} hover:text-${theme.colors.error}`
                            )}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación mejorada */}
      {prospectos.length > 0 && (
        <div className="flex items-center justify-between">
          <p className={cn('text-sm', `text-${theme.colors.textSecondary}`)}>
            Mostrando {prospectos.length} de {totalProspectos} prospectos
          </p>
          <div className="flex items-center gap-2">
            <select
              value={filasPorPagina}
              onChange={handleCambioFilasPorPagina}
              className={cn('px-3 py-2 rounded-lg text-sm', `bg-${theme.colors.surface} border border-${theme.colors.border} text-${theme.colors.text}`)}
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={(e) => handleCambioPagina(e, pagina - 1)}
                disabled={pagina === 0}
                className={cn(
                  'px-3 py-2 rounded-lg transition-colors',
                  pagina === 0
                    ? `bg-${theme.colors.background} text-${theme.colors.textSecondary} cursor-not-allowed`
                    : `bg-${theme.colors.background} text-${theme.colors.text} hover:bg-${theme.colors.border}`
                )}
              >
                ← Anterior
              </button>
              <span className={cn('px-4 py-2', `bg-${theme.colors.surface} border border-${theme.colors.border} text-${theme.colors.text}`)}>
                Página {pagina + 1}
              </span>
              <button
                onClick={(e) => handleCambioPagina(e, pagina + 1)}
                disabled={pagina >= Math.ceil(totalProspectos / filasPorPagina) - 1}
                className={cn(
                  'px-3 py-2 rounded-lg transition-colors',
                  pagina >= Math.ceil(totalProspectos / filasPorPagina) - 1
                    ? `bg-${theme.colors.background} text-${theme.colors.textSecondary} cursor-not-allowed`
                    : `bg-${theme.colors.background} text-${theme.colors.text} hover:bg-${theme.colors.border}`
                )}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario mejorado */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={cn('rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto', `bg-${theme.colors.surface} border border-${theme.colors.border}`)}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn('text-xl font-bold', `text-${theme.colors.text}`)}>
                {prospectoEditar ? 'Editar Prospecto' : 'Nuevo Prospecto'}
              </h2>
              <button
                onClick={handleCerrarModal}
                className={cn('p-2 rounded-lg transition-colors', `hover:bg-${theme.colors.background} text-${theme.colors.textSecondary}`)}
              >
                ×
              </button>
            </div>
            <FormularioProspecto
              prospecto={prospectoEditar}
              onGuardar={handleGuardarProspecto}
              onCerrar={handleCerrarModal}
            />
          </div>
        </div>
      )}

      {/* Snackbar para notificaciones */}
      {snackbarOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={cn(
            'p-4 rounded-lg shadow-lg max-w-sm',
            snackbarSeverity === 'success' ? `bg-${theme.colors.success} text-white` : `bg-${theme.colors.error} text-white`
          )}>
            <div className="flex items-center gap-2">
              {snackbarSeverity === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{snackbarMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaProspectos;
