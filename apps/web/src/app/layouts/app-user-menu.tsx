import React, { useEffect, useRef, useState } from 'react'
import type { UserProfile } from '../providers/auth-provider.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'

export interface AppUserMenuProps {
  user: UserProfile
  onSignOut: () => void
}

const ROLE_BADGE: Readonly<Record<UserProfile['role'], 'purple' | 'blue' | 'amber' | 'green'>> = {
  ADMIN: 'purple',
  PROJECT_MANAGER: 'blue',
  RESOURCE_MANAGER: 'amber',
  EMPLOYEE: 'green',
}

export const AppUserMenu: React.FC<AppUserMenuProps> = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const displayName = user.employee?.fullName || user.email

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[#F5F5F5] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-sm font-semibold text-[#1D4ED8]">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden lg:block text-left">
          <span className="block text-sm font-medium text-[#171717] leading-tight">{displayName}</span>
          <span className="block mt-0.5">
            <Badge variant={ROLE_BADGE[user.role]}>{user.role.replace('_', ' ')}</Badge>
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg z-50"
        >
          <div className="px-1 pb-3 border-b border-[#E5E7EB]">
            <div className="text-sm font-medium text-[#171717] truncate">{displayName}</div>
            <div className="text-xs text-[#737373] truncate">{user.email}</div>
            <div className="mt-2">
              <Badge variant={ROLE_BADGE[user.role]}>{user.role.replace('_', ' ')}</Badge>
            </div>
          </div>
          <div className="pt-3">
            <Button
              variant="outline"
              size="sm"
              role="menuitem"
              className="w-full"
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
