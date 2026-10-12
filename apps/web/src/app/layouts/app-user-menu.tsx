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
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-300">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden lg:block text-left">
          <span className="block text-sm font-medium text-slate-200 leading-tight">{displayName}</span>
          <span className="block mt-0.5">
            <Badge variant={ROLE_BADGE[user.role]}>{user.role.replace('_', ' ')}</Badge>
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-xl shadow-black/40 z-50"
        >
          <div className="px-1 pb-3 border-b border-slate-800">
            <div className="text-sm font-medium text-slate-200 truncate">{displayName}</div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
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
