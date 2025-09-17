import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

// Fallback user for demo purposes
const fallbackUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'admin@evita.com',
  passwordHash: bcrypt.hashSync('evita123', 10), // Ensure you have a fallback password
  username: 'Admin',
};

export const login = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from('usuarios_app')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      // Fallback to hardcoded user if not found in DB
      if (email === fallbackUser.email && bcrypt.compareSync(password, fallbackUser.passwordHash)) {
        const session = {
          user: { id: fallbackUser.id, email: fallbackUser.email, username: fallbackUser.username },
          token: 'fake-fallback-token',
        };
        localStorage.setItem('session', JSON.stringify(session));
        return { session, error: null };
      }
      return { session: null, error: 'Invalid login credentials' };
    }

    const passwordMatch = await bcrypt.compare(password, data.password);
    if (passwordMatch) {
      const session = {
        user: { id: data.id, email: data.email, username: data.username || data.email.split('@')[0] },
        token: 'fake-supabase-token', // In a real scenario, you would use Supabase's session
      };
      localStorage.setItem('session', JSON.stringify(session));
      return { session, error: null };
    }

    return { session: null, error: 'Invalid login credentials' };
  } catch (error) {
    console.error('Login error:', error);
    return { session: null, error: 'An unexpected error occurred' };
  }
};

export const logout = async () => {
  localStorage.removeItem('session');
  // Also sign out from Supabase if you are using its auth session
  await supabase.auth.signOut();
};

export const getSession = () => {
  const session = localStorage.getItem('session');
  return session ? JSON.parse(session) : null;
};

export const register = async (email, password, username) => {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('usuarios_app')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { user: null, error: 'User already exists' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from('usuarios_app')
      .insert([{ email, password: passwordHash, username }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return { user: newUser, error: null };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, error: 'Failed to register user' };
  }
};
