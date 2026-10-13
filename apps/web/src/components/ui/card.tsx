import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`rounded-[10px] border border-[#E5E7EB] bg-white p-6 transition-all ${
        glow ? 'hover:border-[#BFDBFE]' : 'hover:border-[#BFDBFE]'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
