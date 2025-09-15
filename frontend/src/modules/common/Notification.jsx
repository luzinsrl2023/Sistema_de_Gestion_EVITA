import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function Notification({ notification, onClose }) {
  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getTypeStyles(notification.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-white">{notification.title}</h4>
          <p className="text-sm mt-1">{notification.message}</p>
        </div>
        <button 
          onClick={() => onClose(notification.id)}
          className="ml-4 p-1 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
