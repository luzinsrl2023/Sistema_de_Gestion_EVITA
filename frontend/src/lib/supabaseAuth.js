import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase con service role key para operaciones de autenticación
// NOTA: Esto es solo para operaciones de backend/autenticación. 
// Para operaciones regulares de frontend, usar supabaseClient.js

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWdxc3RkYnN0aXJqdm5hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MDQ2OSwiZXhwIjoyMDczNTE2NDY5fQ.Nymu9sb31t3uvcjv5j2MN14tmj1GRuSy0Rj7uVAKGJM';

// Valida que las variables de entorno estén presentes
if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is required");
}

// Crea cliente con service role key (solo para autenticación en el frontend)
// ADVERTENCIA: En producción, esto debería manejarse mediante Edge Functions
export const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);