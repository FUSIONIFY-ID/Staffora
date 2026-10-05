import 'dotenv/config'
import { prisma } from '../src/common/database/prisma.js'
import { hashPassword } from '../src/common/auth/password.js'

async function main() {
  console.log('Seeding Staffora database...')

  // 1. Departments
  const deptEngineering = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering', isActive: true },
  })

  await prisma.department.upsert({
    where: { name: 'Product & Design' },
    update: {},
    create: { name: 'Product & Design', isActive: true },
  })

  await prisma.department.upsert({
    where: { name: 'Quality Assurance' },
    update: {},
    create: { name: 'Quality Assurance', isActive: true },
  })

  // 2. Job Roles
  const roleFE = await prisma.jobRole.upsert({
    where: { name: 'Frontend Engineer' },
    update: {},
    create: { name: 'Frontend Engineer', isActive: true },
  })

  const roleBE = await prisma.jobRole.upsert({
    where: { name: 'Backend Engineer' },
    update: {},
    create: { name: 'Backend Engineer', isActive: true },
  })

  const rolePM = await prisma.jobRole.upsert({
    where: { name: 'Project Manager' },
    update: {},
    create: { name: 'Project Manager', isActive: true },
  })

  const roleRM = await prisma.jobRole.upsert({
    where: { name: 'Resource Manager' },
    update: {},
    create: { name: 'Resource Manager', isActive: true },
  })

  // 3. Skills
  const skillsList = [
    'React',
    'TypeScript',
    'Node.js',
    'PostgreSQL',
    'Prisma ORM',
    'Tailwind CSS',
    'System Architecture',
  ]

  const createdSkills: Record<string, string> = {}
  for (const s of skillsList) {
    const skill = await prisma.skill.upsert({
      where: { name: s },
      update: {},
      create: { name: s, isActive: true },
    })
    createdSkills[s] = skill.id
  }

  // 4. Employees
  const empAdmin = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-001' },
    update: {},
    create: {
      employeeCode: 'EMP-001',
      fullName: 'Chief Administrator',
      workEmail: 'admin@staffora.internal',
      departmentId: deptEngineering.id,
      jobRoleId: roleBE.id,
      status: 'ACTIVE',
    },
  })

  const empPM = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-002' },
    update: {},
    create: {
      employeeCode: 'EMP-002',
      fullName: 'Sarah Jenkins',
      workEmail: 'pm@staffora.internal',
      departmentId: deptEngineering.id,
      jobRoleId: rolePM.id,
      status: 'ACTIVE',
    },
  })

  const empRM = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-003' },
    update: {},
    create: {
      employeeCode: 'EMP-003',
      fullName: 'Alex Vance',
      workEmail: 'rm@staffora.internal',
      departmentId: deptEngineering.id,
      jobRoleId: roleRM.id,
      status: 'ACTIVE',
    },
  })

  const empDev1 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-004' },
    update: {},
    create: {
      employeeCode: 'EMP-004',
      fullName: 'David Kurnia',
      workEmail: 'david.kurnia@staffora.internal',
      departmentId: deptEngineering.id,
      jobRoleId: roleFE.id,
      status: 'ACTIVE',
    },
  })

  const empDev2 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-005' },
    update: {},
    create: {
      employeeCode: 'EMP-005',
      fullName: 'Rian Pratama',
      workEmail: 'employee@staffora.internal',
      departmentId: deptEngineering.id,
      jobRoleId: roleBE.id,
      status: 'ACTIVE',
    },
  })

  // 5. Employee Skills
  if (createdSkills['React']) {
    await prisma.employeeSkill.upsert({
      where: {
        employeeId_skillId: {
          employeeId: empDev1.id,
          skillId: createdSkills['React'],
        },
      },
      update: {},
      create: {
        employeeId: empDev1.id,
        skillId: createdSkills['React'],
        proficiencyLevel: 4, // Advanced
      },
    })
  }

  if (createdSkills['Node.js']) {
    await prisma.employeeSkill.upsert({
      where: {
        employeeId_skillId: {
          employeeId: empDev2.id,
          skillId: createdSkills['Node.js'],
        },
      },
      update: {},
      create: {
        employeeId: empDev2.id,
        skillId: createdSkills['Node.js'],
        proficiencyLevel: 5, // Expert
      },
    })
  }

  // 6. User Accounts
  const adminPasswordHash = await hashPassword('StafforaAdmin2026!')
  await prisma.user.upsert({
    where: { normalizedEmail: 'admin@staffora.internal' },
    update: {},
    create: {
      normalizedEmail: 'admin@staffora.internal',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
      employeeId: empAdmin.id,
    },
  })

  const pmPasswordHash = await hashPassword('StafforaPM2026!')
  await prisma.user.upsert({
    where: { normalizedEmail: 'pm@staffora.internal' },
    update: {},
    create: {
      normalizedEmail: 'pm@staffora.internal',
      passwordHash: pmPasswordHash,
      role: 'PROJECT_MANAGER',
      isActive: true,
      employeeId: empPM.id,
    },
  })

  const rmPasswordHash = await hashPassword('StafforaRM2026!')
  await prisma.user.upsert({
    where: { normalizedEmail: 'rm@staffora.internal' },
    update: {},
    create: {
      normalizedEmail: 'rm@staffora.internal',
      passwordHash: rmPasswordHash,
      role: 'RESOURCE_MANAGER',
      isActive: true,
      employeeId: empRM.id,
    },
  })

  const empPasswordHash = await hashPassword('StafforaEmp2026!')
  await prisma.user.upsert({
    where: { normalizedEmail: 'employee@staffora.internal' },
    update: {},
    create: {
      normalizedEmail: 'employee@staffora.internal',
      passwordHash: empPasswordHash,
      role: 'EMPLOYEE',
      isActive: true,
      employeeId: empDev2.id,
    },
  })

  // 7. Sample Project & Staffing Requirements
  const project = await prisma.project.upsert({
    where: { projectCode: 'PRJ-STAFFORA-01' },
    update: {},
    create: {
      projectCode: 'PRJ-STAFFORA-01',
      name: 'Staffora Resource Allocation Platform',
      projectManagerEmployeeId: empPM.id,
      startDate: new Date('2026-10-01T00:00:00Z'),
      endDate: new Date('2026-12-31T00:00:00Z'),
      status: 'ACTIVE',
    },
  })

  const requirement = await prisma.staffingRequirement.create({
    data: {
      projectId: project.id,
      jobRoleId: roleFE.id,
      headcount: 1,
      allocationPercentage: 50,
      startDate: new Date('2026-10-05T00:00:00Z'),
      endDate: new Date('2026-12-15T00:00:00Z'),
    },
  })

  // 8. Sample Allocation (50% David Kurnia on PRJ-STAFFORA-01)
  await prisma.allocation.create({
    data: {
      employeeId: empDev1.id,
      projectId: project.id,
      jobRoleId: roleFE.id,
      staffingRequirementId: requirement.id,
      allocationPercentage: 50,
      startDate: new Date('2026-10-05T00:00:00Z'),
      endDate: new Date('2026-12-15T00:00:00Z'),
    },
  })

  console.log('Seeding completed successfully!')
  console.log('Credentials seeded:')
  console.log('  Admin:            admin@staffora.internal / StafforaAdmin2026!')
  console.log('  Project Manager:  pm@staffora.internal / StafforaPM2026!')
  console.log('  Resource Manager: rm@staffora.internal / StafforaRM2026!')
  console.log('  Employee:         employee@staffora.internal / StafforaEmp2026!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
