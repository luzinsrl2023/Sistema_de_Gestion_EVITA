import bcrypt from 'bcryptjs';

const users = [
  {
    id: 1,
    email: 'test@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    username: 'testuser',
  },
];

export const login = async (email, password) => {
  const user = users.find((u) => u.email === email);
  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    const session = {
      user: { id: user.id, email: user.email, username: user.username },
      token: 'fake-jwt-token',
    };
    localStorage.setItem('session', JSON.stringify(session));
    return { session, error: null };
  }
  return { session: null, error: 'Invalid login credentials' };
};

export const logout = () => {
  localStorage.removeItem('session');
};

export const getSession = () => {
  const session = localStorage.getItem('session');
  return session ? JSON.parse(session) : null;
};

export const register = async (email, password, username) => {
  if (users.find((u) => u.email === email)) {
    return { user: null, error: 'User already exists' };
  }
  const newUser = {
    id: users.length + 1,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    username,
  };
  users.push(newUser);
  return { user: newUser, error: null };
};
