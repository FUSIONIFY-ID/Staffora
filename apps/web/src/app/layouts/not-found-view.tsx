import React from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/button.js'

/**
 * 404 Not Found, per design frame 19.
 *
 * Centred 640px card with a 112px circular badge on the info surface. The two
 * designed actions are a primary route home and a secondary history step back.
 *
 * The primary action says "Go to Home" rather than "Go to Dashboard" because the
 * route it opens depends on the role: an Employee lands on My Profile, not on the
 * dashboard.
 *
 * "Go Back" falls back to the home route when there is no history to step back
 * to, which is the case when the address was opened directly.
 */
export const NotFoundView: React.FC = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  return (
    <div className="max-w-[640px] mx-auto my-12 rounded-[10px] border border-line bg-surface-white p-10">
      <div className="flex justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-info-surface">
          <span className="text-[30px] font-semibold leading-[44px] text-primary">404</span>
        </div>
      </div>

      <h1 className="mt-8 text-center text-[28px] font-semibold leading-[41px] text-ink">
        Page not found
      </h1>
      <p className="mx-auto mt-3 max-w-[432px] text-center text-sm leading-5 text-ink-muted">
        The page may have moved, been archived, or the link may be incorrect.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Button size="md" onClick={() => navigate('/')}>
          Go to Home
        </Button>
        <Button variant="secondary" size="md" onClick={handleGoBack}>
          Go Back
        </Button>
      </div>
    </div>
  )
}
