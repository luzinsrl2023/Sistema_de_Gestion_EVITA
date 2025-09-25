import React from 'react'
import { cn } from '../../../lib/utils'

const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}, ref) => {
  const baseClasses = 'btn focus-ring transition-fast'
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    success: 'btn-success',
    info: 'btn-info',
    warning: 'btn-warning',
    danger: 'btn-danger'
  }
  
  const sizes = {
    sm: 'btn-sm',
    default: '',
    lg: 'btn-lg'
  }

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && 'opacity-75 cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
            className="opacity-25"
          />
          <path 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          />
        </svg>
      )}
      {!loading && LeftIcon && <LeftIcon className="h-4 w-4" />}
      {children}
      {!loading && RightIcon && <RightIcon className="h-4 w-4" />}
    </button>
  )
})

Button.displayName = 'Button'

export default Button