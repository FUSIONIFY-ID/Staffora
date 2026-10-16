import type { RequestHandler } from 'express'
import { identityService } from './identity.service.js'
import type { LoginInput } from './identity.schema.js'
import {
  clearSessionCookie,
  destroySession,
  ensureCsrfToken,
  establishSession,
} from '../../common/auth/session.js'
import { sendSuccess, sendCreated, sendNoContent } from '../../common/http/response.js'
import { UnauthorizedError } from '../../common/errors/app-error.js'
import { getParam } from '../../common/http/params.js'

// Every handler carries the RequestHandler type on its declaration, so no cast is needed
// (CODING_STANDARD 2.2). Responses are sent as statements because a request handler
// returns void, not the Response object that the send helpers return.

const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password }: LoginInput = req.body
    const user = await identityService.authenticate(email, password)
    const csrfToken = await establishSession(req, user.id)
    sendSuccess(res, { user, csrfToken })
  } catch (error) {
    next(error)
  }
}

const logout: RequestHandler = async (req, res, next) => {
  try {
    // Destroying the session deletes its user_sessions row, revoking the cookie server-side
    await destroySession(req)
    clearSessionCookie(res)
    sendNoContent(res)
  } catch (error) {
    next(error)
  }
}

const getMe: RequestHandler = (req, res, next) => {
  if (!req.user) {
    next(new UnauthorizedError('Not authenticated.'))
    return
  }
  sendSuccess(res, req.user)
}

const getCsrfToken: RequestHandler = (req, res) => {
  sendSuccess(res, { csrfToken: ensureCsrfToken(req) })
}

const listUsers: RequestHandler = async (_req, res, next) => {
  try {
    const users = await identityService.listUsers()
    sendSuccess(res, users)
  } catch (error) {
    next(error)
  }
}

const createUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await identityService.createUser({
      ...req.body,
      actorId: req.user?.id,
    })
    sendCreated(res, user)
  } catch (error) {
    next(error)
  }
}

const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await identityService.updateUser(getParam(req.params.id), {
      ...req.body,
      actorId: req.user?.id,
    })
    sendSuccess(res, user)
  } catch (error) {
    next(error)
  }
}

export const identityController = {
  login,
  logout,
  getMe,
  getCsrfToken,
  listUsers,
  createUser,
  updateUser,
}
