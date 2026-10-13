import React from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { homePathForRole } from '../navigation/nav-config.js'
import { Button } from '../../components/ui/button.js'

/**
 * 404 Not Found, per design frame 19.
 *
 * Centred 640px card with a 112px circular badge on #EFF6FF, a short explanation, and the
 * two designed actions: a primary route home and a secondary history step back.
 */
export const NotFoundView: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="max-w-[640px] mx-auto my-12 rounded-[10px] border border-[#E5E7EB] bg-white p-10">
      <div className="flex justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#EFF6FF]">
          <span className="text-[30px] font-semibold leading-[44px] text-[#2563EB]">404</span>
        </div>
      </div>

      <h1 className="mt-8 text-center text-[28px] font-semibold leading-[41px] text-[#171717]">
        Page not found
      </h1>
      <p className="mx-auto mt-3 max-w-[432px] text-center text-sm leading-5 text-[#737373]">
        The page may have moved, been archived, or the link may be incorrect.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link to={user ? homePathForRole(user.role) : '/login'}>
          <Button size="md">Go to Dashboard</Button>
        </Link>
        <Button variant="secondary" size="md" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  )
}
