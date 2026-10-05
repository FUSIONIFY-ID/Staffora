import type { RequestHandler } from 'express'
import { identityService } from './identity.service.js'
import { generateCsrfToken } from '../../common/auth/csrf.js'
import { sendSuccess, sendCreated, sendNoContent } from '../../common/http/response.js'
import { UnauthorizedError } from '../../common/errors/app-error.js'
import { getParam } from '../../common/http/params.js'

export const identityController = {
  login: (async (req, res, next) => {
    try {
      const { email, password } = req.body
      const user = await identityService.authenticate(email, password)

      // Regenerate session to prevent session fixation (TSD 8.1)
      req.session.regenerate((err) => {
        if (err) return next(err)

        req.session.userId = user.id
        req.session.csrfToken = generateCsrfToken()

        return sendSuccess(res, {
          user,
          csrfToken: req.session.csrfToken,
        })
      })
    } catch (error) {
      next(error)
    }
  }) as RequestHandler,

  logout: ((req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next(err)
      res.clearCookie('staffora.sid')
      return sendNoContent(res)
    })
  }) as RequestHandler,

  getMe: ((req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated.'))
    }
    return sendSuccess(res, req.user)
  }) as RequestHandler,

  getCsrfToken: ((req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated.'))
    }
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken()
    }
    return sendSuccess(res, { csrfToken: req.session.csrfToken })
  }) as RequestHandler,

  listUsers: (async (_req, res, next) => {
    try {
      const users = await identityService.listUsers()
      return sendSuccess(res, users)
    } catch (error) {
      next(error)
    }
  }) as RequestHandler,

  createUser: (async (req, res, next) => {
    try {
      const user = await identityService.createUser({
        ...req.body,
        actorId: req.user?.id,
      })
      return sendCreated(res, user)
    } catch (error) {
      next(error)
    }
  }) as RequestHandler,

  updateUser: (async (req, res, next) => {
    try {
      const user = await identityService.updateUser(getParam(req.params.id), {
        ...req.body,
        actorId: req.user?.id,
      })
      return sendSuccess(res, user)
    } catch (error) {
      next(error)
    }
  }) as RequestHandler,
}
