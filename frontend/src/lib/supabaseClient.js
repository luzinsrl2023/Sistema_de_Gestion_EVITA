import { createClient } from '@supabase/supabase-js';
import config from '../config/environment';

// Configuración de Supabase usando el archivo de configuración
const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

// Configuración del cliente con opciones mejoradas para manejo de errores
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Función para verificar la conexión
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('usuarios_app').select('count').limit(1);
    if (error) {
      console.error('Error de conexión a Supabase:', error);
      return false;
    }
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión a Supabase:', err);
    return false;
  }
};

// Verificar conexión al inicializar
if (import.meta.env.PROD) {
  checkSupabaseConnection();
}
