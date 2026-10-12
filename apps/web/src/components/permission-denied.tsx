import React from 'react'
import { Link } from 'react-router'
import type { Role } from '../app/providers/auth-provider.js'
import { Alert } from './ui/alert.js'

export interface PermissionDeniedProps {
  role: Role
  homePath: string
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({ role, homePath }) => {
  return (
    <div className="max-w-xl mx-auto my-12">
      <Alert type="error" title="403 - Forbidden Access">
        <p className="leading-relaxed">
          Your role (<span className="font-semibold">{role}</span>) does not have authorization to view
          or operate this capability. Direct URL navigation to unauthorized endpoints is restricted per
          Staffora Security Baseline.
        </p>
      </Alert>
      <div className="mt-6 flex justify-center">
        <Link
          to={homePath}
          className="text-sm font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
        >
          &larr; Return to accessible home
        </Link>
      </div>
    </div>
  )
}
