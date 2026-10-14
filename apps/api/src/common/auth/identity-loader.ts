import type { RequestHandler } from 'express'
import { identityService } from '../../modules/identity/identity.service.js'
import { regenerateSession } from './session.js'

export const identityLoaderMiddleware: RequestHandler = async (req, _res, next) => {
  const userId = req.session?.userId

  if (!userId) {
    return next()
  }

  try {
    const user = await identityService.resolveSessionUser(userId)

    if (!user) {
      // AC02.05 - Deactivated or deleted accounts lose their session on the next request.
      // Regenerate rather than destroy: downstream handlers (login) require req.session to exist.
      await regenerateSession(req)
      return next()
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
