// Unificar el cliente de Supabase para evitar múltiples instancias de GoTrue en el navegador.
// NUNCA expongas la service_role key en el frontend. Para tareas privilegiadas usar Edge Functions.
// Reutilizamos el único cliente creado en supabaseClient.js

import { supabase } from './supabaseClient';

// Exportamos un alias para compatibilidad con el código existente
export const supabaseAuth = supabase;