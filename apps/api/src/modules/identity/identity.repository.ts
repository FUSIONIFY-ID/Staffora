import type { Prisma, User, Employee } from "../../generated/prisma/client.js";
import { prisma } from "../../common/database/prisma.js";
import type { Role } from "../../common/auth/types.js";

export type UserWithEmployee = Prisma.UserGetPayload<{
  include: {
    employee: {
      include: {
        department: true;
        jobRole: true;
      };
    };
  };
}>;

export const identityRepository = {
  findByNormalizedEmail(email: string): Promise<UserWithEmployee | null> {
    return prisma.user.findUnique({
      where: { normalizedEmail: email.trim().toLowerCase() },
      include: {
        employee: {
          include: {
            department: true,
            jobRole: true,
          },
        },
      },
    });
  },

  findById(id: string): Promise<UserWithEmployee | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            jobRole: true,
          },
        },
      },
    });
  },

  findAll(): Promise<UserWithEmployee[]> {
    return prisma.user.findMany({
      include: {
        employee: {
          include: {
            department: true,
            jobRole: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  createUser(data: {
    normalizedEmail: string;
    passwordHash: string;
    role: Role;
    employeeId?: string;
    createdBy?: string;
  }): Promise<UserWithEmployee> {
    return prisma.user.create({
      data: {
        normalizedEmail: data.normalizedEmail.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        employeeId: data.employeeId,
        createdBy: data.createdBy,
      },
      include: {
        employee: {
          include: {
            department: true,
            jobRole: true,
          },
        },
      },
    });
  },

  updateUser(
    id: string,
    data: {
      role?: Role;
      isActive?: boolean;
      employeeId?: string | null;
      updatedBy?: string;
    },
  ): Promise<UserWithEmployee> {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.employeeId !== undefined && { employeeId: data.employeeId }),
        ...(data.updatedBy && { updatedBy: data.updatedBy }),
      },
      include: {
        employee: {
          include: {
            department: true,
            jobRole: true,
          },
        },
      },
    });
  },

  findEmployeeById(employeeId: string): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: { id: employeeId },
    });
  },

  findByEmployeeId(employeeId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { employeeId },
    });
  },
};
