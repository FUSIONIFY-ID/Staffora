import type { Role } from './providers/auth-provider.js'

/**
 * Human-readable role names, shared by every screen that shows a role.
 *
 * Kept in one place so the 403 card, the user menu and the sidebar cannot drift
 * apart. Values follow the design: frame 02 labels the signed-in Admin as
 * "Admin", and frame 18 writes "Required: Admin / Resource Manager".
 */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  RESOURCE_MANAGER: 'Resource Manager',
  EMPLOYEE: 'Employee',
}

/**
 * Initials for an avatar, one letter per word: "Arya Isnaidi" becomes "AI", as
 * in design frame 02. Two letters are taken from the first word only when the
 * name is a single word, and "?" is returned when there is no letter to take.
 *
 * `charAt` is used rather than indexing, because indexing a string returns
 * `string | undefined` under `noUncheckedIndexedAccess` and would need a
 * non-null assertion, which CODING_STANDARD 2.2 forbids.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 0)
  const first = words[0]
  const last = words.at(-1)

  if (first === undefined || last === undefined) return '?'
  if (words.length === 1) return first.slice(0, 2).toUpperCase()
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}
