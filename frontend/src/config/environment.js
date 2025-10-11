// Configuración de entorno para diferentes ambientes
const environment = {
  development: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'dev-key',
    apiUrl: 'http://localhost:3000',
    isProduction: false
  },
  production: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://articulosdelimpiezaevita.supabase.co',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydGljdWxvc2RlbGltcGllemFldml0YSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM5MjQ4MDAwLCJleHAiOjIwNTQ4MjQwMDB9.example',
    apiUrl: 'https://articulosdelimpiezaevita.netlify.app',
    isProduction: true
  }
};

const currentEnv = import.meta.env.PROD ? 'production' : 'development';
export const config = environment[currentEnv];

export default config;

