// Verificación de salud de los módulos del sistema EVITA
import { supabase } from '../lib/supabaseClient';

export const healthCheck = {
  // Verificar conexión a Supabase
  async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('usuarios_app').select('count').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Conexión a Supabase exitosa' };
    } catch (error) {
      return { status: 'error', message: `Error de conexión: ${error.message}` };
    }
  },

  // Verificar módulo de usuarios/autenticación
  async checkAuthModule() {
    try {
      const { data, error } = await supabase.from('usuarios_app').select('id, email').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de autenticación funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en autenticación: ${error.message}` };
    }
  },

  // Verificar módulo de clientes
  async checkClientesModule() {
    try {
      const { data, error } = await supabase.from('clientes').select('id, nombre').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de clientes funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en clientes: ${error.message}` };
    }
  },

  // Verificar módulo de productos
  async checkProductosModule() {
    try {
      const { data, error } = await supabase.from('productos').select('id, nombre, precio').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de productos funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en productos: ${error.message}` };
    }
  },

  // Verificar módulo de proveedores
  async checkProveedoresModule() {
    try {
      const { data, error } = await supabase.from('proveedores').select('id, nombre').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de proveedores funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en proveedores: ${error.message}` };
    }
  },

  // Verificar módulo de cotizaciones
  async checkCotizacionesModule() {
    try {
      const { data, error } = await supabase.from('cotizaciones').select('id, fecha').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de cotizaciones funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en cotizaciones: ${error.message}` };
    }
  },

  // Verificar módulo de facturas
  async checkFacturasModule() {
    try {
      const { data, error } = await supabase.from('facturas').select('id, numero_factura').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de facturas funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en facturas: ${error.message}` };
    }
  },

  // Verificar módulo de compras
  async checkComprasModule() {
    try {
      const { data, error } = await supabase.from('ordenes').select('id, fecha').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de compras funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en compras: ${error.message}` };
    }
  },

  // Verificar módulo de cobranzas
  async checkCobranzasModule() {
    try {
      const { data, error } = await supabase.from('cobranzas').select('id, fecha').limit(1);
      if (error) throw error;
      return { status: 'ok', message: 'Módulo de cobranzas funcionando' };
    } catch (error) {
      return { status: 'error', message: `Error en cobranzas: ${error.message}` };
    }
  },

  // Ejecutar todas las verificaciones
  async runFullHealthCheck() {
    const checks = [
      { name: 'Conexión Supabase', fn: this.checkSupabaseConnection },
      { name: 'Autenticación', fn: this.checkAuthModule },
      { name: 'Clientes', fn: this.checkClientesModule },
      { name: 'Productos', fn: this.checkProductosModule },
      { name: 'Proveedores', fn: this.checkProveedoresModule },
      { name: 'Cotizaciones', fn: this.checkCotizacionesModule },
      { name: 'Facturas', fn: this.checkFacturasModule },
      { name: 'Compras', fn: this.checkComprasModule },
      { name: 'Cobranzas', fn: this.checkCobranzasModule }
    ];

    const results = [];
    for (const check of checks) {
      try {
        const result = await check.fn.call(this);
        results.push({
          module: check.name,
          status: result.status,
          message: result.message
        });
      } catch (error) {
        results.push({
          module: check.name,
          status: 'error',
          message: `Error inesperado: ${error.message}`
        });
      }
    }

    return results;
  }
};

// Función helper para mostrar resultados en consola
export const logHealthCheckResults = (results) => {
  console.group('🏥 Verificación de Salud del Sistema EVITA');
  results.forEach(result => {
    const icon = result.status === 'ok' ? '✅' : '❌';
    console.log(`${icon} ${result.module}: ${result.message}`);
  });
  console.groupEnd();
};

export default healthCheck;

