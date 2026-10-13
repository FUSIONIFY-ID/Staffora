import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'blue', className = '' }) => {
  const variantStyles = {
    blue: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    green: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    amber: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    red: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    purple: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    gray: 'bg-[#F5F5F5] text-[#525252] border-[#E5E7EB]',
  }[variant]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  )
}
