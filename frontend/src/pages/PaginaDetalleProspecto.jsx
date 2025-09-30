// =============================================
// COMPONENTE OPCIONAL: PaginaDetalleProspecto
// =============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { obtenerProspectoPorId } from '../services/prospectosService';

// Configuración de colores (igual que en PaginaProspectos)
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

const prioridadColores = {
  'Baja': 'default',
  'Media': 'warning',
  'Alta': 'error',
  'Urgente': 'error'
};

const PaginaDetalleProspecto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prospecto, setProspecto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProspecto = async () => {
      try {
        const { data, error } = await obtenerProspectoPorId(id);

        if (error) throw error;

        setProspecto(data);
      } catch (err) {
        console.error('Error al cargar prospecto:', err);
        setError(err.message || 'Error al cargar el prospecto');
      } finally {
        setCargando(false);
      }
    };

    if (id) {
      cargarProspecto();
    }
  }, [id]);

  const handleEditar = () => {
    // Esta es una forma de manejar la edición. Otra sería abrir el modal.
    // Por ahora, asumimos que hay una página de edición o que se abrirá un modal
    // desde la página de listado. Aquí simplemente navegamos a una ruta hipotética.
    // O mejor, podemos pasar el estado a la página principal para que abra el modal.
    // Por simplicidad, por ahora solo logueamos.
    console.log("Editar prospecto:", prospecto);
    // En un caso real, podrías usar: navigate(`/prospectos/editar/${id}`);
    // O, si el formulario es un modal en la página de lista:
    navigate('/prospectos', { state: { editProspectoId: id } });
  };

  const handleVolver = () => {
    navigate('/prospectos');
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={handleVolver} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Volver a la lista
        </Button>
      </Box>
    );
  }

  if (!prospecto) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Prospecto no encontrado</Alert>
        <Button onClick={handleVolver} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Volver a la lista
        </Button>
      </Box>
    );
  }

  const InfoItem = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ mr: 2, color: 'text.secondary' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleVolver} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {prospecto.nombre} {prospecto.apellido}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            label={prospecto.estado.replace('_', ' ')}
            color={estadoColores[prospecto.estado] || 'default'}
          />
          <Chip
            label={prospecto.prioridad}
            color={prioridadColores[prospecto.prioridad] || 'default'}
          />
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate('/prospectos', { state: { editProspectoId: prospecto.id } })}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Contacto
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoItem
                    icon={<PersonIcon />}
                    label="Nombre Completo"
                    value={`${prospecto.nombre} ${prospecto.apellido || ''}`}
                  />

                  {prospecto.email && (
                    <InfoItem
                      icon={<EmailIcon />}
                      label="Email"
                      value={prospecto.email}
                    />
                  )}

                  {prospecto.telefono && (
                    <InfoItem
                      icon={<PhoneIcon />}
                      label="Teléfono"
                      value={prospecto.telefono}
                    />
                  )}

                  {prospecto.cargo && (
                    <InfoItem
                      icon={<PersonIcon />}
                      label="Cargo"
                      value={prospecto.cargo}
                    />
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  {prospecto.empresa && (
                    <InfoItem
                      icon={<BusinessIcon />}
                      label="Empresa"
                      value={prospecto.empresa}
                    />
                  )}

                  {prospecto.industria && (
                    <InfoItem
                      icon={<BusinessIcon />}
                      label="Industria"
                      value={prospecto.industria}
                    />
                  )}

                  {prospecto.tamaño_empresa && (
                    <InfoItem
                      icon={<BusinessIcon />}
                      label="Tamaño de Empresa"
                      value={prospecto.tamaño_empresa}
                    />
                  )}

                  {prospecto.pais && (
                    <InfoItem
                      icon={<BusinessIcon />}
                      label="Ubicación"
                      value={`${prospecto.ciudad ? prospecto.ciudad + ', ' : ''}${prospecto.pais}`}
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Información del Prospecto */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Prospecto
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoItem
                    label="Fuente"
                    value={prospecto.fuente ? prospecto.fuente.replace('_', ' ') : '-'}
                  />

                  {prospecto.presupuesto_estimado && (
                    <InfoItem
                      label="Presupuesto Estimado"
                      value={`${prospecto.moneda_presupuesto || 'USD'} $${prospecto.presupuesto_estimado.toLocaleString()}`}
                    />
                  )}

                  {prospecto.fecha_proximo_contacto && (
                    <InfoItem
                      label="Próximo Contacto"
                      value={new Date(prospecto.fecha_proximo_contacto).toLocaleDateString()}
                    />
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  {prospecto.fecha_cierre_esperada && (
                    <InfoItem
                      label="Fecha de Cierre Esperada"
                      value={new Date(prospecto.fecha_cierre_esperada).toLocaleDateString()}
                    />
                  )}

                  <InfoItem
                    label="Fecha de Creación"
                    value={new Date(prospecto.created_at).toLocaleDateString()}
                  />

                  {prospecto.responsable && (
                    <InfoItem
                      label="Responsable"
                      value={prospecto.responsable.raw_user_meta_data?.full_name ||
                             prospecto.responsable.email}
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Descripción y Notas */}
          {(prospecto.descripcion_oportunidad || prospecto.notas) && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información Adicional
                </Typography>

                {prospecto.descripcion_oportunidad && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Descripción de la Oportunidad
                    </Typography>
                    <Typography variant="body1">
                      {prospecto.descripcion_oportunidad}
                    </Typography>
                  </Box>
                )}

                {prospecto.notas && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Notas
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {prospecto.notas}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Panel lateral */}
        <Grid item xs={12} md={4}>
          {/* Acciones rápidas */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/prospectos', { state: { editProspectoId: prospecto.id } })}
                  fullWidth
                >
                  Editar Prospecto
                </Button>

                {prospecto.email && (
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    href={`mailto:${prospecto.email}`}
                    fullWidth
                  >
                    Enviar Email
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Información del sistema */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Sistema
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID del Prospecto
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {prospecto.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Última Actualización
                </Typography>
                <Typography variant="body2">
                  {new Date(prospecto.updated_at).toLocaleDateString()} {new Date(prospecto.updated_at).toLocaleTimeString()}
                </Typography>
              </Box>

              {prospecto.creador && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Creado por
                  </Typography>
                  <Typography variant="body2">
                    {prospecto.creador.raw_user_meta_data?.full_name || prospecto.creador.email}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaginaDetalleProspecto;