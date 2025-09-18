import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = authService.getSession();
    if (session && session.user) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { session, error } = await authService.login(email, password);
    if (session && session.user) {
      setUser(session.user);
    }
    return { session, error };
  };

  const signOut = () => {
    authService.logout();
    setUser(null);
  };

  const register = async (email, password) => {
    return await authService.register(email, password);
  };

  const value = {
    user,
    loading,
    login,
    signOut,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
