import { identityRepository } from './identity.repository.js'
import { hashPassword, verifyPassword } from '../../common/auth/password.js'
import { UnauthorizedError, ConflictError, NotFoundError } from '../../common/errors/app-error.js'
import type { Role, AuthenticatedUser } from '../../common/auth/types.js'

export const identityService = {
  async authenticate(email: string, plainTextPassword: string): Promise<AuthenticatedUser> {
    const user = await identityRepository.findByNormalizedEmail(email)

    // BR02 - Authentication errors must not expose credential validation details
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.')
    }

    const isMatch = await verifyPassword(plainTextPassword, user.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.')
    }

    // AC02.05 - An inactive user account must not be allowed to sign in
    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive.')
    }

    return {
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
  },

  async createUser(input: {
    email: string
    password: string
    role: Role
    employeeId?: string
    actorId?: string
  }) {
    const existing = await identityRepository.findByNormalizedEmail(input.email)
    if (existing) {
      throw new ConflictError('A user with this email already exists.')
    }

    const passwordHash = await hashPassword(input.password)
    const user = await identityRepository.createUser({
      normalizedEmail: input.email,
      passwordHash,
      role: input.role,
      employeeId: input.employeeId,
      createdBy: input.actorId,
    })

    return {
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
  },

  async updateUser(
    id: string,
    input: {
      role?: Role
      isActive?: boolean
      employeeId?: string | null
      actorId?: string
    },
  ) {
    const existing = await identityRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('User not found.')
    }

    const user = await identityRepository.updateUser(id, {
      ...input,
      updatedBy: input.actorId,
    })

    return {
      id: user.id,
      email: user.normalizedEmail,
      role: user.role,
      isActive: user.isActive,
      employeeId: user.employeeId,
    }
  },

  async listUsers() {
    const users = await identityRepository.findAll()
    return users.map((u) => ({
      id: u.id,
      email: u.normalizedEmail,
      role: u.role,
      isActive: u.isActive,
      employeeId: u.employeeId,
      employeeName: u.employee?.fullName,
      createdAt: u.createdAt,
    }))
  },
}
