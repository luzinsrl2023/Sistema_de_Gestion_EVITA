import React from 'react'

export default function Input({ label, error, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-white">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full bg-gray-800 border rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-700 focus:ring-green-500 focus:border-transparent'
        }`}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}import React from 'react'

export default function Input({ label, error, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-white">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full bg-gray-800 border rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-700 focus:ring-green-500 focus:border-transparent'
        }`}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}