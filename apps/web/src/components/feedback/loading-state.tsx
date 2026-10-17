import React from 'react'
import { Spinner } from '../ui/spinner.js'

export interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  fullScreen = false,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 gap-3 text-center ${
        fullScreen ? 'min-h-[60vh]' : 'min-h-[200px]'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  )
}
