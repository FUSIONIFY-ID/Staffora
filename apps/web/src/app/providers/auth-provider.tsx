/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient, setCachedCsrfToken } from '../../api/client.js'

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'RESOURCE_MANAGER' | 'EMPLOYEE'

export interface UserProfile {
  id: string
  email: string
  role: Role
  isActive: boolean
  employeeId?: string | null
  employee?: {
    id: string
    employeeCode: string
    fullName: string
    workEmail: string
    departmentId: string
    departmentName: string
    jobRoleId: string
    jobRoleTitle: string
  } | null
}

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient<{ data: UserProfile }>('/auth/me')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        const res = await apiClient<{ data: UserProfile }>('/auth/me')
        if (isMounted) setUser(res.data)
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    void init()
    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await apiClient<{ data: { user: UserProfile; csrfToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setCachedCsrfToken(res.data.csrfToken)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setCachedCsrfToken(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
