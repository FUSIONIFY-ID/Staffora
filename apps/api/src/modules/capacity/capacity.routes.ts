import { Router } from 'express'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'
import { sendSuccess } from '../../common/http/response.js'

export const capacityRouter = Router()

capacityRouter.use(requireAuth())

capacityRouter.get('/', requireRole('ADMIN', 'RESOURCE_MANAGER', 'PROJECT_MANAGER'), async (_req, res, next) => {
  try {
    // TODO: Implement capacity timeline query in Sprint (PIC: Saiful & Jundy)
    return sendSuccess(res, [])
  } catch (err) {
    next(err)
  }
})

capacityRouter.get('/employees/:id', async (req, res, next) => {
  try {
    // TODO: Implement single employee capacity timeline in Sprint (PIC: Saiful & Jundy)
    return sendSuccess(res, {
      employeeId: req.params.id,
      timeline: [],
    })
  } catch (err) {
    next(err)
  }
})
