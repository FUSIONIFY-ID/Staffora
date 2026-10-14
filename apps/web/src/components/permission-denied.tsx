import React from 'react'
import { useNavigate } from 'react-router'
import type { Role } from '../app/providers/auth-provider.js'
import { Button } from './ui/button.js'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  RESOURCE_MANAGER: 'Resource Manager',
  EMPLOYEE: 'Employee',
}

export interface PermissionDeniedProps {
  role: Role
  homePath: string
  requiredRoles?: readonly Role[]
}

/**
 * 403 Access Denied, per design frame 18.
 *
 * Centred 640px card, a 112px circular badge on the danger surface, a role-context
 * panel, and a primary action back to the role's home. The required-role line is
 * only rendered when the caller knows which roles would have been allowed.
 *
 * The button label follows the destination: for an Employee the home route is My
 * Profile, so the action says so rather than claiming to open a dashboard.
 */
export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  role,
  homePath,
  requiredRoles,
}) => {
  const navigate = useNavigate()
  const homeLabel = homePath === '/my-profile' ? 'Back to My Profile' : 'Back to Dashboard'

  return (
    <div className="max-w-[640px] mx-auto my-12 rounded-[10px] border border-line bg-surface-white p-10">
      <div className="flex justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-danger-surface">
          <span className="text-[30px] font-semibold leading-[44px] text-danger">403</span>
        </div>
      </div>

      <h1 className="mt-8 text-center text-[28px] font-semibold leading-[41px] text-ink">
        Access denied
      </h1>
      <p className="mx-auto mt-3 max-w-[452px] text-center text-sm leading-5 text-ink-muted">
        You don&rsquo;t have permission to access this area with your current Staffora role.
      </p>

      <div className="mx-auto mt-8 flex max-w-[452px] items-center justify-between gap-4 rounded-lg border border-neutral-border bg-neutral-surface px-3.5 py-2.5">
        <div>
          <p className="text-[11px] font-medium leading-4 text-ink-muted">Current role</p>
          <p className="text-[13px] font-semibold leading-[19px] text-ink-soft">
            {ROLE_LABELS[role]}
          </p>
        </div>
        {requiredRoles && requiredRoles.length > 0 ? (
          <p className="text-right text-xs font-medium leading-[17px] text-danger">
            Required: {requiredRoles.map((allowed) => ROLE_LABELS[allowed]).join(' / ')}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="md" onClick={() => navigate(homePath)}>
          {homeLabel}
        </Button>
      </div>
    </div>
  )
}
