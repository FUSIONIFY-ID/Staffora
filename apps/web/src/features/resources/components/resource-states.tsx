import React from 'react'
import { Alert } from '../../../components/ui/alert.js'
import { Button } from '../../../components/ui/button.js'
import { Spinner } from '../../../components/ui/spinner.js'

/**
 * Shared non-happy-path surfaces for the resources feature.
 *
 * Each state lives here rather than inside a page so the list and the detail
 * page present identical wording, spacing and retry behaviour, and so the
 * component tests can exercise them without mounting a full page.
 */

export const ResourceLoadingState: React.FC<{ label?: string }> = ({
  label = 'Loading resources...',
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
    <Spinner size="lg" />
    <p className="text-sm text-slate-400">{label}</p>
  </div>
)

export interface ResourceErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  isRetrying?: boolean
}

export const ResourceErrorState: React.FC<ResourceErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  isRetrying = false,
}) => (
  <div className="py-8">
    <Alert type="error" title={title}>
      <p className="mb-3">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} isLoading={isRetrying}>
          Try again
        </Button>
      )}
    </Alert>
  </div>
)

export interface ResourceEmptyStateProps {
  title: string
  description: string
  onReset?: () => void
  resetLabel?: string
}

export const ResourceEmptyState: React.FC<ResourceEmptyStateProps> = ({
  title,
  description,
  onReset,
  resetLabel = 'Clear filters',
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center" role="status">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 text-xl" aria-hidden="true">
      🔍
    </div>
    <h3 className="text-base font-semibold text-slate-200">{title}</h3>
    <p className="max-w-md text-sm text-slate-400">{description}</p>
    {onReset && (
      <Button type="button" variant="outline" size="sm" onClick={onReset} className="mt-1">
        {resetLabel}
      </Button>
    )}
  </div>
)

/**
 * Read-only notice shown to roles that can browse but not modify resources.
 * Rendered as a quiet inline hint rather than a 403 block, because these roles
 * are legitimately allowed to view the directory.
 */
export const ResourceReadOnlyNotice: React.FC<{ role: string }> = ({ role }) => (
  <p className="text-xs text-slate-500">
    You are signed in as <span className="font-semibold text-slate-400">{role}</span>. Resource
    records are read-only for this role.
  </p>
)
