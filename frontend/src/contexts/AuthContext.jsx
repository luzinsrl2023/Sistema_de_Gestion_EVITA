import React, { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../lib/database'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await db.auth.getSession()
        console.log('🔑 Initial session check:', session)

        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      } catch (error) {
        console.error('❌ Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = db.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', { event, session })
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email, password) => {
    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password,
      })
      
      if (data?.user && !error) {
        setUser(data.user)
        console.log('✅ User set in context:', data.user)
      }
      
      return { data, error }
    } catch (err) {
      console.error('❌ SignIn error:', err)
      return { data: null, error: err }
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await db.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await db.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}