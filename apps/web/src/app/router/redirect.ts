/** Router state set by ProtectedRoute when it sends a signed-out user to /login. */
export interface LoginRedirectState {
  from: string;
}

/**
 * Accepts only same-origin app paths, so `from` cannot send the user to another site.
 * Paths that start with /login are refused to avoid a redirect loop.
 */
export function isSafeRedirectPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/\\") &&
    !path.startsWith("/login")
  );
}

export function readRedirectFrom(state: unknown): string | null {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return null;
  }
  const { from } = state;
  return isSafeRedirectPath(from) ? from : null;
}
