import React from 'react'
import { Link } from 'react-router'
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
 * Centred 640px card, a 112px circular badge on #FEF2F2, a role-context panel on #F8FAFC,
 * and a primary action back to the role's home. The required-role line is only rendered
 * when the caller knows which roles would have been allowed.
 */
export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  role,
  homePath,
  requiredRoles,
}) => {
  return (
    <div className="max-w-[640px] mx-auto my-12 rounded-[10px] border border-[#E5E7EB] bg-white p-10">
      <div className="flex justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#FEF2F2]">
          <span className="text-[30px] font-semibold leading-[44px] text-[#DC2626]">403</span>
        </div>
      </div>

      <h1 className="mt-8 text-center text-[28px] font-semibold leading-[41px] text-[#171717]">
        Access denied
      </h1>
      <p className="mx-auto mt-3 max-w-[452px] text-center text-sm leading-5 text-[#737373]">
        You don&rsquo;t have permission to access this area with your current Staffora role.
      </p>

      <div className="mx-auto mt-8 flex max-w-[452px] items-center justify-between gap-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5">
        <div>
          <p className="text-[11px] font-medium leading-4 text-[#A3A3A3]">Current role</p>
          <p className="text-[13px] font-semibold leading-[19px] text-[#404040]">
            {ROLE_LABELS[role]}
          </p>
        </div>
        {requiredRoles && requiredRoles.length > 0 ? (
          <p className="text-right text-xs font-medium leading-[17px] text-[#DC2626]">
            Required: {requiredRoles.map((allowed) => ROLE_LABELS[allowed]).join(' / ')}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex justify-center">
        <Link to={homePath}>
          <Button size="md">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
