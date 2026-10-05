import { Router } from 'express'
import { prisma } from '../../common/database/prisma.js'

export const healthRouter = Router()

healthRouter.get('/live', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({
      status: 'ready',
      database: 'connected',
    })
  } catch {
    res.status(503).json({
      status: 'unavailable',
      database: 'disconnected',
    })
  }
})

// Legacy / root health probe
healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})
