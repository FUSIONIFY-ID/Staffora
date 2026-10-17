import React from 'react'
import { Link } from 'react-router'
import { Button } from '../ui/button.js'

export interface NotFoundStateProps {
  title?: string
  message?: string
  returnPath?: string
  className?: string
}

export const NotFoundState: React.FC<NotFoundStateProps> = ({
  title = '404 - Page Not Found',
  message = 'The page or resource you requested could not be located.',
  returnPath = '/',
  className = '',
}) => {
  return (
    <div
      className={`min-h-[50vh] flex flex-col items-center justify-center p-8 text-center ${className}`}
      data-testid="not-found-state"
    >
      <div className="text-6xl font-extrabold text-blue-500/80 mb-4 tracking-tight">404</div>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">{title}</h2>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">{message}</p>
      <Link to={returnPath}>
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  )
}
