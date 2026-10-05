import type { Response } from 'express'

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ data })
}

export function sendCreated<T>(res: Response, data: T) {
  return res.status(201).json({ data })
}

export function sendNoContent(res: Response) {
  return res.status(204).end()
}

export function sendList<T>(
  res: Response,
  data: T[],
  meta: { page: number; pageSize: number; total: number; totalPages?: number },
) {
  const totalPages = meta.totalPages ?? Math.ceil(meta.total / (meta.pageSize || 20))
  return res.status(200).json({
    data,
    meta: {
      page: meta.page,
      pageSize: meta.pageSize,
      total: meta.total,
      totalPages,
    },
  })
}
