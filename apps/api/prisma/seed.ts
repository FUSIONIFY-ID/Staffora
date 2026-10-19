import "dotenv/config";
import { prisma } from "../src/common/database/prisma.js";
import { hashPassword } from "../src/common/auth/password.js";

async function main() {
  console.log("Seeding Staffora database...");

  // 1. Departments
  const deptEngineering = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering", isActive: true },
  });

  const deptProduct = await prisma.department.upsert({
    where: { name: "Product" },
    update: {},
    create: { name: "Product", isActive: true },
  });

  const deptQuality = await prisma.department.upsert({
    where: { name: "Quality" },
    update: {},
    create: { name: "Quality", isActive: true },
  });

  await prisma.department.upsert({
    where: { name: "Product & Design" },
    update: {},
    create: { name: "Product & Design", isActive: true },
  });

  await prisma.department.upsert({
    where: { name: "Quality Assurance" },
    update: {},
    create: { name: "Quality Assurance", isActive: true },
  });

  // 2. Job Roles
  const roleSE = await prisma.jobRole.upsert({
    where: { name: "Software Engineer" },
    update: {},
    create: { name: "Software Engineer", isActive: true },
  });

  const roleBE = await prisma.jobRole.upsert({
    where: { name: "Backend Engineer" },
    update: {},
    create: { name: "Backend Engineer", isActive: true },
  });

  const rolePD = await prisma.jobRole.upsert({
    where: { name: "Product Designer" },
    update: {},
    create: { name: "Product Designer", isActive: true },
  });

  const roleQA = await prisma.jobRole.upsert({
    where: { name: "QA Engineer" },
    update: {},
    create: { name: "QA Engineer", isActive: true },
  });

  const roleTS = await prisma.jobRole.upsert({
    where: { name: "Technical Support" },
    update: {},
    create: { name: "Technical Support", isActive: true },
  });

  await prisma.jobRole.upsert({
    where: { name: "Frontend Engineer" },
    update: {},
    create: { name: "Frontend Engineer", isActive: true },
  });

  await prisma.jobRole.upsert({
    where: { name: "Project Manager" },
    update: {},
    create: { name: "Project Manager", isActive: true },
  });

  await prisma.jobRole.upsert({
    where: { name: "Resource Manager" },
    update: {},
    create: { name: "Resource Manager", isActive: true },
  });

  // 3. Skills
  const skillsList = [
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "Prisma ORM",
    "Tailwind CSS",
    "System Architecture",
  ];
  const createdSkills: Record<string, string> = {};
  for (const s of skillsList) {
    const skill = await prisma.skill.upsert({
      where: { name: s },
      update: {},
      create: { name: s, isActive: true },
    });
    createdSkills[s] = skill.id;
  }

  // 4. Employees matching Figma table
  // 1. Arya Isnaidi | EMP-001 | Software Engineer | Engineering | Active
  const empArya = await prisma.employee.upsert({
    where: { employeeCode: "EMP-001" },
    update: {
      fullName: "Arya Isnaidi",
      workEmail: "arya@company.com",
      departmentId: deptEngineering.id,
      jobRoleId: roleSE.id,
      status: "ACTIVE",
    },
    create: {
      employeeCode: "EMP-001",
      fullName: "Arya Isnaidi",
      workEmail: "arya@company.com",
      departmentId: deptEngineering.id,
      jobRoleId: roleSE.id,
      status: "ACTIVE",
    },
  });

  // 2. Budi Santoso | EMP-002 | Backend Engineer | Engineering | Active
  const empBudi = await prisma.employee.upsert({
    where: { employeeCode: "EMP-002" },
    update: {
      fullName: "Budi Santoso",
      workEmail: "budi@staffora.internal",
      departmentId: deptEngineering.id,
      jobRoleId: roleBE.id,
      status: "ACTIVE",
    },
    create: {
      employeeCode: "EMP-002",
      fullName: "Budi Santoso",
      workEmail: "budi@staffora.internal",
      departmentId: deptEngineering.id,
      jobRoleId: roleBE.id,
      status: "ACTIVE",
    },
  });

  // 3. Citra Lestari | EMP-003 | Product Designer | Product | Active
  const empCitra = await prisma.employee.upsert({
    where: { employeeCode: "EMP-003" },
    update: {
      fullName: "Citra Lestari",
      workEmail: "citra@staffora.internal",
      departmentId: deptProduct.id,
      jobRoleId: rolePD.id,
      status: "ACTIVE",
    },
    create: {
      employeeCode: "EMP-003",
      fullName: "Citra Lestari",
      workEmail: "citra@staffora.internal",
      departmentId: deptProduct.id,
      jobRoleId: rolePD.id,
      status: "ACTIVE",
    },
  });

  // 4. Dimas Putra | EMP-004 | Backend Engineer | Engineering | Active
  const empDimas = await prisma.employee.upsert({
    where: { employeeCode: "EMP-004" },
    update: {
      fullName: "Dimas Putra",
      workEmail: "dimas@staffora.internal",
      departmentId: deptEngineering.id,
      jobRoleId: roleBE.id,
      status: "ACTIVE",
    },
    create: {
      employeeCode: "EMP-004",
      fullName: "Dimas Putra",
      workEmail: "dimas@staffora.internal",
      departmentId: deptEngineering.id,
      jobRoleId: roleBE.id,
      status: "ACTIVE",
    },
  });

  // 5. Nadia Putri | EMP-005 | QA Engineer | Quality | Inactive
  const empNadia = await prisma.employee.upsert({
    where: { employeeCode: "EMP-005" },
    update: {
      fullName: "Nadia Putri",
      workEmail: "nadia@staffora.internal",
      departmentId: deptQuality.id,
      jobRoleId: roleQA.id,
      status: "INACTIVE",
    },
    create: {
      employeeCode: "EMP-005",
      fullName: "Nadia Putri",
      workEmail: "nadia@staffora.internal",
      departmentId: deptQuality.id,
      jobRoleId: roleQA.id,
      status: "INACTIVE",
    },
  });

  // 5. Skills for Arya Isnaidi
  const aryaSkills = [
    { name: "React", level: 5 },
    { name: "TypeScript", level: 5 },
    { name: "Node.js", level: 4 },
    { name: "PostgreSQL", level: 4 },
    { name: "Docker", level: 3 },
  ];
  for (const s of aryaSkills) {
    const skillId = createdSkills[s.name];
    if (skillId) {
      await prisma.employeeSkill.upsert({
        where: {
          employeeId_skillId: {
            employeeId: empArya.id,
            skillId,
          },
        },
        update: { proficiencyLevel: s.level },
        create: {
          employeeId: empArya.id,
          skillId,
          proficiencyLevel: s.level,
        },
      });
    }
  }

  // 6. User Accounts for Authentication (1-to-1 mapping with employees)
  const adminPass = await hashPassword("StafforaAdmin2026!");
  await prisma.user.upsert({
    where: { normalizedEmail: "admin@staffora.internal" },
    update: { employeeId: empArya.id },
    create: {
      normalizedEmail: "admin@staffora.internal",
      passwordHash: adminPass,
      role: "ADMIN",
      isActive: true,
      employeeId: empArya.id,
    },
  });

  const rmPass = await hashPassword("StafforaRM2026!");
  await prisma.user.upsert({
    where: { normalizedEmail: "rm@staffora.internal" },
    update: { employeeId: empCitra.id },
    create: {
      normalizedEmail: "rm@staffora.internal",
      passwordHash: rmPass,
      role: "RESOURCE_MANAGER",
      isActive: true,
      employeeId: empCitra.id,
    },
  });

  const pmPass = await hashPassword("StafforaPM2026!");
  await prisma.user.upsert({
    where: { normalizedEmail: "pm@staffora.internal" },
    update: { employeeId: empBudi.id },
    create: {
      normalizedEmail: "pm@staffora.internal",
      passwordHash: pmPass,
      role: "PROJECT_MANAGER",
      isActive: true,
      employeeId: empBudi.id,
    },
  });

  const empPass = await hashPassword("StafforaEmp2026!");
  await prisma.user.upsert({
    where: { normalizedEmail: "employee@staffora.internal" },
    update: { employeeId: empNadia.id },
    create: {
      normalizedEmail: "employee@staffora.internal",
      passwordHash: empPass,
      role: "EMPLOYEE",
      isActive: true,
      employeeId: empNadia.id,
    },
  });

  // 7. Projects
  const prjAlpha = await prisma.project.upsert({
    where: { projectCode: "PRJ-ALPHA" },
    update: {},
    create: {
      projectCode: "PRJ-ALPHA",
      name: "Project Alpha",
      projectManagerEmployeeId: empArya.id,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
      status: "ACTIVE",
    },
  });

  const prjInternal = await prisma.project.upsert({
    where: { projectCode: "PRJ-INTERNAL" },
    update: {},
    create: {
      projectCode: "PRJ-INTERNAL",
      name: "Internal Platform",
      projectManagerEmployeeId: empArya.id,
      startDate: new Date("2026-09-15T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
      status: "ACTIVE",
    },
  });

  await prisma.project.upsert({
    where: { projectCode: "PRJ-STAFFORA-01" },
    update: {},
    create: {
      projectCode: "PRJ-STAFFORA-01",
      name: "Staffora Resource Allocation Platform",
      projectManagerEmployeeId: empBudi.id,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
      status: "ACTIVE",
    },
  });

  // 8. Allocations matching Figma table percentages
  await prisma.allocation.deleteMany({});

  // Arya Isnaidi: 50% Project Alpha, 20% Internal Platform -> 70% Allocated, 30% Availability
  await prisma.allocation.create({
    data: {
      employeeId: empArya.id,
      projectId: prjAlpha.id,
      jobRoleId: roleSE.id,
      allocationPercentage: 50,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
    },
  });
  await prisma.allocation.create({
    data: {
      employeeId: empArya.id,
      projectId: prjInternal.id,
      jobRoleId: roleTS.id,
      allocationPercentage: 20,
      startDate: new Date("2026-09-15T00:00:00Z"),
      endDate: new Date("2026-11-15T00:00:00Z"),
    },
  });

  // Budi Santoso: 80% Project Alpha -> 80% Allocated, 20% Availability
  await prisma.allocation.create({
    data: {
      employeeId: empBudi.id,
      projectId: prjAlpha.id,
      jobRoleId: roleBE.id,
      allocationPercentage: 80,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
    },
  });

  // Citra Lestari: 50% Project Alpha -> 50% Allocated, 50% Availability
  await prisma.allocation.create({
    data: {
      employeeId: empCitra.id,
      projectId: prjAlpha.id,
      jobRoleId: rolePD.id,
      allocationPercentage: 50,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
    },
  });

  // Dimas Putra: 100% Internal Platform -> 100% Allocated, 0% Availability
  await prisma.allocation.create({
    data: {
      employeeId: empDimas.id,
      projectId: prjInternal.id,
      jobRoleId: roleBE.id,
      allocationPercentage: 100,
      startDate: new Date("2026-09-15T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
    },
  });

  // Nadia Putri: 40% Internal Platform -> 40% Allocated, 60% Availability (Inactive)
  await prisma.allocation.create({
    data: {
      employeeId: empNadia.id,
      projectId: prjInternal.id,
      jobRoleId: roleQA.id,
      allocationPercentage: 40,
      startDate: new Date("2026-09-15T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
    },
  });

  console.log("Seeding completed successfully!");
  console.log("Credentials seeded:");
  console.log("  Admin:            admin@staffora.internal / StafforaAdmin2026!");
  console.log("  Project Manager:  pm@staffora.internal / StafforaPM2026!");
  console.log("  Resource Manager: rm@staffora.internal / StafforaRM2026!");
  console.log("  Employee:         employee@staffora.internal / StafforaEmp2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
