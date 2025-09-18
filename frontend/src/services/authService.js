import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

/**
 * Registra un nuevo usuario en la tabla personalizada 'usuarios_app'.
 */
export const register = async (email, password) => {
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const { data, error } = await supabase
      .from('usuarios_app')
      .insert([{ email, password_hash: hashedPassword }])
      .select('id, email')
      .single();

    if (error) throw error;
    return { user: data, error: null };
  } catch (err) {
    console.error('Registration error:', err);
    if (err.message.includes('unique constraint')) {
      return { user: null, error: { message: 'This email is already registered.' } };
    }
    return { user: null, error: { message: 'Failed to register user.' } };
  }
};

/**
 * Inicia sesión verificando email + password contra la tabla 'usuarios_app'.
 */
export const login = async (email, password) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('usuarios_app')
      .select('id, email, password_hash')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return { session: null, error: { message: 'Invalid login credentials' } };
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return { session: null, error: { message: 'Invalid login credentials' } };
    }

    const session = {
      user: { id: user.id, email: user.email },
      token: `custom-session-token-for-${user.id}`,
    };

    localStorage.setItem('session', JSON.stringify(session));
    return { session, error: null };
  } catch (err) {
    console.error('Login exception:', err);
    return { session: null, error: { message: 'Unexpected login error.' } };
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

