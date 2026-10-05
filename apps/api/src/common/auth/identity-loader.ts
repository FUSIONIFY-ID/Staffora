import type { RequestHandler } from 'express'
import { prisma } from '../database/prisma.js'

export const identityLoaderMiddleware: RequestHandler = async (req, _res, next) => {
  const userId = req.session?.userId

  if (!userId) {
    return next()
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true,
            jobRole: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      // Inactive user or user not found - destroy session
      req.session.destroy(() => {})
      return next()
    }

    req.user = {
      id: user.id,
      email: user.normalizedEmail,
      role: user.role,
      isActive: user.isActive,
      employeeId: user.employeeId,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            fullName: user.employee.fullName,
            workEmail: user.employee.workEmail,
            departmentId: user.employee.departmentId,
            departmentName: user.employee.department.name,
            jobRoleId: user.employee.jobRoleId,
            jobRoleTitle: user.employee.jobRole.name,
          }
        : null,
    }

    next()
  } catch (error) {
    next(error)
  }
}
