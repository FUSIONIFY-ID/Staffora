import React from 'react'
import { Alert } from '../ui/alert.js'

export interface ErrorStateProps {
  title?: string
  message?: string
  code?: string
  requestId?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An unexpected error occurred',
  message = 'We encountered an issue communicating with the server. Please try again.',
  code,
  requestId,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-2xl mx-auto my-6 ${className}`} data-testid="error-state">
      <Alert type="error">
        <div className="font-semibold text-base mb-1">{title}</div>
        <p className="text-sm leading-relaxed mb-3">{message}</p>
        {(code || requestId) && (
          <div className="flex flex-wrap gap-4 text-xs font-mono text-red-300/80 pt-2 border-t border-red-500/20">
            {code && <span>Code: {code}</span>}
            {requestId && <span>Request ID: {requestId}</span>}
          </div>
        )}
      </Alert>
      {onRetry && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onRetry}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-colors cursor-pointer"
          >
            Retry Request
          </button>
        </div>
      )}
    </div>
  )
}
