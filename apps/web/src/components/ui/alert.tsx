import React from 'react'

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
  }[type]

  return (
    <div className={`rounded-xl border p-4 text-sm ${styles} ${className}`} role="alert">
      {title && <h5 className="font-semibold mb-1">{title}</h5>}
      <div className="opacity-90">{children}</div>
    </div>
  )
}
