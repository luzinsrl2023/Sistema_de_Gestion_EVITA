// Configuración de variables de entorno para diferentes ambientes
// Este archivo ayuda a manejar las variables de entorno en producción

const getEnvConfig = () => {
  // En producción, las variables deben estar configuradas en Netlify
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://articulosdelimpiezaevita.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydGljdWxvc2RlbGltcGllemFldml0YSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM5MjQ4MDAwLCJleHAiOjIwNTQ4MjQwMDB9.example';

  return {
    supabaseUrl,
    supabaseAnonKey,
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV
  };
};

export default getEnvConfig;

