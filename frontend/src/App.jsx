import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AppRoutes from './routes/AppRoutes'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import healthCheck, { logHealthCheckResults } from './utils/moduleHealthCheck'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  console.log('🔒 ProtectedRoute check:', { user, loading })

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
    console.log('❌ ProtectedRoute: No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('✅ ProtectedRoute: User authenticated, rendering children')

  return children
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

function App() {
  // Ejecutar verificación de salud al cargar la aplicación
  useEffect(() => {
    const runHealthCheck = async () => {
      try {
        console.log('🏥 Iniciando verificación de salud del sistema...');
        const results = await healthCheck.runFullHealthCheck();
        logHealthCheckResults(results);
        
        // Verificar si hay errores críticos
        const criticalErrors = results.filter(r => r.status === 'error' && 
          ['Conexión Supabase', 'Autenticación'].includes(r.module));
        
        if (criticalErrors.length > 0) {
          console.error('❌ Errores críticos detectados:', criticalErrors);
        } else {
          console.log('✅ Sistema EVITA funcionando correctamente');
        }
      } catch (error) {
        console.error('❌ Error durante la verificación de salud:', error);
      }
    };

    // Ejecutar después de un breve delay para permitir que la aplicación se inicialice
    const timer = setTimeout(runHealthCheck, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export default App