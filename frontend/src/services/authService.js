import { supabase } from '../lib/supabaseClient';

/**
 * Logs in a user using their email and password.
 * This now uses the standard Supabase Auth method.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<{session: object | null, error: object | null}>}
 */
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { session: data.session, error };
};

/**
 * Logs out the current user.
 * This signs the user out from the Supabase session.
 * @returns {Promise<{error: object | null}>}
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Gets the current session from Supabase.
 * @returns {Promise<{session: object | null, error: object | null}>}
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

/**
 * Registers a new user.
 * This uses the standard Supabase Auth method for signing up.
 * @param {string} email - The new user's email.
 * @param {string} password - The new user's password.
 * @param {object} options - Additional metadata for the user.
 * @returns {Promise<{user: object | null, error: object | null}>}
 */
export const register = async (email, password, options = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options, // e.g., { username: 'example' }
    },
  });
  return { user: data.user, error };
};
