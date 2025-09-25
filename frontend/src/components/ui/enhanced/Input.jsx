import React from 'react'
import { cn } from '../../../lib/utils'

const Input = React.forwardRef(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  required = false,
  ...props
}, ref) => {
  const inputId = React.useId()
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">
            <LeftIcon className="h-4 w-4" />
          </div>
        )}
        
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={cn(
            'input focus-ring',
            LeftIcon && 'pl-10',
            RightIcon && 'pr-10',
            error && 'border-error focus:border-error focus:shadow-error',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {RightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted">
            <RightIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-xs text-error">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-2 text-xs text-muted">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input