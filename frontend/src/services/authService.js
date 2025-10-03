import { supabase } from '../lib/supabaseClient';
import { supabaseAuth } from '../lib/supabaseAuth';

// Note: The bcrypt dependency is no longer needed on the client-side.
// The registration logic might need to be updated to use an Edge Function as well,
// but for now, we focus on fixing the login.

/**
 * Registra un nuevo usuario.
 * WARNING: This function still inserts passwords directly. For production,
 * this should also be moved to a secure Edge Function.
 */
export const register = async (email, password) => {
  // This is a simplified example. Production apps should hash passwords server-side.
  const { data, error } = await supabaseAuth
    .from('usuarios_app')
    .insert([{ email, password_hash: password }]) // Storing plain text for now, assuming migration will hash it.
    .select('id, email')
    .single();

  if (error) {
    console.error('Registration error:', error);
    return { user: null, error };
  }
  return { user: data, error: null };
};


/**
 * Inicia sesión usando autenticación directa con Supabase.
 * Funciona tanto en desarrollo como en producción.
 */
export const login = async (email, password) => {
  // Demo user functionality
  if (email.toLowerCase() === 'test@example.com' && password === 'password123') {
    console.log('✅ Activating demo mode.');
    const session = {
      user: {
        id: 'demo-user',
        email: 'test@example.com',
        demo: true,
      },
      token: 'demo-session-token',
    };
    localStorage.setItem('session', JSON.stringify(session));
    return { session, error: null };
  }

  // Producción: delegar a Edge Function con bcrypt
  try {
    console.log('🔍 Attempting login for:', email);
    const { data, error } = await supabase.functions.invoke('validate-login', {
      body: { email, password }
    });
    if (error) {
      return { session: null, error };
    }
    if (!data?.success) {
      return { session: null, error: { message: data?.error || 'Credenciales inválidas' } };
    }
    const session = {
      user: {
        id: data.user.id,
        email: data.user.email
      },
      token: `session-${data.user.id}-${Date.now()}`
    };
    localStorage.setItem('session', JSON.stringify(session));
    return { session, error: null };
  } catch (err) {
    console.error('💥 Login exception:', err);
    return { session: null, error: { message: 'Error inesperado durante el login' } };
  }
};

/**
 * Cierra sesión limpiando localStorage.
 */
export const logout = () => {
  localStorage.removeItem('session');
  window.location.reload();
};

/**
 * Recupera la sesión actual desde localStorage.
 */
export const getSession = () => {
  const sessionData = localStorage.getItem('session');
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (e) {
      console.error('Failed to parse session data', e);
      localStorage.removeItem('session');
      return null;
    }
  }
  return null;
};

