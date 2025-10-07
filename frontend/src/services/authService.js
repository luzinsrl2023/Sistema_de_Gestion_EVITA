import { supabaseAuth } from '../lib/supabaseAuth';

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
 * Inicia sesión de forma segura llamando a una función RPC de PostgreSQL.
 * La función `login_and_migrate` se encarga de la lógica de autenticación y migración de contraseñas.
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

  // Real user authentication via RPC call
  try {
    console.log('🔍 Attempting login via RPC for:', email);

    const { data, error } = await supabaseAuth.rpc('login_and_migrate', {
      email_input: email,
      password_input: password,
    });

    if (error) {
      console.error('❌ RPC error:', error);
      return { session: null, error: { message: 'Error en el servidor. Inténtalo de nuevo.' } };
    }

    // The RPC returns an array, so we check if it's empty
    if (!data || data.length === 0) {
      console.warn('⚠️ Invalid credentials or user not found');
      return { session: null, error: { message: 'Email o contraseña incorrectos.' } };
    }
    
    // Sucessful login returns the user object in the first element of the array
    const user = data[0];

    // Login successful
    console.log('✅ Login successful for user:', user.email);
    const session = {
      user: {
        id: user.id,
        email: user.email,
      },
      token: `session-${user.id}-${Date.now()}`,
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