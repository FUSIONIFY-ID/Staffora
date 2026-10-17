/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { onUnauthorized, setCachedCsrfToken } from '../../api/client.js'
import {
  AUTH_ME_QUERY_KEY,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
} from '../../features/auth/api.js'
import type { Role } from '../../constants/roles.js'
import type { UserProfile } from '../../types/auth.js'

export type { Role, UserProfile }

export interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Drops every cached server response from the previous session so the next user
 * never sees stale data, then marks the session as signed out.
 */
function clearSession(queryClient: QueryClient): void {
  setCachedCsrfToken(null)
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== AUTH_ME_QUERY_KEY[0] })
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, null)
}

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const queryClient = useQueryClient()
  const meQuery = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: Infinity,
  })

  // 401 recovery: any request that loses the session signs the user out in-app.
  useEffect(() => onUnauthorized(() => clearSession(queryClient)), [queryClient])

  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      const result = await loginRequest(email, password)
      setCachedCsrfToken(result.csrfToken)
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, result.user)
      return result.user
    },
    [queryClient],
  )

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest()
    } finally {
      clearSession(queryClient)
    }
  }, [queryClient])

  const refresh = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
  }, [queryClient])

  const value = useMemo<AuthContextType>(
    () => ({ user: meQuery.data ?? null, isLoading: meQuery.isPending, login, logout, refresh }),
    [meQuery.data, meQuery.isPending, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
