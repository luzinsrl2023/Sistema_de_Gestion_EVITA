import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
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
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { session: initialSession } = await authService.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    return authService.login(email, password);
  };

  const signOut = async () => {
    await authService.logout();
  };

  const register = async (email, password, username) => {
    return authService.register(email, password, { username });
  };

  const value = {
    session,
    user,
    loading,
    login,
    signOut,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};