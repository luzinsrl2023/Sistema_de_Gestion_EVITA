import bcrypt from 'bcryptjs';
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

  // Real user authentication - Direct database query approach
  try {
    console.log('🔍 Attempting login for:', email);
    
    // Buscar usuario en la base de datos usando service role client
    const { data: user, error: dbError } = await supabaseAuth
      .from('usuarios_app')
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      if (dbError.code === 'PGRST116') {
        return { session: null, error: { message: 'Usuario no encontrado' } };
      }
      return { session: null, error: { message: 'Error al verificar credenciales' } };
    }

    if (!user) {
      console.warn('⚠️ User not found');
      return { session: null, error: { message: 'Usuario no encontrado' } };
    }

    // Verificar contraseña
    // NOTA: En producción, las contraseñas deberían estar hasheadas con bcrypt
    // Por ahora asumimos texto plano o hash simple
    let isValidPassword = false;

    try {
      const storedHash = user.password_hash ?? '';
      const isBcryptHash = typeof storedHash === 'string' && storedHash.startsWith('$2');

      if (isBcryptHash) {
        isValidPassword = bcrypt.compareSync(password, storedHash);
      } else {
        isValidPassword = storedHash === password;
      }
    } catch (compareError) {
      console.error('💥 Password comparison failed:', compareError);
      return { session: null, error: { message: 'Error al verificar credenciales' } };
    }
    
    if (!isValidPassword) {
      console.warn('⚠️ Invalid password');
      return { session: null, error: { message: 'Contraseña incorrecta' } };
    }

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

