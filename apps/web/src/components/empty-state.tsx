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
    <Card className="p-8 text-center border-dashed border-[#E5E7EB] bg-[#FAFAFA]">
      <div className="max-w-md mx-auto space-y-3">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mx-auto text-xl font-semibold">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-[#171717]">{title}</h3>
        {description && <p className="text-sm text-[#525252]">{description}</p>}
        {action && <div className="pt-2 flex justify-center">{action}</div>}
      </div>
    </Card>
  )
}
