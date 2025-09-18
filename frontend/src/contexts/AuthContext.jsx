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

  // On initial load, check if a session exists in localStorage.
  useEffect(() => {
    // This is now a synchronous call.
    const session = authService.getSession();
    if (session && session.user) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  // Login function that updates user state on success.
  const login = async (email, password) => {
    const { session, error } = await authService.login(email, password);
    if (session && session.user) {
      setUser(session.user);
    }
    // Return the result so the UI can handle errors.
    return { session, error };
  };

  // SignOut function that clears user state.
  const signOut = () => {
    authService.logout();
    setUser(null);
  };

  // Register function.
  const register = async (email, password, username) => {
    // The service handles the registration, no need to set user state here
    // as login is a separate step.
    return await authService.register(email, password, username);
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