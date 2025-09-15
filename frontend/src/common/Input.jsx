import React from 'react'

export default function Input(props) {
  return (
    <input
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      {...props}
    />
  )
}

