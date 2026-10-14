import React from 'react'
import { Link, useLocation } from 'react-router'
import { buildBreadcrumbs } from '../navigation/breadcrumbs.js'

export interface AppHeaderProps {
  actions?: React.ReactNode
}

/**
 * Top header, per design frame 02: 72px tall, a breadcrumb on the left and the
 * account control on the right.
 *
 * The design also shows a global search field and a notification glyph. Neither
 * is rendered here. A global search needs a query endpoint across people and
 * projects, which no Sprint 1 card provides, and the notification glyph has no
 * data source. Rendering either as an inert control would present non-functional
 * UI as working, which the review checklist forbids. Both are recorded as an
 * open decision in docs/ui-specs/app-shell/qa/round-2/round-2.md.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ actions }) => {
  const { pathname } = useLocation()
  const crumbs = buildBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 h-[72px] shrink-0 flex items-center justify-between gap-4 border-b border-line bg-surface-white px-9">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2 text-sm text-ink-dim truncate">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-2 min-w-0">
                {index > 0 && <span aria-hidden="true">/</span>}
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="hover:text-ink transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={isLast ? 'font-medium text-ink' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  )
}
