import type { Prisma } from "../../generated/prisma/client.js";
import { ROLES, type AuthenticatedUser } from "../../common/auth/types.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../common/errors/app-error.js";
import {
  conflictError,
  mapUniqueViolation,
} from "../../common/errors/unique-violation.js";
import { projectsRepository } from "./projects.repository.js";
import { projectsPolicy } from "./projects.policy.js";
import {
  ALLOWED_CREATE_STATUSES,
  assertTransition,
} from "./projects.lifecycle.js";
import {
  toDateOnly,
  toDbDate,
  toProjectDetailDto,
  toProjectDto,
  type ProjectDetailDto,
  type ProjectDto,
} from "./projects.mapper.js";
import { PROJECT_CODE_DUPLICATE, PROJECT_UNIQUE } from "./projects.errors.js";
import type {
  CreateProjectInput,
  QueryProjectsInput,
  UpdateProjectInput,
} from "./projects.schema.js";

const NOT_FOUND = "Project not found.";

/** Manager must exist, be ACTIVE, and be linked to an active PROJECT_MANAGER user (422). */
async function assertValidManager(employeeId: string): Promise<void> {
  const emp = await projectsRepository.findEmployeeById(employeeId);
  const invalid = (msg: string): ValidationError =>
    new ValidationError("Validation failed.", {
      projectManagerEmployeeId: [msg],
    });
  if (!emp) throw invalid("Project manager employee does not exist.");
  if (emp.status !== "ACTIVE") {
    throw invalid("Project manager employee must be ACTIVE.");
  }
  if (
    !emp.user ||
    !emp.user.isActive ||
    emp.user.role !== ROLES.PROJECT_MANAGER
  ) {
    throw invalid(
      "Project manager must be linked to an active PROJECT_MANAGER user.",
    );
  }
}

function assertInclusivePeriod(startDate: string, endDate: string): void {
  if (endDate < startDate) {
    throw new ValidationError("Validation failed.", {
      endDate: ["End date must be on or after start date."],
    });
  }
}

/** Blocks shrinking the period so that existing children fall outside it (409). */
async function assertPeriodCoversChildren(
  projectId: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  const bounds = await projectsRepository.findChildDateBounds(projectId);
  for (const [kind, b] of Object.entries(bounds)) {
    const minStart = b.minStart ? toDateOnly(b.minStart) : null;
    const maxEnd = b.maxEnd ? toDateOnly(b.maxEnd) : null;
    if ((minStart && minStart < startDate) || (maxEnd && maxEnd > endDate)) {
      throw new ConflictError(
        `Project period would exclude existing ${kind}.`,
        "PERIOD_CONFLICT",
        { kind, requiredStartDate: minStart, requiredEndDate: maxEnd },
      );
    }
  }
}

export const projectsService = {
  async getProjects(
    query: QueryProjectsInput,
    user: AuthenticatedUser,
  ): Promise<{
    data: ProjectDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const filters: Prisma.ProjectWhereInput[] = [
      projectsPolicy.scopeWhere(user),
    ];
    if (query.status) filters.push({ status: query.status });
    if (query.projectManagerEmployeeId) {
      filters.push({
        projectManagerEmployeeId: query.projectManagerEmployeeId,
      });
    }
    const search = query.search?.trim();
    if (search) {
      filters.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { projectCode: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    const [rows, total] = await projectsRepository.list(
      { AND: filters },
      (query.page - 1) * query.pageSize,
      query.pageSize,
    );
    return {
      data: rows.map(toProjectDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async createProject(
    data: CreateProjectInput,
    user: AuthenticatedUser,
  ): Promise<ProjectDto> {
    if (!projectsPolicy.canCreate(user)) {
      throw new ForbiddenError(
        "You do not have permission to create projects.",
      );
    }
    if (
      user.role === ROLES.PROJECT_MANAGER &&
      data.projectManagerEmployeeId !== user.employeeId
    ) {
      throw new ForbiddenError(
        "Project Managers can only create projects they manage.",
      );
    }
    if (!ALLOWED_CREATE_STATUSES.includes(data.status)) {
      throw new ValidationError("Validation failed.", {
        status: [
          `Status must be one of ${ALLOWED_CREATE_STATUSES.join(", ")}.`,
        ],
      });
    }
    assertInclusivePeriod(data.startDate, data.endDate);
    await assertValidManager(data.projectManagerEmployeeId);
    if (await projectsRepository.findByCode(data.projectCode)) {
      throw conflictError(PROJECT_CODE_DUPLICATE);
    }

    try {
      const created = await projectsRepository.create({
        projectCode: data.projectCode,
        name: data.name,
        projectManagerEmployeeId: data.projectManagerEmployeeId,
        startDate: toDbDate(data.startDate),
        endDate: toDbDate(data.endDate),
        status: data.status,
        createdBy: user.id,
        updatedBy: user.id,
      });
      return toProjectDto(created);
    } catch (err) {
      return mapUniqueViolation(err, PROJECT_UNIQUE, PROJECT_CODE_DUPLICATE);
    }
  },

  async getProjectDetail(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ProjectDetailDto> {
    // Out-of-scope is reported as 404 (non-disclosure). Completed/Archived stay readable.
    const row = await projectsRepository.findDetailById(
      id,
      projectsPolicy.scopeWhere(user),
    );
    if (!row) throw new NotFoundError(NOT_FOUND);
    return toProjectDetailDto(row);
  },

  async updateProject(
    id: string,
    data: UpdateProjectInput,
    user: AuthenticatedUser,
  ): Promise<ProjectDetailDto> {
    const project = await projectsRepository.findById(id);
    if (!project) throw new NotFoundError(NOT_FOUND);
    projectsPolicy.assertCanUpdate(user, project.projectManagerEmployeeId);

    if (project.status === "ARCHIVED") {
      throw new ConflictError(
        "Archived projects are read-only.",
        "PROJECT_ARCHIVED",
        { projectId: id },
      );
    }

    const startDate = data.startDate ?? toDateOnly(project.startDate);
    const endDate = data.endDate ?? toDateOnly(project.endDate);
    assertInclusivePeriod(startDate, endDate);

    if (data.status) assertTransition(project.status, data.status);

    const pmChanged =
      data.projectManagerEmployeeId !== undefined &&
      data.projectManagerEmployeeId !== project.projectManagerEmployeeId;
    if (pmChanged) {
      if (user.role !== ROLES.ADMIN) {
        throw new ForbiddenError("Only Admin can change the project manager.");
      }
      await assertValidManager(data.projectManagerEmployeeId as string);
    }

    if (data.startDate !== undefined || data.endDate !== undefined) {
      await assertPeriodCoversChildren(id, startDate, endDate);
    }

    await projectsRepository.update(id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(pmChanged
        ? { projectManagerEmployeeId: data.projectManagerEmployeeId }
        : {}),
      ...(data.startDate !== undefined
        ? { startDate: toDbDate(startDate) }
        : {}),
      ...(data.endDate !== undefined ? { endDate: toDbDate(endDate) } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedBy: user.id,
    });

    const row = await projectsRepository.findDetailById(id);
    if (!row) throw new NotFoundError(NOT_FOUND);
    return toProjectDetailDto(row);
  },
};
