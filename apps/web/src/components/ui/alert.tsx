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
    info: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]',
    success: 'bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]',
    warning: 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]',
    error: 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]',
  }[type]

  return (
    <div className={`rounded-xl border p-4 text-sm ${styles} ${className}`} role="alert">
      {title && <h5 className="font-semibold mb-1">{title}</h5>}
      <div className="opacity-90">{children}</div>
    </div>
  )
}
