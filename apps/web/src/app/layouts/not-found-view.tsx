import React from 'react'
import { Link } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { homePathForRole } from '../navigation/nav-config.js'
import { PageHeader } from '../../components/page-header.js'
import { EmptyState } from '../../components/empty-state.js'
import { Button } from '../../components/ui/button.js'

export const NotFoundView: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page not found"
        description="The page you requested does not exist, or it has moved elsewhere in Staffora."
      />
      <EmptyState
        title="Nothing to show here"
        description="Check the address you entered, or return to a page your role can access."
        icon="404"
        action={
          user ? (
            <Link to={homePathForRole(user.role)}>
              <Button size="sm">Back to home</Button>
            </Link>
          ) : undefined
        }
      />
    </div>
  )
}
