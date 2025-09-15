import React from 'react'

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Log for debugging in the browser console
    // eslint-disable-next-line no-console
    console.error('Route error caught by ErrorBoundary:', error, info)
  }

  handleRetry = () => {
    this.setState({ error: null })
    // Force reload of current route chunk in case a lazy import failed
    if (typeof window !== 'undefined') {
      // Small delay so React can clear the state first
      setTimeout(() => window.location.reload(), 0)
    }
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
          <div className="max-w-xl w-full">
            <h1 className="text-2xl font-bold mb-2">Se produjo un error al cargar el módulo</h1>
            <p className="text-gray-400 mb-4">Por favor recarga la página o presiona "Reintentar". Si el problema persiste, comparte el mensaje de error.</p>
            <pre className="bg-gray-800 text-red-300 p-3 rounded-md overflow-auto text-sm mb-4">
              {String(error?.message || error)}
            </pre>
            <button onClick={this.handleRetry} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md">Reintentar</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

