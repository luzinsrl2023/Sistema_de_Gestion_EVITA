// Database configuration for local SQLite and production Supabase
import { createClient } from '@supabase/supabase-js'

// Environment configuration
const isDevelopment = import.meta.env.MODE === 'development'
const useLocalDB = import.meta.env.VITE_USE_LOCAL_DB === 'true' || isDevelopment

// Supabase configuration (for production)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Local SQLite mock implementation (for development)
class LocalAuthService {
  constructor() {
    this.initializeLocalStorage()
    this.users = JSON.parse(localStorage.getItem('evita_users') || '[]')
    this.currentUser = JSON.parse(localStorage.getItem('evita_current_user') || 'null')
    this.session = JSON.parse(localStorage.getItem('evita_session') || 'null')
    
    // Always ensure demo user exists
    this.ensureDemoUser()
  }

  initializeLocalStorage() {
    // Clear any corrupted data
    try {
      const users = localStorage.getItem('evita_users')
      if (users) {
        JSON.parse(users) // Test if it's valid JSON
      }
    } catch (e) {
      console.log('🗄️ Clearing corrupted user data')
      localStorage.removeItem('evita_users')
      localStorage.removeItem('evita_current_user')
      localStorage.removeItem('evita_session')
    }
  }

  ensureDemoUser() {
    // Always ensure demo user exists with correct credentials
    const demoUser = {
      id: '1',
      email: 'admin@evita.com',
      password: 'evita123',
      user_metadata: {
        name: 'Administrador EVITA',
        role: 'admin'
      },
      created_at: new Date().toISOString()
    }

    // Find existing demo user
    const existingDemoIndex = this.users.findIndex(u => u.email === 'admin@evita.com')
    
    if (existingDemoIndex >= 0) {
      // Update existing demo user to ensure correct credentials
      this.users[existingDemoIndex] = demoUser
    } else {
      // Add demo user if doesn't exist
      this.users.push(demoUser)
    }

    localStorage.setItem('evita_users', JSON.stringify(this.users))
    console.log('🔐 Demo user initialized: admin@evita.com / evita123')
  }

  async signInWithPassword({ email, password }) {
    console.log('🔍 Attempting login with:', { email, password: '***' })
    console.log('📊 Available users:', this.users.map(u => ({ email: u.email, id: u.id })))
    
    const user = this.users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      console.log('❌ Login failed: Invalid credentials')
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      }
    }

    const session = {
      access_token: 'mock-token-' + Date.now(),
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    }

    this.currentUser = session.user
    this.session = session
    
    localStorage.setItem('evita_current_user', JSON.stringify(this.currentUser))
    localStorage.setItem('evita_session', JSON.stringify(this.session))

    console.log('✅ Login successful for:', user.email)
    
    // Trigger auth state change
    setTimeout(() => {
      this.triggerAuthChange('SIGNED_IN', session)
    }, 100)
    
    return {
      data: { user: this.currentUser, session: this.session },
      error: null
    }
  }

  async signUp({ email, password, options = {} }) {
    const existingUser = this.users.find(u => u.email === email)
    
    if (existingUser) {
      return {
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      }
    }

    const newUser = {
      id: String(Date.now()),
      email,
      password,
      user_metadata: options.data || {},
      created_at: new Date().toISOString()
    }

    this.users.push(newUser)
    localStorage.setItem('evita_users', JSON.stringify(this.users))

    const session = {
      access_token: 'mock-token-' + Date.now(),
      user: {
        id: newUser.id,
        email: newUser.email,
        user_metadata: newUser.user_metadata
      }
    }

    this.currentUser = session.user
    this.session = session
    
    localStorage.setItem('evita_current_user', JSON.stringify(this.currentUser))
    localStorage.setItem('evita_session', JSON.stringify(this.session))

    return {
      data: { user: this.currentUser, session: this.session },
      error: null
    }
  }

  async signOut() {
    this.currentUser = null
    this.session = null
    localStorage.removeItem('evita_current_user')
    localStorage.removeItem('evita_session')
    
    return { error: null }
  }

  async getSession() {
    return {
      data: { session: this.session },
      error: null
    }
  }

  async getUser() {
    return {
      data: { user: this.currentUser },
      error: null
    }
  }

  onAuthStateChange(callback) {
    // Store the callback for later use
    this.authCallback = callback
    
    // Check immediately with current state
    const currentUser = JSON.parse(localStorage.getItem('evita_current_user') || 'null')
    const session = JSON.parse(localStorage.getItem('evita_session') || 'null')
    
    if (session && currentUser) {
      setTimeout(() => callback('SIGNED_IN', session), 0)
    } else {
      setTimeout(() => callback('SIGNED_OUT', null), 0)
    }

    // Listen for storage changes (for multiple tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'evita_session') {
        const newSession = JSON.parse(e.newValue || 'null')
        if (newSession) {
          callback('SIGNED_IN', newSession)
        } else {
          callback('SIGNED_OUT', null)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)

    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange)
          }
        }
      }
    }
  }

  // Method to trigger auth state change manually
  triggerAuthChange(event, session) {
    if (this.authCallback) {
      this.authCallback(event, session)
    }
  }
}

// Database service factory
export const createDatabaseService = () => {
  if (useLocalDB) {
    console.log('🗄️ Using local SQLite database for development')
    return {
      auth: new LocalAuthService(),
      isLocal: true
    }
  } else {
    console.log('☁️ Using Supabase for production')
    const supabase = createClient(supabaseUrl, supabaseKey)
    return {
      auth: supabase.auth,
      isLocal: false,
      supabase
    }
  }
}

// Export the database service
export const db = createDatabaseService()

// Utility function to reset local data (for debugging)
window.resetEVITAData = () => {
  console.log('🗑️ Resetting EVITA local data...')
  localStorage.removeItem('evita_users')
  localStorage.removeItem('evita_current_user')
  localStorage.removeItem('evita_session')
  window.location.reload()
}