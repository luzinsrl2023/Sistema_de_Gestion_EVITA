import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://qkugqstdbstirjvnalym.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_Ul_j-g9Z0WZQU7Ufxy_zbA_-3E-4seg';

const runtimeConfig = typeof window !== 'undefined' && window.__SUPABASE_CONFIG__
  ? window.__SUPABASE_CONFIG__
  : {};

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  runtimeConfig.url ||
  FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  runtimeConfig.anonKey ||
  FALLBACK_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key are required. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Usando configuración de respaldo. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para sobrescribirla.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
