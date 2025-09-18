import { supabase } from '../lib/supabaseClient';

// WARNING: This authentication method is insecure. It queries a custom table
// and compares against a password column that should contain hashes but currently
// contains plaintext. This is implemented as per the user's specific request.
// A secure implementation should use password hashing (e.g., bcrypt) and leverage
// Supabase's built-in Auth for session management.

/**
 * Logs in a user by checking credentials against the custom 'usuarios_app' table.
 * @param {string} email - The user's email.
 * @param {string} password - The user's plaintext password.
 * @returns {Promise<{session: object | null, error: object | null}>}
 */
export const login = async (email, password) => {
  try {
    // This query is insecure because it compares a plaintext password.
    const { data: user, error } = await supabase
      .from('usuarios_app')
      .select('id, email, username') // Select only non-sensitive data
      .eq('email', email)
      .eq('password_hash', password) // Comparing plaintext password against the 'password_hash' column.
      .single();

    if (error || !user) {
      if (error) console.error('Supabase query error:', error.message);
      return { session: null, error: { message: 'Invalid login credentials' } };
    }

    // Create a mock session object and store it in localStorage.
    const session = {
      user: { id: user.id, email: user.email, username: user.username || user.email.split('@')[0] },
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
  // We reload the page to ensure all state is cleared.
  window.location.reload();
};

/**
 * Gets the current session from localStorage.
 * This is a synchronous function.
 * @returns {object | null}
 */
export const getSession = () => {
  const sessionData = localStorage.getItem('session');
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (e) {
      console.error('Failed to parse session data from localStorage', e);
      localStorage.removeItem('session'); // Clear corrupted data
      return null;
    }
  }
  return null;
};

/**
 * Registers a new user in the custom 'usuarios_app' table.
 * WARNING: This saves the password in plaintext in the 'password_hash' column.
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @returns {Promise<{user: object | null, error: object | null}>}
 */
export const register = async (email, password, username) => {
    try {
        const { data, error } = await supabase
            .from('usuarios_app')
            .insert([{ email, password_hash: password, username }]) // Saving plaintext to password_hash
            .select()
            .single();

        if (error) {
            throw error;
        }

        return { user: data, error: null };

    } catch (err) {
        console.error('Registration error:', err);
        return { user: null, error: { message: 'Failed to register user.' } };
    }
};
