import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

/**
 * Registers a new user in the custom 'usuarios_app' table with a hashed password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object | null, error: object | null}>}
 */
export const register = async (email, password) => {
    try {
        // Hash the password before storing it.
        const hashedPassword = bcrypt.hashSync(password, 10); // 10 is the salt rounds

        const { data, error } = await supabase
            .from('usuarios_app')
            .insert([{ email, password_hash: hashedPassword }])
            .select('id, email')
            .single();

        if (error) throw error;
        return { user: data, error: null };

    } catch (err) {
        console.error('Registration error:', err);
        // Provide a more user-friendly error message
        if (err.message.includes('unique constraint')) {
            return { user: null, error: { message: 'This email is already registered.' } };
        }
        return { user: null, error: { message: 'Failed to register user.' } };
    }
};

/**
 * Logs in a user by fetching their record and securely comparing the password hash.
 * @param {string} email - The user's email.
 * @param {string} password - The user's plaintext password.
 * @returns {Promise<{session: object | null, error: object | null}>}
 */
export const login = async (email, password) => {
  try {
    // Step 1: Fetch the user by email.
    const { data: user, error: fetchError } = await supabase
      .from('usuarios_app')
      .select('id, email, password_hash')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'exact one row' error
          console.error('Supabase fetch error:', fetchError.message);
      }
      return { session: null, error: { message: 'Invalid login credentials' } };
    }

    // Step 2: Compare the provided password with the stored hash.
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);

    if (!passwordMatch) {
      return { session: null, error: { message: 'Invalid login credentials' } };
    }

    // Step 3: Create a session if the password is correct.
    const session = {
      user: { id: user.id, email: user.email },
      token: `custom-session-token-for-${user.id}`, // This is not a secure JWT.
    };

    localStorage.setItem('session', JSON.stringify(session));
    return { session, error: null };

  } catch (err) {
    console.error('Login exception:', err);
    return { session: null, error: { message: 'An unexpected error occurred during login.' } };
  }
};

/**
 * Logs out the current user by clearing the session from localStorage.
 */
export const logout = () => {
  localStorage.removeItem('session');
  window.location.reload();
};

/**
 * Gets the current session from localStorage.
 */
export const getSession = () => {
  const sessionData = localStorage.getItem('session');
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (e) {
      console.error('Failed to parse session data from localStorage', e);
      localStorage.removeItem('session');
      return null;
    }
  }
  return null;
};
