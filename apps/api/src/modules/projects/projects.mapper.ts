import type { ProjectStatus } from "../../generated/prisma/client.js";
import type {
  ProjectDetailRow,
  ProjectListRow,
} from "./projects.repository.js";

export interface ProjectDto {
  id: string;
  projectCode: string;
  name: string;
  projectManagerEmployeeId: string;
  projectManagerName: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  staffingRequirementCount: number;
  allocatedResourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStaffingRequirementDto {
  id: string;
  jobRoleId: string;
  jobRoleName: string;
  headcount: number;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  skills: {
    skillId: string;
    skillName: string;
    minimumProficiencyLevel: number;
  }[];
}

export interface ProjectAllocationDto {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  jobRoleId: string;
  jobRoleName: string;
  staffingRequirementId: string | null;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  cancelledAt: string | null;
}

export interface ProjectDetailDto extends ProjectDto {
  staffingRequirements: ProjectStaffingRequirementDto[];
  allocations: ProjectAllocationDto[];
}

/** "YYYY-MM-DD" -> Date at UTC midnight (matches @db.Date storage). */
export function toDbDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date -> "YYYY-MM-DD". */
export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toProjectDto(row: ProjectListRow): ProjectDto {
  return {
    id: row.id,
    projectCode: row.projectCode,
    name: row.name,
    projectManagerEmployeeId: row.projectManagerEmployeeId,
    projectManagerName: row.projectManager.fullName,
    startDate: toDateOnly(row.startDate),
    endDate: toDateOnly(row.endDate),
    status: row.status,
    staffingRequirementCount: row._count.staffingRequirements,
    allocatedResourceCount: row._count.allocations,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toProjectDetailDto(row: ProjectDetailRow): ProjectDetailDto {
  return {
    ...toProjectDto(row),
    staffingRequirements: row.staffingRequirements.map((sr) => ({
      id: sr.id,
      jobRoleId: sr.jobRoleId,
      jobRoleName: sr.jobRole.name,
      headcount: sr.headcount,
      allocationPercentage: sr.allocationPercentage,
      startDate: toDateOnly(sr.startDate),
      endDate: toDateOnly(sr.endDate),
      skills: sr.skills.map((s) => ({
        skillId: s.skillId,
        skillName: s.skill.name,
        minimumProficiencyLevel: s.minimumProficiencyLevel,
      })),
    })),
    allocations: row.allocations.map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      employeeCode: a.employee.employeeCode,
      employeeName: a.employee.fullName,
      jobRoleId: a.jobRoleId,
      jobRoleName: a.jobRole.name,
      staffingRequirementId: a.staffingRequirementId,
      allocationPercentage: a.allocationPercentage,
      startDate: toDateOnly(a.startDate),
      endDate: toDateOnly(a.endDate),
      cancelledAt: a.cancelledAt ? a.cancelledAt.toISOString() : null,
    })),
  };
}
