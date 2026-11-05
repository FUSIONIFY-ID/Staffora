import type { Prisma, Project } from "../../generated/prisma/client.js";
import { prisma } from "../../common/database/prisma.js";

const listInclude = {
  projectManager: { select: { id: true, fullName: true } },
  _count: {
    select: {
      staffingRequirements: true,
      allocations: { where: { cancelledAt: null } },
    },
  },
} satisfies Prisma.ProjectInclude;

const detailInclude = {
  ...listInclude,
  staffingRequirements: {
    orderBy: { startDate: "asc" },
    include: {
      jobRole: { select: { id: true, name: true } },
      skills: {
        include: { skill: { select: { id: true, name: true } } },
      },
    },
  },
  allocations: {
    orderBy: { startDate: "asc" },
    include: {
      employee: { select: { id: true, employeeCode: true, fullName: true } },
      jobRole: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectListRow = Prisma.ProjectGetPayload<{
  include: typeof listInclude;
}>;
export type ProjectDetailRow = Prisma.ProjectGetPayload<{
  include: typeof detailInclude;
}>;

// Projects are never hard-deleted (BR-G15): no delete method by design.
export const projectsRepository = {
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  },

  async list(
    where: Prisma.ProjectWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ProjectOrderByWithRelationInput[] = [
      { startDate: "desc" },
      { projectCode: "asc" },
    ],
  ): Promise<[ProjectListRow[], number]> {
    return prisma.$transaction([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
        include: listInclude,
      }),
      prisma.project.count({ where }),
    ]);
  },

  async findDetailById(
    id: string,
    scope: Prisma.ProjectWhereInput = {},
  ): Promise<ProjectDetailRow | null> {
    return prisma.project.findFirst({
      where: { AND: [{ id }, scope] },
      include: detailInclude,
    });
  },

  async findByCode(projectCode: string): Promise<Project | null> {
    return prisma.project.findUnique({ where: { projectCode } });
  },

  async create(
    data: Prisma.ProjectUncheckedCreateInput,
  ): Promise<ProjectListRow> {
    return prisma.project.create({ data, include: listInclude });
  },

  async update(
    id: string,
    data: Prisma.ProjectUncheckedUpdateInput,
  ): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  /** Manager lookup for create/update validation (status + linked user role). */
  async findEmployeeById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        status: true,
        user: { select: { id: true, role: true, isActive: true } },
      },
    });
  },

  /** Earliest start / latest end of non-cancelled allocations and staffing requirements. */
  async findChildDateBounds(projectId: string) {
    const [alloc, staffing] = await prisma.$transaction([
      prisma.allocation.aggregate({
        where: { projectId, cancelledAt: null },
        _min: { startDate: true },
        _max: { endDate: true },
      }),
      prisma.staffingRequirement.aggregate({
        where: { projectId },
        _min: { startDate: true },
        _max: { endDate: true },
      }),
    ]);
    return {
      allocations: {
        minStart: alloc._min.startDate,
        maxEnd: alloc._max.endDate,
      },
      staffingRequirements: {
        minStart: staffing._min.startDate,
        maxEnd: staffing._max.endDate,
      },
    };
  },
};
