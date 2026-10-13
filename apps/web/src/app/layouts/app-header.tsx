import React from 'react'
import { Link, useLocation } from 'react-router'
import { buildBreadcrumbs } from '../navigation/breadcrumbs.js'

export const AppHeader: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
  const { pathname } = useLocation()
  const crumbs = buildBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-9">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2 text-sm text-[#737373] truncate">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-2 min-w-0">
                {index > 0 && <span aria-hidden="true">/</span>}
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="hover:text-[#171717] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={isLast ? 'font-medium text-[#171717]' : undefined}
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
