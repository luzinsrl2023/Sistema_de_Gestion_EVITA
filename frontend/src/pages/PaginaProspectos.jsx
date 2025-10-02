// =============================================
// COMPONENTE: PaginaProspectos.jsx
// Descripción: Página principal de gestión de prospectos
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AssignmentInd as AssignIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  obtenerProspectos,
  eliminarProspecto,
  obtenerEstadisticasProspectos,
  obtenerProspectosProximosAVencer
} from '../services/prospectosService';

import FormularioProspecto from '../components/prospectos/FormularioProspecto';

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const formatUserDisplay = (user) => {
  if (!user) return '-';
  const value = typeof user === 'string' ? safeParse(user) : user;
  return value?.full_name || value?.nombre || value?.email || value?.id || '-';
};

// Configuración de colores para estados
const estadoColores = {
  'Nuevo': 'info',
  'Contactado': 'primary',
  'En_seguimiento': 'warning',
  'Calificado': 'success',
  'Propuesta_enviada': 'secondary',
  'En_negociacion': 'warning',
  'Convertido': 'success',
  'Perdido': 'error',
  'No_calificado': 'default'
};

// Configuración de colores para prioridades
const prioridadColores = {
  'Baja': 'default',
  'Media': 'warning',
  'Alta': 'error',
  'Urgente': 'error'
};

const PaginaProspectos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Verificar si el usuario es test@example.com
  const isTestUser = user?.email === 'test@example.com';

  // Estados del componente
  const [prospectos, setProspectos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [prospectosProximosVencer, setProspectosProximosVencer] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtrado y paginación
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [totalProspectos, setTotalProspectos] = useState(0);

  // Estado del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [prospectoEditar, setProspectoEditar] = useState(null);

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resultadoProspectos, resultadoEstadisticas, resultadoProximos] = await Promise.all([
        obtenerProspectos({
          busqueda,
          estado: filtroEstado,
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
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setCargando(false);
      setCargandoEstadisticas(false);
    }
  }, [busqueda, filtroEstado, pagina, filasPorPagina]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejadores de eventos
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

  const handleNuevoProspecto = () => {
    setProspectoEditar(null);
    setModalAbierto(true);
  };

  const handleEditarProspecto = (prospecto) => {
    setProspectoEditar(prospecto);
    setModalAbierto(true);
  };

  const handleEliminarProspecto = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este prospecto?')) {
      try {
        const { error } = await eliminarProspecto(id);
        if (error) throw error;

        // Recargar datos
        await cargarDatos();

        // Mostrar mensaje de éxito
        // Aquí podrías usar un sistema de notificaciones
        console.log('Prospecto eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar prospecto:', err);
        setError(err.message || 'Error al eliminar el prospecto');
      }
    }
  };

  const handleGuardarProspecto = async () => {
    setModalAbierto(false);
    setProspectoEditar(null);
    await cargarDatos();
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setProspectoEditar(null);
  };

  // Renderizado de componentes auxiliares
  const renderEstadisticas = () => {
    if (cargandoEstadisticas) {
      return <CircularProgress size={24} />;
    }

    if (!estadisticas) return null;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Prospectos
              </Typography>
              <Typography variant="h4" component="div">
                {estadisticas.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Nuevos
              </Typography>
              <Typography variant="h4" component="div">
                {estadisticas.porEstado['Nuevo'] || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En Seguimiento
              </Typography>
              <Typography variant="h4" component="div">
                {estadisticas.porEstado['En_seguimiento'] || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valor Total
              </Typography>
              <Typography variant="h4" component="div">
                ${(estadisticas.valorTotal || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderProspectosProximosVencer = () => {
    if (prospectosProximosVencer.length === 0) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="warning.main">
            ⚠️ Próximos a vencer ({prospectosProximosVencer.length})
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {prospectosProximosVencer.map(prospecto => (
              <Box key={prospecto.id} sx={{ mb: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>{prospecto.nombre} {prospecto.apellido}</strong> - {prospecto.empresa}
                </Typography>
                <Typography variant="caption">
                  Cierra: {new Date(prospecto.fecha_cierre_esperada).toLocaleDateString()}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Bloquear acceso para test@example.com
  if (isTestUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          El módulo de Prospectos no está disponible para usuarios de prueba.
          Por favor, contacta al administrador para obtener acceso completo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Prospectos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNuevoProspecto}
        >
          Nuevo Prospecto
        </Button>
      </Box>

      {/* Estadísticas */}
      {renderEstadisticas()}

      {/* Prospectos próximos a vencer */}
      {renderProspectosProximosVencer()}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar prospectos..."
                value={busqueda}
                onChange={handleBusqueda}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  onChange={handleFiltroEstado}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Nuevo">Nuevo</MenuItem>
                  <MenuItem value="Contactado">Contactado</MenuItem>
                  <MenuItem value="En_seguimiento">En Seguimiento</MenuItem>
                  <MenuItem value="Calificado">Calificado</MenuItem>
                  <MenuItem value="Propuesta_enviada">Propuesta Enviada</MenuItem>
                  <MenuItem value="En_negociacion">En Negociación</MenuItem>
                  <MenuItem value="Convertido">Convertido</MenuItem>
                  <MenuItem value="Perdido">Perdido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setBusqueda('');
                  setFiltroEstado('');
                  setPagina(0);
                }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de prospectos */}
      <Card>
        <CardContent>
          {cargando ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Prioridad</TableCell>
                      <TableCell>Responsable</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Fecha Creación</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prospectos.map((prospecto) => (
                      <TableRow key={prospecto.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {prospecto.nombre} {prospecto.apellido}
                          </Typography>
                          {prospecto.cargo && (
                            <Typography variant="caption" color="textSecondary">
                              {prospecto.cargo}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{prospecto.empresa || '-'}</TableCell>
                        <TableCell>{prospecto.email || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={prospecto.estado.replace('_', ' ')}
                            size="small"
                            color={estadoColores[prospecto.estado] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={prospecto.prioridad}
                            size="small"
                            color={prioridadColores[prospecto.prioridad] || 'default'}
                          />
                        </TableCell>
                        <TableCell>{formatUserDisplay(prospecto.responsable)}</TableCell>
                        <TableCell>
                          {prospecto.presupuesto_estimado ?
                            `$${prospecto.presupuesto_estimado.toLocaleString()}` :
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(prospecto.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditarProspecto(prospecto)}
                            title="Editar"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/prospectos/${prospecto.id}`)}
                            title="Ver detalles"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEliminarProspecto(prospecto.id)}
                            title="Eliminar"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginación */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalProspectos}
                rowsPerPage={filasPorPagina}
                page={pagina}
                onPageChange={handleCambioPagina}
                onRowsPerPageChange={handleCambioFilasPorPagina}
                labelRowsPerPage="Filas por página"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <FormularioProspecto
        abierto={modalAbierto}
        prospecto={prospectoEditar}
        onCerrar={handleCerrarModal}
        onGuardar={handleGuardarProspecto}
      />
    </Box>
  );
};

export default PaginaProspectos;