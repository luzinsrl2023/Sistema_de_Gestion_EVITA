import React from 'react'

export default function Notification({ type = 'info', message }) {
  const styles = {
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    success: 'bg-green-500/10 text-green-300 border-green-500/30',
    warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    error: 'bg-red-500/10 text-red-300 border-red-500/30',
  }
  return (
    <div className={`border rounded-lg px-3 py-2 text-sm ${styles[type]}`}>
      {message}
    </div>
  )
}

