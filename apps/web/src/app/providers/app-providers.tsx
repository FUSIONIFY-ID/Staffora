import type { ReactNode } from 'react'
import { QueryProvider } from './query-provider.js'
import { AuthProvider } from './auth-provider.js'

export interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  )
}
