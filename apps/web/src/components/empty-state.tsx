import React from 'react'
import { Card } from './ui/card.js'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <Card className="p-8 text-center border-dashed border-slate-800 bg-slate-900/30">
      <div className="max-w-md mx-auto space-y-3">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-xl font-semibold">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-slate-400">{description}</p>}
        {action && <div className="pt-2 flex justify-center">{action}</div>}
      </div>
    </Card>
  )
}
