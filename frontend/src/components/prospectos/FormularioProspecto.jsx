// =============================================
// COMPONENTE: FormularioProspecto.jsx
// Descripción: Modal para crear/editar prospectos
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import {
  crearProspecto,
  actualizarProspecto,
  obtenerProspectoPorId
} from '../../services/prospectosService';
import { supabase } from '../../lib/supabaseClient';

// Opciones para selects
const estados = [
  'Nuevo',
  'Contactado',
  'En_seguimiento',
  'Calificado',
  'Propuesta_enviada',
  'En_negociacion',
  'Convertido',
  'Perdido',
  'No_calificado'
];

const prioridades = ['Baja', 'Media', 'Alta', 'Urgente'];

const fuentes = [
  'Sitio_web',
  'Redes_sociales',
  'Referido',
  'Email_marketing',
  'Evento',
  'Llamada_enfria',
  'Publicidad_pagada',
  'Otro'
];

const industrias = [
  'Tecnología',
  'Servicios',
  'Manufactura',
  'Comercio',
  'Educación',
  'Salud',
  'Finanzas',
  'Construcción',
  'Consultoría',
  'Otro'
];

const tamanosEmpresa = [
  'Micro (1-10 empleados)',
  'Pequeña (11-50 empleados)',
  'Mediana (51-200 empleados)',
  'Grande (201-1000 empleados)',
  'Corporativo (1000+ empleados)'
];

const FormularioProspecto = ({ abierto, prospecto, onCerrar, onGuardar }) => {
  // Estados del formulario
  const [pasoActivo, setPasoActivo] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  // Estado del formulario
  const [formulario, setFormulario] = useState({
    // Información básica
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cargo: '',

    // Información de la empresa
    empresa: '',
    sitio_web: '',
    industria: '',
    tamaño_empresa: '',
    pais: '',
    ciudad: '',
    direccion: '',

    // Información del prospecto
    estado: 'Nuevo',
    prioridad: 'Media',
    fuente: '',

    // Presupuesto
    presupuesto_estimado: '',
    moneda_presupuesto: 'USD',

    // Notas y descripción
    notas: '',
    descripcion_oportunidad: '',

    // Fechas
    fecha_proximo_contacto: null,
    fecha_cierre_esperada: null,

    // Asignación
    responsable_id: ''
  });

  // Pasos del formulario
  const pasos = [
    'Información Básica',
    'Empresa',
    'Detalles del Prospecto',
    'Presupuesto y Fechas'
  ];

  // Cargar datos del prospecto si estamos editando
  useEffect(() => {
    const cargarDatosProspecto = async () => {
      if (prospecto && prospecto.id) {
        try {
          setCargando(true);
          const { data, error } = await obtenerProspectoPorId(prospecto.id);

          if (error) throw error;

          if (data) {
            setFormulario({
              ...data,
              presupuesto_estimado: data.presupuesto_estimado || '',
              fecha_proximo_contacto: data.fecha_proximo_contacto || null,
              fecha_cierre_esperada: data.fecha_cierre_esperada || null
            });
          }
        } catch (err) {
          console.error('Error al cargar prospecto:', err);
          setError(err.message || 'Error al cargar los datos del prospecto');
        } finally {
          setCargando(false);
        }
      }
    };

    cargarDatosProspecto();
  }, [prospecto]);

  // Cargar usuarios para asignación
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, raw_user_meta_data')
          .order('email');

        if (error) throw error;
        setUsuarios(data || []);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
      }
    };

    cargarUsuarios();
  }, []);

  // Resetear formulario cuando se cierra
  useEffect(() => {
    if (!abierto) {
      setFormulario({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        cargo: '',
        empresa: '',
        sitio_web: '',
        industria: '',
        tamaño_empresa: '',
        pais: '',
        ciudad: '',
        direccion: '',
        estado: 'Nuevo',
        prioridad: 'Media',
        fuente: '',
        presupuesto_estimado: '',
        moneda_presupuesto: 'USD',
        notas: '',
        descripcion_oportunidad: '',
        fecha_proximo_contacto: null,
        fecha_cierre_esperada: null,
        responsable_id: ''
      });
      setPasoActivo(0);
      setError(null);
    }
  }, [abierto]);

  // Manejadores de eventos
  const handleCambio = (campo) => (evento) => {
    setFormulario({
      ...formulario,
      [campo]: evento.target.value
    });
  };

  const handleCambioFecha = (campo) => (fecha) => {
    setFormulario({
      ...formulario,
      [campo]: fecha
    });
  };

  const handleSiguientePaso = () => {
    if (pasoActivo < pasos.length - 1) {
      setPasoActivo(pasoActivo + 1);
    }
  };

  const handlePasoAnterior = () => {
    if (pasoActivo > 0) {
      setPasoActivo(pasoActivo - 1);
    }
  };

  const handlePasoClick = (paso) => {
    setPasoActivo(paso);
  };

  const validarPaso = (paso) => {
    switch (paso) {
      case 0: // Información básica
        return formulario.nombre.trim() !== '' &&
               (formulario.email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email));
      case 1: // Empresa
        return true; // Opcional
      case 2: // Detalles del prospecto
        return formulario.estado !== '' && formulario.prioridad !== '';
      case 3: // Presupuesto y fechas
        return formulario.presupuesto_estimado === '' ||
               (!isNaN(formulario.presupuesto_estimado) && parseFloat(formulario.presupuesto_estimado) >= 0);
      default:
        return true;
    }
  };

  const handleGuardar = async () => {
    setCargando(true);
    setError(null);

    try {
      // Preparar datos
      const datosParaGuardar = {
        ...formulario,
        presupuesto_estimado: formulario.presupuesto_estimado ?
          parseFloat(formulario.presupuesto_estimado) : null,
        fecha_proximo_contacto: formulario.fecha_proximo_contacto ?
          formulario.fecha_proximo_contacto.toISOString() : null,
        fecha_cierre_esperada: formulario.fecha_cierre_esperada ?
          formulario.fecha_cierre_esperada.toISOString().split('T')[0] : null
      };

      let resultado;
      if (prospecto && prospecto.id) {
        // Actualizar
        resultado = await actualizarProspecto(prospecto.id, datosParaGuardar);
      } else {
        // Crear
        resultado = await crearProspecto(datosParaGuardar);
      }

      if (resultado.error) {
        throw resultado.error;
      }

      // Llamar callback de guardado
      if (onGuardar) {
        await onGuardar(resultado.data);
      }

      // Cerrar modal
      onCerrar();
    } catch (err) {
      console.error('Error al guardar prospecto:', err);
      setError(err.message || 'Error al guardar el prospecto');
    } finally {
      setCargando(false);
    }
  };

  // Renderizado de pasos del formulario
  const renderPasoInformacionBasica = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="Nombre"
          value={formulario.nombre}
          onChange={handleCambio('nombre')}
          error={!formulario.nombre.trim()}
          helperText={!formulario.nombre.trim() ? 'El nombre es requerido' : ''}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Apellido"
          value={formulario.apellido}
          onChange={handleCambio('apellido')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formulario.email}
          onChange={handleCambio('email')}
          error={formulario.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)}
          helperText={formulario.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email) ?
            'Email inválido' : ''}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Teléfono"
          value={formulario.telefono}
          onChange={handleCambio('telefono')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Cargo"
          value={formulario.cargo}
          onChange={handleCambio('cargo')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Responsable</InputLabel>
          <Select
            value={formulario.responsable_id}
            onChange={handleCambio('responsable_id')}
            label="Responsable"
          >
            <MenuItem value="">Sin asignar</MenuItem>
            {usuarios.map(usuario => (
              <MenuItem key={usuario.id} value={usuario.id}>
                {usuario.raw_user_meta_data?.full_name || usuario.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderPasoEmpresa = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Empresa"
          value={formulario.empresa}
          onChange={handleCambio('empresa')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Sitio Web"
          type="url"
          value={formulario.sitio_web}
          onChange={handleCambio('sitio_web')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Industria</InputLabel>
          <Select
            value={formulario.industria}
            onChange={handleCambio('industria')}
            label="Industria"
          >
            <MenuItem value="">Seleccionar industria</MenuItem>
            {industrias.map(industria => (
              <MenuItem key={industria} value={industria}>{industria}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Tamaño de Empresa</InputLabel>
          <Select
            value={formulario.tamaño_empresa}
            onChange={handleCambio('tamaño_empresa')}
            label="Tamaño de Empresa"
          >
            <MenuItem value="">Seleccionar tamaño</MenuItem>
            {tamanosEmpresa.map(tamaño => (
              <MenuItem key={tamaño} value={tamaño}>{tamaño}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="País"
          value={formulario.pais}
          onChange={handleCambio('pais')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Ciudad"
          value={formulario.ciudad}
          onChange={handleCambio('ciudad')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Dirección"
          value={formulario.direccion}
          onChange={handleCambio('direccion')}
        />
      </Grid>
    </Grid>
  );

  const renderPasoDetalles = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Estado</InputLabel>
          <Select
            value={formulario.estado}
            onChange={handleCambio('estado')}
            label="Estado"
          >
            {estados.map(estado => (
              <MenuItem key={estado} value={estado}>
                {estado.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Prioridad</InputLabel>
          <Select
            value={formulario.prioridad}
            onChange={handleCambio('prioridad')}
            label="Prioridad"
          >
            {prioridades.map(prioridad => (
              <MenuItem key={prioridad} value={prioridad}>{prioridad}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Fuente</InputLabel>
          <Select
            value={formulario.fuente}
            onChange={handleCambio('fuente')}
            label="Fuente"
          >
            <MenuItem value="">Seleccionar fuente</MenuItem>
            {fuentes.map(fuente => (
              <MenuItem key={fuente} value={fuente}>
                {fuente.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Descripción de la Oportunidad"
          value={formulario.descripcion_oportunidad}
          onChange={handleCambio('descripcion_oportunidad')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Notas"
          value={formulario.notas}
          onChange={handleCambio('notas')}
        />
      </Grid>
    </Grid>
  );

  const renderPasoPresupuestoFechas = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Presupuesto Estimado"
          type="number"
          value={formulario.presupuesto_estimado}
          onChange={handleCambio('presupuesto_estimado')}
          InputProps={{
            startAdornment: <span>$</span>,
          }}
          error={formulario.presupuesto_estimado &&
                 (isNaN(formulario.presupuesto_estimado) ||
                  parseFloat(formulario.presupuesto_estimado) < 0)}
          helperText={formulario.presupuesto_estimado &&
                     (isNaN(formulario.presupuesto_estimado) ||
                      parseFloat(formulario.presupuesto_estimado) < 0) ?
            'Ingrese un valor válido' : ''}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Moneda</InputLabel>
          <Select
            value={formulario.moneda_presupuesto}
            onChange={handleCambio('moneda_presupuesto')}
            label="Moneda"
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
            <MenuItem value="GBP">GBP</MenuItem>
            <MenuItem value="MXN">MXN</MenuItem>
            <MenuItem value="COP">COP</MenuItem>
            <MenuItem value="ARS">ARS</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            label="Próximo Contacto"
            value={formulario.fecha_proximo_contacto}
            onChange={handleCambioFecha('fecha_proximo_contacto')}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            label="Fecha de Cierre Esperada"
            value={formulario.fecha_cierre_esperada}
            onChange={handleCambioFecha('fecha_cierre_esperada')}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>
      </Grid>
    </Grid>
  );

  const renderContenidoPaso = () => {
    switch (pasoActivo) {
      case 0:
        return renderPasoInformacionBasica();
      case 1:
        return renderPasoEmpresa();
      case 2:
        return renderPasoDetalles();
      case 3:
        return renderPasoPresupuestoFechas();
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={abierto}
      onClose={onCerrar}
      maxWidth="md"
      fullWidth
      scroll="body"
    >
      <DialogTitle>
        {prospecto && prospecto.id ? 'Editar Prospecto' : 'Nuevo Prospecto'}
      </DialogTitle>

      <DialogContent dividers>
        {/* Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={pasoActivo} alternativeLabel>
            {pasos.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  onClick={() => handlePasoClick(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Mensaje de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Contenido del paso actual */}
        {renderContenidoPaso()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Button>

        {pasoActivo > 0 && (
          <Button onClick={handlePasoAnterior} disabled={cargando}>
            Anterior
          </Button>
        )}

        {pasoActivo < pasos.length - 1 ? (
          <Button
            onClick={handleSiguientePaso}
            disabled={cargando || !validarPaso(pasoActivo)}
            variant="contained"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={handleGuardar}
            disabled={cargando || !validarPaso(pasoActivo)}
            variant="contained"
            startIcon={cargando ? <CircularProgress size={20} /> : null}
          >
            {cargando ? 'Guardando...' : (prospecto && prospecto.id ? 'Actualizar' : 'Crear')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FormularioProspecto;