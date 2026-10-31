import type {
  Allocation,
  Department,
  Employee,
  EmployeeSkill,
  JobRole,
  ResourceDetail,
} from '../../src/features/resources/api/resources-api.js'

// Typed against the generated schema so a contract change breaks the build.

export const DEPARTMENT_ENGINEERING: Department = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Engineering',
  isActive: true,
}

export const DEPARTMENT_DELIVERY: Department = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Delivery',
  isActive: true,
}

export const JOB_ROLE_DEVELOPER: JobRole = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Full-Stack Developer',
  isActive: true,
}

export const JOB_ROLE_MANAGER: JobRole = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Delivery Manager',
  isActive: true,
}

// Fully available: no allocation is effective.
export const EMPLOYEE_AVAILABLE: Employee = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  employeeCode: 'EMP001',
  fullName: 'Budi Santoso',
  workEmail: 'budi.santoso@staffora.internal',
  departmentId: DEPARTMENT_ENGINEERING.id,
  departmentName: DEPARTMENT_ENGINEERING.name,
  jobRoleId: JOB_ROLE_DEVELOPER.id,
  jobRoleTitle: JOB_ROLE_DEVELOPER.name,
  status: 'ACTIVE',
  currentAllocation: 0,
  currentRemainingCapacity: 100,
}

// Partially allocated: 45% remains.
export const EMPLOYEE_PARTIAL: Employee = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  employeeCode: 'EMP002',
  fullName: 'Siti Rahayu',
  workEmail: 'siti.rahayu@staffora.internal',
  departmentId: DEPARTMENT_DELIVERY.id,
  departmentName: DEPARTMENT_DELIVERY.name,
  jobRoleId: JOB_ROLE_MANAGER.id,
  jobRoleTitle: JOB_ROLE_MANAGER.name,
  status: 'ACTIVE',
  currentAllocation: 55,
  currentRemainingCapacity: 45,
}

// Fully allocated: 0% remains.
export const EMPLOYEE_FULL: Employee = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  employeeCode: 'EMP003',
  fullName: 'Andi Wijaya',
  workEmail: 'andi.wijaya@staffora.internal',
  departmentId: DEPARTMENT_ENGINEERING.id,
  departmentName: DEPARTMENT_ENGINEERING.name,
  jobRoleId: JOB_ROLE_DEVELOPER.id,
  jobRoleTitle: JOB_ROLE_DEVELOPER.name,
  status: 'ACTIVE',
  currentAllocation: 100,
  currentRemainingCapacity: 0,
}

export const ALL_EMPLOYEES: Employee[] = [EMPLOYEE_AVAILABLE, EMPLOYEE_PARTIAL, EMPLOYEE_FULL]

export const SKILL_ADVANCED: EmployeeSkill = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  skillId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  skillName: 'TypeScript',
  proficiencyLevel: 4,
}

export const SKILL_EXPERT: EmployeeSkill = {
  id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  skillId: '99999999-9999-4999-8999-999999999999',
  skillName: 'PostgreSQL',
  proficiencyLevel: 5,
}

export const ALLOCATION_ACTIVE: Allocation = {
  id: '12121212-1212-4212-8212-121212121212',
  employeeId: EMPLOYEE_PARTIAL.id,
  employeeName: EMPLOYEE_PARTIAL.fullName,
  projectId: '13131313-1313-4313-8313-131313131313',
  projectName: 'Staffora Platform',
  projectCode: 'PRJ-001',
  jobRoleId: JOB_ROLE_DEVELOPER.id,
  jobRoleTitle: 'Backend Engineer',
  staffingRequirementId: null,
  allocationPercentage: 55,
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  displayStatus: 'ACTIVE',
  cancelledAt: null,
}

export const DETAIL_PARTIAL: ResourceDetail = {
  ...EMPLOYEE_PARTIAL,
  skills: [SKILL_ADVANCED, SKILL_EXPERT],
  allocations: [ALLOCATION_ACTIVE],
  evaluatedPeriod: {
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    peakConcurrentAllocation: 55,
    remainingCapacity: 45,
  },
}
