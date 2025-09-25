import React from 'react';

const ErrorComponent = ({ message = "Error al cargar el componente" }) => {
  return React.createElement('div', { className: 'min-h-screen bg-gray-900 flex items-center justify-center p-4' },
    React.createElement('div', { className: 'max-w-md w-full bg-gray-800 border border-gray-700 rounded-xl p-6 text-center' },
      React.createElement('div', { className: 'mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4' },
        React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'h-8 w-8 text-red-500', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
          React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
          React.createElement('line', { x1: '12', y1: '8', x2: '12', y2: '12' }),
          React.createElement('line', { x1: '12', y1: '16', x2: '12.01', y2: '16' })
        )
      ),
      React.createElement('h2', { className: 'text-xl font-bold text-white mb-2' }, 'Error de carga'),
      React.createElement('p', { className: 'text-gray-400 mb-6' }, message),
      React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 justify-center' },
        React.createElement('button', {
          onClick: () => window.location.reload(),
          className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors'
        }, 'Reintentar'),
        React.createElement('button', {
          onClick: () => window.history.back(),
          className: 'px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors'
        }, 'Volver atrás')
      )
    )
  );
};

export default ErrorComponent;