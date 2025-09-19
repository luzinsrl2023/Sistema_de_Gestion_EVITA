import { supabase } from '../lib/supabaseClient';

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
  const { data, error } = await supabase
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
 * Inicia sesión llamando a la Edge Function 'validate-login'.
 * Este es el método seguro y recomendado.
 */
export const login = async (email, password) => {
  // Demo user functionality
  if (email.toLowerCase() === 'test@example.com') {
    console.log('Activating demo mode.');
    const session = {
      user: {
        id: 'demo-user',
        email: 'test@example.com',
        demo: true, // Flag to identify demo user
      },
      token: 'demo-session-token',
    };
    localStorage.setItem('session', JSON.stringify(session));
    return { session, error: null };
  }

  // Existing login logic for real users
  try {
    const { data, error } = await supabase.functions.invoke('validate-login', {
      body: { email, password },
    });

    if (error) {
      // Network errors or function invocation errors
      console.error('Edge function invocation error:', error.message);
      return { session: null, error: { message: 'Error connecting to authentication service.' } };
    }

    if (!data.success) {
      // Credentials validation failed inside the function
      console.warn('Login validation failed:', data.error);
      return { session: null, error: { message: data.error || 'Invalid credentials' } };
    }

    // Login successful
    const session = {
      user: data.user,
      // Create a mock token or session object as needed by the rest of the app
      token: `custom-session-token-for-${data.user.id}`,
    };

    localStorage.setItem('session', JSON.stringify(session));
    return { session, error: null };

  } catch (err) {
    console.error('Login exception:', err);
    return { session: null, error: { message: 'An unexpected error occurred during login.' } };
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

