import { describe, it, expect } from 'vitest'
import { hasRole, hasAnyRole, canAccess } from '../src/lib/rbac.js'
import type { UserProfile } from '../src/types/auth.js'

describe('RBAC utilities', () => {
  const adminUser: UserProfile = {
    id: '1',
    email: 'admin@staffora.internal',
    role: 'ADMIN',
    isActive: true,
  }

  const employeeUser: UserProfile = {
    id: '2',
    email: 'emp@staffora.internal',
    role: 'EMPLOYEE',
    isActive: true,
  }

  const inactiveUser: UserProfile = {
    id: '3',
    email: 'inactive@staffora.internal',
    role: 'ADMIN',
    isActive: false,
  }

  describe('hasRole', () => {
    it('returns true when user has the exact active role', () => {
      expect(hasRole(adminUser, 'ADMIN')).toBe(true)
      expect(hasRole(employeeUser, 'EMPLOYEE')).toBe(true)
    })

    it('returns false when role does not match', () => {
      expect(hasRole(adminUser, 'EMPLOYEE')).toBe(false)
      expect(hasRole(employeeUser, 'ADMIN')).toBe(false)
    })

    it('returns false when user is inactive or null', () => {
      expect(hasRole(inactiveUser, 'ADMIN')).toBe(false)
      expect(hasRole(null, 'ADMIN')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('returns true if role is within allowed roles', () => {
      expect(hasAnyRole(adminUser, ['ADMIN', 'PROJECT_MANAGER'])).toBe(true)
    })

    it('returns false if role is outside allowed roles', () => {
      expect(hasAnyRole(employeeUser, ['ADMIN', 'PROJECT_MANAGER'])).toBe(false)
    })

    it('returns false when user is null', () => {
      expect(hasAnyRole(null, ['ADMIN'])).toBe(false)
    })
  })

  describe('canAccess', () => {
    it('allows access to all authenticated active users when no roles specified', () => {
      expect(canAccess(employeeUser)).toBe(true)
      expect(canAccess(adminUser, [])).toBe(true)
    })

    it('checks roles when allowedRoles provided', () => {
      expect(canAccess(employeeUser, ['EMPLOYEE'])).toBe(true)
      expect(canAccess(employeeUser, ['ADMIN'])).toBe(false)
    })

    it('blocks inactive user', () => {
      expect(canAccess(inactiveUser)).toBe(false)
    })
  })
})
