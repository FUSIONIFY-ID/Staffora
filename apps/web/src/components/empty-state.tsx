import React from 'react'
import { Card } from './ui/card.js'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  /**
   * Heading level for the title. Defaults to 2 so the component sits directly
   * under the page heading produced by PageHeader, without skipping a level.
   */
  headingLevel?: 2 | 3
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  headingLevel = 2,
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <Card className="p-8 text-center border-dashed border-line bg-surface-table-header">
      <div className="max-w-md mx-auto space-y-3">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-info-surface text-info-text flex items-center justify-center mx-auto text-xl font-semibold">
            {icon}
          </div>
        )}
        <Heading className="text-lg font-semibold text-ink">{title}</Heading>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
        {action && <div className="pt-2 flex justify-center">{action}</div>}
      </div>
    </Card>
  )
}
