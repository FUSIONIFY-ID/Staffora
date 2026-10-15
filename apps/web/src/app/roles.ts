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
 * name is a single word.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 0)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[words.length - 1]![0] ?? ''}`.toUpperCase()
}
