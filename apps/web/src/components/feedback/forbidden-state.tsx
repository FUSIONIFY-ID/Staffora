import React from 'react'
import { Link } from 'react-router'
import { Alert } from '../ui/alert.js'
import type { Role } from '../../constants/roles.js'

export interface ForbiddenStateProps {
  userRole?: Role
  returnPath?: string
  className?: string
}

export const ForbiddenState: React.FC<ForbiddenStateProps> = ({
  userRole,
  returnPath,
  className = '',
}) => {
  const defaultReturn = userRole === 'EMPLOYEE' ? '/my-profile' : '/dashboard'
  const targetPath = returnPath || defaultReturn

  return (
    <div className={`max-w-xl mx-auto my-12 p-6 ${className}`} data-testid="forbidden-state">
      <Alert type="error" className="mb-6">
        <div className="font-bold text-base mb-1">403 - Forbidden Access</div>
        <p className="text-sm leading-relaxed">
          Your current account role {userRole ? (<span className="font-semibold text-slate-200">({userRole})</span>) : null} does not have authorization
          to view or operate this capability. Direct URL navigation to unauthorized endpoints is restricted
          per Staffora Security Baseline.
        </p>
      </Alert>
      <div className="flex justify-center">
        <Link
          to={targetPath}
          className="text-sm font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
        >
          &larr; Return to accessible home
        </Link>
      </div>
    </div>
  )
}
