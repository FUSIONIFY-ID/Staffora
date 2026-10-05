import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-6 transition-all ${
        glow ? 'shadow-lg shadow-blue-500/5 hover:border-blue-500/40' : 'hover:border-slate-700/80'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
