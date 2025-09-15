import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AppRoutes from './routes/AppRoutes'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { db } from './lib/database'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  console.log('🔒 ProtectedRoute check:', { user, loading, isLocal: db?.isLocal })

  if (loading) {
    console.log('⏳ ProtectedRoute: Loading...')
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando Sistema EVITA...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (db?.isLocal) {
      console.log('🤝 Local mode without user: allowing access')
      return children
    }
    console.log('❌ ProtectedRoute: No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('✅ ProtectedRoute: User authenticated, rendering children')

  return children
}

const queryClient = new QueryClient()

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <AppRoutes />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
          {import.meta.env && import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App