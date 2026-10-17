import { randomUUID } from "node:crypto";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Request, Response } from "express";
import { createApp } from "../src/app.js";
import { prisma } from "../src/common/database/prisma.js";
import { postLogin } from "./support/auth-login.js";

import {
  ROLES,
  ROLE_VALUES,
  type AuthenticatedUser,
} from "../src/common/auth/types.js";
import type { AppError } from "../src/common/errors/app-error.js";
import {
  assertAuth,
  assertRole,
  assertPolicy,
  assertPolicyOrNotFound,
  validateUserEmployeeLinkage,
  canAccessEmployeeProfile,
  canManageProject,
  assertCanManageProject,
  isProjectManagerOwner,
  canManageAllocation,
  assertCanManageAllocation,
  canViewProject,
  assertLinkedEmployee,
} from "../src/common/auth/policy.js";
import {
  requireRole,
  requireLinkedEmployee as requireLinkedEmployeeMiddleware,
} from "../src/common/auth/rbac.js";
import { hashPassword } from "../src/common/auth/password.js";
import { projectsPolicy } from "../src/modules/projects/projects.policy.js";
import { workforcePolicy } from "../src/modules/workforce/workforce.policy.js";
import { staffingPolicy } from "../src/modules/staffing/staffing.policy.js";
import { allocationsPolicy } from "../src/modules/allocations/allocations.policy.js";
import { projectsService } from "../src/modules/projects/projects.service.js";
import { staffingService } from "../src/modules/staffing/staffing.service.js";
import { allocationsService } from "../src/modules/allocations/allocations.service.js";
import { identityService } from "../src/modules/identity/identity.service.js";
import { workforceController } from "../src/modules/workforce/workforce.controller.js";
import { createSessionMiddleware } from "../src/common/auth/session.js";
import { generalRateLimitMiddleware } from "../src/common/auth/rate-limiter.js";
import { identityLoaderMiddleware } from "../src/common/auth/identity-loader.js";
import {
  validateParams,
  skillIdParamSchema,
} from "../src/common/validation/validate.js";

describe("RBAC & Authorization Foundation (PRD US01.02 & TSD Section 15.4)", () => {
  const app = createApp({ useMemorySession: true });

  let adminCookie: string;
  let adminCsrf: string;
  let pmCookie: string;
  let pmCsrf: string;
  let rmCookie: string;
  let employeeCookie: string;
  let employeeCsrf: string;

  let employeeOwnId: string;
  let otherEmployeeId: string;
  let pmOwnProjectId: string;
  let otherPmProjectId: string;
  let otherPmStaffingRequirementId: string;
  let rolePMId: string;
  let deptId: string;
  let pmEmployeeId: string;

  let createdEmployeeId: string | null = null;
  let createdProjectId: string | null = null;
  let createdPmOwnProjectId: string | null = null;
  let createdStaffingRequirementId: string | null = null;
  let createdPmOwnAllocationId: string | null = null;
  let pmOwnAllocationId: string;
  let createdOtherAllocationId: string | null = null;
  let otherAllocationId: string;

  beforeAll(async () => {
    // 1. Authenticate seeded users
    const adminRes = await postLogin(app, {
      email: "admin@staffora.internal",
      password: "StafforaAdmin2026!",
    });
    adminCookie = adminRes.headers["set-cookie"]?.[0] ?? "";
    adminCsrf = adminRes.body.data.csrfToken;

    const pmRes = await postLogin(app, {
      email: "pm@staffora.internal",
      password: "StafforaPM2026!",
    });
    pmCookie = pmRes.headers["set-cookie"]?.[0] ?? "";
    pmCsrf = pmRes.body.data.csrfToken;

    const rmRes = await postLogin(app, {
      email: "rm@staffora.internal",
      password: "StafforaRM2026!",
    });
    rmCookie = rmRes.headers["set-cookie"]?.[0] ?? "";

    const empRes = await postLogin(app, {
      email: "employee@staffora.internal",
      password: "StafforaEmp2026!",
    });
    employeeCookie = empRes.headers["set-cookie"]?.[0] ?? "";
    employeeCsrf = empRes.body.data.csrfToken;
    employeeOwnId = empRes.body.data.user.employeeId;

    // 2. Fetch another employee (David Kurnia - EMP-004)
    const emp4 = await prisma.employee.findUniqueOrThrow({
      where: { employeeCode: "EMP-004" },
    });
    otherEmployeeId = emp4.id;

    const testSuffix = Date.now().toString();
    pmEmployeeId = pmRes.body.data.user.employeeId;

    // 3. Create dedicated PM test project (Safe fixture: prevents mutating seeded PRJ-STAFFORA-01)
    const ownProj = await prisma.project.create({
      data: {
        projectCode: `TEST-PM-OWN-${testSuffix}`,
        name: "PM Dedicated Test Project",
        projectManagerEmployeeId: pmEmployeeId,
        startDate: new Date("2026-10-01T00:00:00Z"),
        endDate: new Date("2026-12-31T00:00:00Z"),
        status: "ACTIVE",
      },
    });
    createdPmOwnProjectId = ownProj.id;
    pmOwnProjectId = ownProj.id;

    // 4. Create another PM and another project for cross-PM ownership tests
    const dept = await prisma.department.findFirstOrThrow();
    deptId = dept.id;
    const rolePM = await prisma.jobRole.findFirstOrThrow({
      where: { name: "Project Manager" },
    });
    rolePMId = rolePM.id;

    const otherPmEmp = await prisma.employee.create({
      data: {
        employeeCode: `TEST-EMP-${testSuffix}`,
        fullName: "Other PM User",
        workEmail: `other.pm.${testSuffix}@staffora.internal`,
        departmentId: dept.id,
        jobRoleId: rolePM.id,
        status: "ACTIVE",
      },
    });
    createdEmployeeId = otherPmEmp.id;

    const otherProj = await prisma.project.create({
      data: {
        projectCode: `TEST-PRJ-${testSuffix}`,
        name: "Another PM Project",
        projectManagerEmployeeId: otherPmEmp.id,
        startDate: new Date("2026-11-01T00:00:00Z"),
        endDate: new Date("2026-12-31T00:00:00Z"),
        status: "PLANNED",
      },
    });
    createdProjectId = otherProj.id;
    otherPmProjectId = otherProj.id;

    const otherReq = await prisma.staffingRequirement.create({
      data: {
        projectId: otherProj.id,
        jobRoleId: rolePM.id,
        headcount: 1,
        allocationPercentage: 100,
        startDate: new Date("2026-11-01T00:00:00Z"),
        endDate: new Date("2026-12-31T00:00:00Z"),
      },
    });
    createdStaffingRequirementId = otherReq.id;
    otherPmStaffingRequirementId = otherReq.id;

    // 5. Create test allocations for PM and cross-PM tests
    const ownAlloc = await prisma.allocation.create({
      data: {
        employeeId: otherEmployeeId,
        projectId: ownProj.id,
        jobRoleId: rolePM.id,
        allocationPercentage: 50,
        startDate: new Date("2026-11-01T00:00:00Z"),
        endDate: new Date("2026-12-01T00:00:00Z"),
      },
    });
    createdPmOwnAllocationId = ownAlloc.id;
    pmOwnAllocationId = ownAlloc.id;

    const otherAlloc = await prisma.allocation.create({
      data: {
        employeeId: otherEmployeeId,
        projectId: otherProj.id,
        jobRoleId: rolePM.id,
        allocationPercentage: 50,
        startDate: new Date("2026-11-01T00:00:00Z"),
        endDate: new Date("2026-12-01T00:00:00Z"),
      },
    });
    createdOtherAllocationId = otherAlloc.id;
    otherAllocationId = otherAlloc.id;
  });

  afterAll(async () => {
    // Cleanup hanya data yang benar-benar dibuat oleh test ini
    if (createdOtherAllocationId) {
      await prisma.allocation.deleteMany({
        where: { id: createdOtherAllocationId },
      });
    }
    if (createdPmOwnAllocationId) {
      await prisma.allocation.deleteMany({
        where: { id: createdPmOwnAllocationId },
      });
    }
    if (createdStaffingRequirementId) {
      await prisma.staffingRequirement.deleteMany({
        where: { id: createdStaffingRequirementId },
      });
    }
    if (createdPmOwnProjectId) {
      await prisma.staffingRequirement.deleteMany({
        where: { projectId: createdPmOwnProjectId },
      });
      await prisma.project.deleteMany({ where: { id: createdPmOwnProjectId } });
    }
    if (createdProjectId) {
      await prisma.staffingRequirement.deleteMany({
        where: { projectId: createdProjectId },
      });
      await prisma.project.deleteMany({ where: { id: createdProjectId } });
    }
    if (createdEmployeeId) {
      await prisma.employee.deleteMany({ where: { id: createdEmployeeId } });
    }
  });

  describe("1. Role Constants & Definitions", () => {
    it("defines standard role constants for all 4 application roles", () => {
      expect(ROLES.ADMIN).toBe("ADMIN");
      expect(ROLES.PROJECT_MANAGER).toBe("PROJECT_MANAGER");
      expect(ROLES.RESOURCE_MANAGER).toBe("RESOURCE_MANAGER");
      expect(ROLES.EMPLOYEE).toBe("EMPLOYEE");
      expect(ROLE_VALUES).toEqual([
        "ADMIN",
        "PROJECT_MANAGER",
        "RESOURCE_MANAGER",
        "EMPLOYEE",
      ]);
    });
  });

  describe("2. Unauthenticated Access Protection (HTTP 401)", () => {
    it("rejects direct API request to /employees without authentication", async () => {
      const res = await request(app).get("/api/v1/employees");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
      expect(res.body.message).toContain("Authentication required");
      expect(res.body.requestId).toBeDefined();
    });

    it("rejects direct API request to /projects without authentication", async () => {
      const res = await request(app).get("/api/v1/projects");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects direct API request to /users without authentication", async () => {
      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  describe("3. Inactive Account Session Rejection (HTTP 401)", () => {
    it("rejects request from inactive user session", async () => {
      // Create temporary inactive user
      const pw = await hashPassword("TempInactivePass123!");
      const email = `temp.inactive.${randomUUID()}@staffora.internal`;
      const inactiveUser = await prisma.user.create({
        data: {
          normalizedEmail: email,
          passwordHash: pw,
          role: "EMPLOYEE",
          isActive: false,
        },
      });

      try {
        // Attempting to authenticate returns 401
        const loginRes = await postLogin(app, {
          email,
          password: "TempInactivePass123!",
        });
        expect(loginRes.status).toBe(401);
        expect(loginRes.body.code).toBe("UNAUTHORIZED");
      } finally {
        await prisma.user.delete({ where: { id: inactiveUser.id } });
      }
    });
  });

  describe("4. Role-Based Access Control (HTTP 403 Forbidden)", () => {
    it("rejects EMPLOYEE accessing admin-only /users endpoint", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Cookie", employeeCookie);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.message).toBe(
        "You do not have permission to perform this action.",
      );
    });

    it("rejects PROJECT_MANAGER accessing admin-only /users endpoint", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Cookie", pmCookie);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("rejects RESOURCE_MANAGER accessing admin-only /users endpoint", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Cookie", rmCookie);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("allows ADMIN accessing /users endpoint", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("rejects EMPLOYEE attempting to create an employee resource (RBAC 403 with valid CSRF)", async () => {
      const res = await request(app)
        .post("/api/v1/employees")
        .set("Cookie", employeeCookie)
        .set("X-CSRF-Token", employeeCsrf)
        .send({ employeeCode: "TEST", fullName: "Test" });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.message).toContain("You do not have permission");
    });
  });

  describe("5. Own Employee Profile Access Policy", () => {
    it("allows EMPLOYEE to reach their own profile endpoint (HTTP 501 Not Implemented)", async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${employeeOwnId}`)
        .set("Cookie", employeeCookie);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("disallows EMPLOYEE from viewing another employee profile via non-disclosure (HTTP 404)", async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set("Cookie", employeeCookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 404 identically when employee profile does not exist (non-disclosure parity)", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      const res = await request(app)
        .get(`/api/v1/employees/${fakeUuid}`)
        .set("Cookie", employeeCookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("allows ADMIN, RM, and PM to reach any employee profile endpoint (HTTP 501 Not Implemented)", async () => {
      const adminRes = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set("Cookie", adminCookie);
      expect(adminRes.status).toBe(501);
      expect(adminRes.body.code).toBe("NOT_IMPLEMENTED");

      const rmRes = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set("Cookie", rmCookie);
      expect(rmRes.status).toBe(501);
      expect(rmRes.body.code).toBe("NOT_IMPLEMENTED");

      const pmRes = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set("Cookie", pmCookie);
      expect(pmRes.status).toBe(501);
      expect(pmRes.body.code).toBe("NOT_IMPLEMENTED");
    });
  });

  describe("6. Assigned Project Ownership Policy", () => {
    it("allows PROJECT_MANAGER to update their own assigned project (HTTP 200)", async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${pmOwnProjectId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ name: "Updated Staffora Platform" });
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(pmOwnProjectId);
      expect(res.body.data.name).toBe("Updated Staffora Platform");

      const persisted = await prisma.project.findUnique({
        where: { id: pmOwnProjectId },
      });
      expect(persisted?.name).toBe("Updated Staffora Platform");
    });

    it("disallows PROJECT_MANAGER from updating another PM project via non-disclosure (HTTP 404)", async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${otherPmProjectId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ name: "Unauthorized Hijack Attempt" });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 404 identically when project does not exist (non-disclosure parity)", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      const res = await request(app)
        .patch(`/api/v1/projects/${fakeUuid}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ name: "Non Existent Project" });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("disallows PROJECT_MANAGER from creating allocation in another PM project via non-disclosure (HTTP 404)", async () => {
      const res = await request(app)
        .post("/api/v1/allocations")
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          projectId: otherPmProjectId,
          employeeId: employeeOwnId,
          jobRoleId: (await prisma.jobRole.findFirstOrThrow()).id,
          allocationPercentage: 50,
          startDate: "2026-11-01",
          endDate: "2026-12-01",
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(res.body.message).toContain("Project not found");
    });

    it("allows PROJECT_MANAGER to reach create allocation in their own project (HTTP 501 Not Implemented)", async () => {
      const res = await request(app)
        .post("/api/v1/allocations")
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          projectId: pmOwnProjectId,
          employeeId: otherEmployeeId,
          jobRoleId: rolePMId,
          allocationPercentage: 50,
          startDate: "2026-11-01",
          endDate: "2026-12-01",
        });
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("disallows PROJECT_MANAGER from creating allocation for non-existent project (HTTP 404)", async () => {
      const res = await request(app)
        .post("/api/v1/allocations")
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          projectId: "00000000-0000-0000-0000-000000000000",
          employeeId: otherEmployeeId,
          jobRoleId: rolePMId,
          allocationPercentage: 50,
          startDate: "2026-11-01",
          endDate: "2026-12-01",
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("allows PROJECT_MANAGER to reach update allocation in their own project (HTTP 501 Not Implemented)", async () => {
      const res = await request(app)
        .patch(`/api/v1/allocations/${pmOwnAllocationId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ allocationPercentage: 80 });
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("disallows PROJECT_MANAGER from updating allocation in another PM project via non-disclosure (HTTP 404)", async () => {
      const res = await request(app)
        .patch(`/api/v1/allocations/${otherAllocationId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ allocationPercentage: 80 });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 404 when updating non-existent allocation", async () => {
      const res = await request(app)
        .patch("/api/v1/allocations/00000000-0000-0000-0000-000000000000")
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ allocationPercentage: 80 });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("allows PROJECT_MANAGER to reach end allocation in their own project (HTTP 501 Not Implemented)", async () => {
      const res = await request(app)
        .post(`/api/v1/allocations/${pmOwnAllocationId}/end`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ endDate: "2026-11-30" });
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("disallows PROJECT_MANAGER from ending allocation in another PM project via non-disclosure (HTTP 404)", async () => {
      const res = await request(app)
        .post(`/api/v1/allocations/${otherAllocationId}/end`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ endDate: "2026-11-30" });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 404 when ending non-existent allocation", async () => {
      const res = await request(app)
        .post("/api/v1/allocations/00000000-0000-0000-0000-000000000000/end")
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ endDate: "2026-11-30" });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("disallows PROJECT_MANAGER from cancelling allocation in another PM project via non-disclosure (HTTP 404)", async () => {
      const res = await request(app)
        .post(`/api/v1/allocations/${otherAllocationId}/cancel`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 404 when cancelling non-existent allocation", async () => {
      const res = await request(app)
        .post("/api/v1/allocations/00000000-0000-0000-0000-000000000000/cancel")
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("allows PROJECT_MANAGER to reach cancel allocation in their own project (HTTP 501 Not Implemented)", async () => {
      const res = await request(app)
        .post(`/api/v1/allocations/${pmOwnAllocationId}/cancel`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("disallows creating staffing requirement on non-existent project (HTTP 404)", async () => {
      const res = await request(app)
        .post(
          "/api/v1/projects/00000000-0000-0000-0000-000000000000/staffing-requirements",
        )
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          jobRoleId: rolePMId,
          headcount: 1,
          allocationPercentage: 100,
          startDate: "2026-11-01",
          endDate: "2026-12-31",
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 404 when updating non-existent staffing requirement", async () => {
      const res = await request(app)
        .patch(
          "/api/v1/staffing-requirements/00000000-0000-0000-0000-000000000000",
        )
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({ headcount: 2 });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 501 when attempting to delete staffing requirement", async () => {
      const res = await request(app)
        .delete(
          "/api/v1/staffing-requirements/00000000-0000-0000-0000-000000000000",
        )
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("allows querying project detail and returns 404 for non-existent project", async () => {
      const listRes = await request(app)
        .get("/api/v1/projects")
        .set("Cookie", pmCookie);
      expect(listRes.status).toBe(501);
      expect(listRes.body.code).toBe("NOT_IMPLEMENTED");

      const detailRes = await request(app)
        .get(`/api/v1/projects/${pmOwnProjectId}`)
        .set("Cookie", pmCookie);
      expect(detailRes.status).toBe(200);

      const fallbackDetail = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000000")
        .set("Cookie", pmCookie);
      expect(fallbackDetail.status).toBe(404);
      expect(fallbackDetail.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 501 when PROJECT_MANAGER attempts to create a project (Not Implemented in Sprint 1)", async () => {
      const res = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          projectCode: `PRJ-AUTO-${Date.now()}`,
          name: "Authed Project",
          startDate: "2026-11-01",
          endDate: "2026-12-31",
        });
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("disallows PROJECT_MANAGER from creating staffing requirement in another PM project (HTTP 404)", async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${otherPmProjectId}/staffing-requirements`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          jobRoleId: rolePMId,
          headcount: 1,
          allocationPercentage: 100,
          startDate: "2026-11-01",
          endDate: "2026-12-31",
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("disallows PROJECT_MANAGER from updating staffing requirement in another PM project (HTTP 404)", async () => {
      const res = await request(app)
        .patch(`/api/v1/staffing-requirements/${otherPmStaffingRequirementId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          headcount: 2,
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns HTTP 501 when PROJECT_MANAGER attempts to delete staffing requirement in another PM project", async () => {
      const res = await request(app)
        .delete(`/api/v1/staffing-requirements/${otherPmStaffingRequirementId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("allows PROJECT_MANAGER to create staffing requirement in their own project (HTTP 201)", async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${pmOwnProjectId}/staffing-requirements`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          jobRoleId: rolePMId,
          headcount: 1,
          allocationPercentage: 100,
          startDate: "2026-11-01",
          endDate: "2026-12-31",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.projectId).toBe(pmOwnProjectId);
      expect(res.body.data.id).toBeDefined();
      createdStaffingRequirementId = res.body.data.id;

      // Verify database persistence
      const inDb = await prisma.staffingRequirement.findUnique({
        where: { id: res.body.data.id },
      });
      expect(inDb).not.toBeNull();
      expect(inDb?.headcount).toBe(1);
    });

    it("allows PROJECT_MANAGER to update and delete staffing requirement in their own project", async () => {
      const skills = await prisma.skill.findMany({ take: 2 });
      expect(skills.length).toBeGreaterThanOrEqual(2);
      const [skill1, skill2] = skills;
      if (!skill1 || !skill2)
        throw new Error("Expected at least 2 skills in database");

      // 1. Create requirement in own project with initial skill
      const reqRes = await request(app)
        .post(`/api/v1/projects/${pmOwnProjectId}/staffing-requirements`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          jobRoleId: rolePMId,
          headcount: 2,
          allocationPercentage: 80,
          startDate: "2026-11-01",
          endDate: "2026-12-31",
          skills: skill1
            ? [{ skillId: skill1.id, minimumProficiencyLevel: 3 }]
            : undefined,
        });
      expect(reqRes.status).toBe(201);
      expect(reqRes.body.meta).toBeUndefined();
      const reqId = reqRes.body.data.id;

      if (skill1) {
        const initialSkills = await prisma.staffingRequirementSkill.findMany({
          where: { staffingRequirementId: reqId },
        });
        expect(initialSkills).toHaveLength(1);
        expect(initialSkills[0]?.skillId).toBe(skill1.id);
        expect(initialSkills[0]?.minimumProficiencyLevel).toBe(3);
      }

      // 2. Update requirement including skills and verify DB mutation
      const updateRes = await request(app)
        .patch(`/api/v1/staffing-requirements/${reqId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf)
        .send({
          headcount: 5,
          startDate: "2026-11-05",
          endDate: "2026-12-25",
          skills: skill2
            ? [{ skillId: skill2.id, minimumProficiencyLevel: 5 }]
            : undefined,
        });
      expect(updateRes.status).toBe(200);

      const updatedDb = await prisma.staffingRequirement.findUnique({
        where: { id: reqId },
        include: { skills: true },
      });
      expect(updatedDb?.headcount).toBe(5);
      if (skill2) {
        expect(updatedDb?.skills).toHaveLength(1);
        expect(updatedDb?.skills?.[0]?.skillId).toBe(skill2.id);
        expect(updatedDb?.skills?.[0]?.minimumProficiencyLevel).toBe(5);
      }

      // 3. Delete requirement returns 501 Not Implemented and preserves DB record (BR-G15)
      const deleteRes = await request(app)
        .delete(`/api/v1/staffing-requirements/${reqId}`)
        .set("Cookie", pmCookie)
        .set("X-CSRF-Token", pmCsrf);
      expect(deleteRes.status).toBe(501);
      expect(deleteRes.body.code).toBe("NOT_IMPLEMENTED");

      const preservedDb = await prisma.staffingRequirement.findUnique({
        where: { id: reqId },
      });
      expect(preservedDb).not.toBeNull();
      expect(preservedDb?.id).toBe(reqId);
    });

    it("allows ADMIN to create staffing requirement in any project (HTTP 201)", async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${otherPmProjectId}/staffing-requirements`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          jobRoleId: rolePMId,
          headcount: 1,
          allocationPercentage: 100,
          startDate: "2026-11-01",
          endDate: "2026-12-31",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      await prisma.staffingRequirement.delete({
        where: { id: res.body.data.id },
      });
    });

    it("allows querying staffing requirements for a project via API", async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${otherPmProjectId}/staffing-requirements`)
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("allows ADMIN to update any project regardless of assigned PM (HTTP 200)", async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${otherPmProjectId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({ name: "Admin Overridden Project" });
      expect(res.status).toBe(200);
    });

    it("disallows EMPLOYEE from updating any project (RBAC 403 with valid CSRF)", async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${pmOwnProjectId}`)
        .set("Cookie", employeeCookie)
        .set("X-CSRF-Token", employeeCsrf)
        .send({ name: "Employee Mutate Attempt" });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.message).toContain("You do not have permission");
    });

    it("rejects state-changing request when CSRF token is missing (CSRF protection)", async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${pmOwnProjectId}`)
        .set("Cookie", employeeCookie)
        .send({ name: "No CSRF Attempt" });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.message).toContain("CSRF");
    });
  });

  describe("7. User-to-Employee Linkage Validation & Reusable Policies", () => {
    it("validates employee linkage requirements for EMPLOYEE, PM, and RM roles", () => {
      expect(
        validateUserEmployeeLinkage({ role: "EMPLOYEE", employeeId: null })
          .valid,
      ).toBe(false);
      expect(
        validateUserEmployeeLinkage({ role: "PROJECT_MANAGER", employeeId: "" })
          .valid,
      ).toBe(false);
      expect(
        validateUserEmployeeLinkage({
          role: "RESOURCE_MANAGER",
          employeeId: null,
        }).valid,
      ).toBe(false);
      expect(
        validateUserEmployeeLinkage({ role: "ADMIN", employeeId: null }).valid,
      ).toBe(true);
      expect(
        validateUserEmployeeLinkage({
          role: "EMPLOYEE",
          employeeId: "valid-uuid",
        }).valid,
      ).toBe(true);
      expect(
        validateUserEmployeeLinkage({
          role: "RESOURCE_MANAGER",
          employeeId: "valid-uuid",
        }).valid,
      ).toBe(true);
    });

    it("rejects creating user with non-existent employee ID via Admin API (HTTP 404)", async () => {
      const fakeUuid = "12345678-1234-4234-8234-123456789abc";
      const res = await request(app)
        .post("/api/v1/users")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          email: "invalid.linkage@staffora.internal",
          password: "ValidPassword123!",
          role: "EMPLOYEE",
          employeeId: fakeUuid,
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("rejects creating user with already-linked employee ID (HTTP 409 Conflict)", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          email: "duplicate.linkage@staffora.internal",
          password: "ValidPassword123!",
          role: "EMPLOYEE",
          employeeId: employeeOwnId,
        });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
      expect(res.body.message).toContain("already linked");
    });

    it("rejects creating EMPLOYEE user without employeeId linkage (HTTP 422)", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          email: `no.linkage.emp.${Date.now()}@staffora.internal`,
          password: "ValidPassword123!",
          role: "EMPLOYEE",
        });
      expect(res.status).toBe(422);
      expect(res.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(res.body.message).toContain("requires linkage");
    });

    it("rejects creating PROJECT_MANAGER user without employeeId linkage (HTTP 422)", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          email: `no.linkage.pm.${Date.now()}@staffora.internal`,
          password: "ValidPassword123!",
          role: "PROJECT_MANAGER",
        });
      expect(res.status).toBe(422);
      expect(res.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(res.body.message).toContain("requires linkage");
    });

    it("rejects creating RESOURCE_MANAGER user without employeeId linkage (HTTP 422)", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          email: `no.linkage.rm.${Date.now()}@staffora.internal`,
          password: "ValidPassword123!",
          role: "RESOURCE_MANAGER",
        });
      expect(res.status).toBe(422);
      expect(res.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(res.body.message).toContain("requires linkage");
    });

    it("rejects updating user to EMPLOYEE role without employee linkage (HTTP 422)", async () => {
      const createRes = await request(app)
        .post("/api/v1/users")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          email: `temp.admin.${Date.now()}@staffora.internal`,
          password: "ValidPassword123!",
          role: "ADMIN",
        });
      const tempUserId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/users/${tempUserId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          role: "EMPLOYEE",
        });
      expect(updateRes.status).toBe(422);
      expect(updateRes.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(updateRes.body.message).toContain("requires linkage");

      await prisma.user.delete({ where: { id: tempUserId } });
    });

    it("rejects updating user to RESOURCE_MANAGER role without employee linkage (HTTP 422)", async () => {
      const createRes = await request(app)
        .post("/api/v1/users")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          email: `temp.admin.rm.${Date.now()}@staffora.internal`,
          password: "ValidPassword123!",
          role: "ADMIN",
        });
      const tempUserId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/users/${tempUserId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          role: "RESOURCE_MANAGER",
        });
      expect(updateRes.status).toBe(422);
      expect(updateRes.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(updateRes.body.message).toContain("requires linkage");

      await prisma.user.delete({ where: { id: tempUserId } });
    });

    it("supports non-disclosure behavior throwing 404 instead of 403 when asserted", () => {
      expect(() => {
        assertPolicyOrNotFound(false, true, "Resource not found.");
      }).toThrowError("Resource not found.");
    });

    it("evaluates unit policy helpers deterministically", () => {
      const userPM = {
        id: "u1",
        email: "pm@test",
        role: ROLES.PROJECT_MANAGER,
        isActive: true,
        employeeId: "emp-1",
      };
      expect(isProjectManagerOwner(userPM, "emp-1")).toBe(true);
      expect(isProjectManagerOwner(userPM, "emp-2")).toBe(false);
      expect(isProjectManagerOwner(userPM, null)).toBe(false);
      expect(canManageProject(userPM, "emp-1")).toBe(true);
      expect(canManageProject(userPM, "emp-2")).toBe(false);

      const userAdmin = {
        id: "u0",
        email: "admin@test",
        role: ROLES.ADMIN,
        isActive: true,
        employeeId: null,
      };
      expect(canManageProject(userAdmin, "emp-other")).toBe(true);
      expect(canViewProject(userAdmin)).toBe(true);

      const userEmp = {
        id: "u2",
        email: "e@test",
        role: ROLES.EMPLOYEE,
        isActive: true,
        employeeId: "emp-2",
      };
      expect(canAccessEmployeeProfile(userEmp, "emp-2")).toBe(true);
      expect(canAccessEmployeeProfile(userEmp, "emp-1")).toBe(false);

      // Allocations policy helpers
      const userRM = {
        id: "u3",
        email: "rm@test",
        role: ROLES.RESOURCE_MANAGER,
        isActive: true,
        employeeId: null,
      };
      expect(canManageAllocation(userAdmin, "emp-any")).toBe(true);
      expect(canManageAllocation(userRM, "emp-any")).toBe(true);
      expect(canManageAllocation(userPM, "emp-1")).toBe(true);
      expect(canManageAllocation(userPM, "emp-other")).toBe(false);

      expect(() => assertCanManageProject(userPM, "emp-1")).not.toThrow();
      expect(() => assertCanManageProject(userPM, "emp-2")).toThrowError(
        "Project not found",
      );

      expect(() => assertCanManageAllocation(userPM, "emp-1")).not.toThrow();
      expect(() => assertCanManageAllocation(userPM, "emp-2")).toThrowError(
        "Allocation not found",
      );

      // Core assertAuth & assertRole
      expect(() => assertAuth(undefined)).toThrowError(
        "Authentication required",
      );
      expect(() => assertAuth({ ...userAdmin, isActive: false })).toThrowError(
        "inactive",
      );
      expect(() => assertAuth(userAdmin)).not.toThrow();

      expect(() => assertRole(userAdmin, [ROLES.ADMIN])).not.toThrow();
      expect(() => assertRole(userEmp, [ROLES.ADMIN])).toThrowError(
        "permission",
      );

      expect(() => assertPolicy(true)).not.toThrow();
      expect(() => assertPolicy(false)).toThrowError("permission");

      expect(assertLinkedEmployee(userPM)).toBe("emp-1");
      expect(() => assertLinkedEmployee(userAdmin)).toThrowError(
        "linked to an employee",
      );

      // projectsPolicy module helpers
      expect(projectsPolicy.canCreate(userAdmin)).toBe(true);
      expect(projectsPolicy.canCreate(userPM)).toBe(true);
      expect(projectsPolicy.canCreate(userEmp)).toBe(false);
      expect(projectsPolicy.canUpdate(userPM, "emp-1")).toBe(true);
      expect(projectsPolicy.canUpdate(userPM, "emp-2")).toBe(false);
      expect(projectsPolicy.canView(userAdmin)).toBe(true);
      expect(projectsPolicy.isOwner(userPM, "emp-1")).toBe(true);
      expect(projectsPolicy.isOwner(userPM, "emp-2")).toBe(false);
      expect(() =>
        projectsPolicy.assertCanUpdate(userPM, "emp-1"),
      ).not.toThrow();
      expect(() =>
        projectsPolicy.assertCanUpdate(userPM, "emp-2"),
      ).toThrowError("Project not found");

      // workforcePolicy module helpers
      expect(workforcePolicy.canViewEmployee(userEmp, "emp-2")).toBe(true);
      expect(workforcePolicy.canViewEmployee(userEmp, "emp-1")).toBe(false);
      expect(workforcePolicy.canManageEmployee(userAdmin)).toBe(true);
      expect(workforcePolicy.canManageEmployee(userRM)).toBe(true);
      expect(workforcePolicy.canManageEmployee(userEmp)).toBe(false);
      expect(() =>
        workforcePolicy.assertCanViewEmployee(userEmp, "emp-2"),
      ).not.toThrow();
      expect(() =>
        workforcePolicy.assertCanViewEmployee(userEmp, "emp-1"),
      ).toThrowError("Employee not found");

      // staffingPolicy module helpers
      expect(staffingPolicy.canManage(userPM, "emp-1")).toBe(true);
      expect(staffingPolicy.canManage(userPM, "emp-2")).toBe(false);
      expect(staffingPolicy.canManage(userAdmin, "emp-2")).toBe(true);
      expect(() =>
        staffingPolicy.assertCanManage(userPM, "emp-1"),
      ).not.toThrow();
      expect(() =>
        staffingPolicy.assertCanManage(userPM, "emp-2"),
      ).toThrowError("Staffing requirement not found");

      // allocationsPolicy module helpers
      expect(allocationsPolicy.canManage(userPM, "emp-1")).toBe(true);
      expect(allocationsPolicy.canManage(userPM, "emp-2")).toBe(false);
      expect(allocationsPolicy.canManage(userAdmin, "emp-2")).toBe(true);
      expect(() =>
        allocationsPolicy.assertCanManage(userPM, "emp-1"),
      ).not.toThrow();
      expect(() =>
        allocationsPolicy.assertCanManage(userPM, "emp-2"),
      ).toThrowError("Allocation not found");
    });

    it("covers RBAC middleware branches directly", () => {
      const mockReq = (user?: Partial<AuthenticatedUser>) =>
        ({ user }) as unknown as Request;
      const mockRes = {} as unknown as Response;

      // requireRole inactive or unauthenticated
      let errorThrown: unknown = null;
      const nextFn = (err?: unknown) => {
        errorThrown = err;
      };

      requireRole(ROLES.ADMIN)(mockReq(undefined), mockRes, nextFn);
      expect((errorThrown as AppError)?.statusCode).toBe(401);

      errorThrown = null;
      requireRole(ROLES.ADMIN)(
        mockReq({ role: ROLES.ADMIN, isActive: false }),
        mockRes,
        nextFn,
      );
      expect((errorThrown as AppError)?.statusCode).toBe(401);

      // requireLinkedEmployee middleware branches
      errorThrown = null;
      requireLinkedEmployeeMiddleware()(mockReq(undefined), mockRes, nextFn);
      expect((errorThrown as AppError)?.statusCode).toBe(401);

      errorThrown = null;
      requireLinkedEmployeeMiddleware()(
        mockReq({ isActive: true, employeeId: null }),
        mockRes,
        nextFn,
      );
      expect((errorThrown as AppError)?.statusCode).toBe(403);

      let passed = false;
      requireLinkedEmployeeMiddleware()(
        mockReq({ isActive: true, employeeId: "valid-id" }),
        mockRes,
        () => {
          passed = true;
        },
      );
      expect(passed).toBe(true);
    });

    it("preserves prior path parameters when validateParams is run in nested sub-routers (F29)", () => {
      const mockReq = {
        params: {
          id: "11111111-1111-1111-1111-111111111111",
          skillId: "22222222-2222-2222-2222-222222222222",
        },
      } as unknown as Request;
      const mockRes = {} as Response;
      let nextCalled = false;

      validateParams(skillIdParamSchema)(mockReq, mockRes, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect((mockReq.params as Record<string, string>).id).toBe(
        "11111111-1111-1111-1111-111111111111",
      );
      expect((mockReq.params as Record<string, string>).skillId).toBe(
        "22222222-2222-2222-2222-222222222222",
      );
    });
  });

  describe("8. Workforce RBAC & Controller Protection", () => {
    it("allows ADMIN to reach list and create departments (HTTP 501)", async () => {
      const listRes = await request(app)
        .get("/api/v1/departments")
        .set("Cookie", adminCookie);
      expect(listRes.status).toBe(501);
      expect(listRes.body.code).toBe("NOT_IMPLEMENTED");

      const createRes = await request(app)
        .post("/api/v1/departments")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({ code: `D-${Date.now()}`, name: `Dept ${Date.now()}` });
      expect(createRes.status).toBe(501);
      expect(createRes.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("allows ADMIN to reach list and create job roles (HTTP 501)", async () => {
      const listRes = await request(app)
        .get("/api/v1/job-roles")
        .set("Cookie", adminCookie);
      expect(listRes.status).toBe(501);
      expect(listRes.body.code).toBe("NOT_IMPLEMENTED");

      const createRes = await request(app)
        .post("/api/v1/job-roles")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({ departmentId: deptId, name: `Role-${Date.now()}` });
      expect(createRes.status).toBe(501);
      expect(createRes.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("allows ADMIN and RM to list employees (HTTP 501), but rejects EMPLOYEE (RBAC 403)", async () => {
      const adminRes = await request(app)
        .get("/api/v1/employees")
        .set("Cookie", adminCookie);
      expect(adminRes.status).toBe(501);
      expect(adminRes.body.code).toBe("NOT_IMPLEMENTED");

      const rmRes = await request(app)
        .get("/api/v1/employees")
        .set("Cookie", rmCookie);
      expect(rmRes.status).toBe(501);
      expect(rmRes.body.code).toBe("NOT_IMPLEMENTED");

      const empRes = await request(app)
        .get("/api/v1/employees")
        .set("Cookie", employeeCookie);
      expect(empRes.status).toBe(403);
      expect(empRes.body.code).toBe("FORBIDDEN");
    });

    it("allows ADMIN to reach update employee (HTTP 501), but rejects EMPLOYEE (RBAC 403)", async () => {
      const adminRes = await request(app)
        .patch(`/api/v1/employees/${otherEmployeeId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({ fullName: "Updated Full Name" });
      expect(adminRes.status).toBe(501);
      expect(adminRes.body.code).toBe("NOT_IMPLEMENTED");

      const empRes = await request(app)
        .patch(`/api/v1/employees/${otherEmployeeId}`)
        .set("Cookie", employeeCookie)
        .set("X-CSRF-Token", employeeCsrf)
        .send({ fullName: "Unauthorized Update" });
      expect(empRes.status).toBe(403);
    });

    it("allows ADMIN to reach create employee with valid CSRF (HTTP 501)", async () => {
      const createRes = await request(app)
        .post("/api/v1/employees")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({
          employeeCode: `EMP-${Date.now()}`,
          fullName: "New Test Employee",
          workEmail: `test.${Date.now()}@staffora.internal`,
          departmentId: deptId,
          jobRoleId: rolePMId,
        });
      expect(createRes.status).toBe(501);
      expect(createRes.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("covers workforce controller catch blocks and optional req.user branch", async () => {
      // getEmployeeDetail without req.user throws Unauthorized (fail-closed)
      let errorPassedToNext: unknown = null;
      const mockReqNoUser = {
        params: { id: otherEmployeeId },
      } as unknown as Request;
      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
      } as unknown as Response;
      await workforceController.getEmployeeDetail(
        mockReqNoUser,
        mockRes,
        (err) => {
          errorPassedToNext = err;
        },
      );
      expect(errorPassedToNext).toBeDefined();
      expect((errorPassedToNext as AppError).statusCode).toBe(401);

      // workforceController controller error catch handling
      let catchCalled = false;
      const nextFn = () => {
        catchCalled = true;
      };
      await workforceController.createDepartment(
        {} as Request,
        null as unknown as Response,
        nextFn,
      );
      expect(catchCalled).toBe(true);

      catchCalled = false;
      await workforceController.createJobRole(
        {} as Request,
        null as unknown as Response,
        nextFn,
      );
      expect(catchCalled).toBe(true);

      catchCalled = false;
      await workforceController.createEmployee(
        {} as Request,
        null as unknown as Response,
        nextFn,
      );
      expect(catchCalled).toBe(true);

      catchCalled = false;
      await workforceController.updateEmployee(
        {} as Request,
        null as unknown as Response,
        nextFn,
      );
      expect(catchCalled).toBe(true);
    });
  });

  describe("9. Identity, Allocations & Service-Level Enforcement Coverage", () => {
    it("covers identity service validation and linkage edge cases", async () => {
      const inactiveEmp = await prisma.employee.create({
        data: {
          employeeCode: `INACT-${Date.now()}`,
          fullName: "Inactive Employee",
          workEmail: `inactive.${Date.now()}@staffora.internal`,
          departmentId: deptId,
          jobRoleId: rolePMId,
          status: "INACTIVE",
        },
      });

      // authenticate edge cases
      await expect(
        identityService.authenticate("nonexistent@test.internal", "pass"),
      ).rejects.toThrowError("Invalid email or password");
      await expect(
        identityService.authenticate("admin@staffora.internal", "wrongpass"),
      ).rejects.toThrowError("Invalid email or password");

      // createUser with duplicate email
      await expect(
        identityService.createUser({
          email: "admin@staffora.internal",
          password: "Password123!",
          role: "ADMIN",
        }),
      ).rejects.toThrowError("already exists");

      // createUser with inactive employee
      await expect(
        identityService.createUser({
          email: `test.inact.${Date.now()}@staffora.internal`,
          password: "Password123!",
          role: "EMPLOYEE",
          employeeId: inactiveEmp.id,
        }),
      ).rejects.toThrowError("inactive employee");

      // updateUser non-existent user
      await expect(
        identityService.updateUser("00000000-0000-0000-0000-000000000000", {
          isActive: false,
        }),
      ).rejects.toThrowError("User not found");

      // updateUser non-existent employee linkage
      const seededAdmin = await prisma.user.findFirstOrThrow({
        where: { normalizedEmail: "admin@staffora.internal" },
      });
      await expect(
        identityService.updateUser(seededAdmin.id, {
          employeeId: "00000000-0000-0000-0000-000000000000",
        }),
      ).rejects.toThrowError("Linked employee record not found");

      // updateUser inactive employee linkage
      await expect(
        identityService.updateUser(seededAdmin.id, {
          employeeId: inactiveEmp.id,
        }),
      ).rejects.toThrowError("inactive employee");

      // updateUser with employee already linked to another user
      await expect(
        identityService.updateUser(seededAdmin.id, {
          employeeId: employeeOwnId,
        }),
      ).rejects.toThrowError("already linked");

      // updateUser valid update
      const updatedUser = await identityService.updateUser(seededAdmin.id, {
        isActive: true,
      });
      expect(updatedUser.isActive).toBe(true);

      await prisma.employee.delete({ where: { id: inactiveEmp.id } });
    });

    it("covers allocations service query and direct methods", async () => {
      const userPM = {
        id: "u-pm",
        email: "pm@test",
        role: ROLES.PROJECT_MANAGER,
        isActive: true,
        employeeId: pmEmployeeId,
      };
      await expect(
        allocationsService.getAllocations({}, userPM),
      ).rejects.toThrow("not implemented");

      await expect(
        allocationsService.getAllocationById("alloc-1", userPM),
      ).rejects.toThrow("not implemented");

      await expect(
        allocationsService.createAllocation(
          {
            projectId: pmOwnProjectId,
            employeeId: otherEmployeeId,
            jobRoleId: rolePMId,
            allocationPercentage: 50,
            startDate: "2026-11-01",
            endDate: "2026-12-01",
          },
          userPM,
        ),
      ).rejects.toThrow("not implemented");

      await expect(
        allocationsService.createAllocation(
          {
            projectId: "00000000-0000-0000-0000-000000000000",
            employeeId: otherEmployeeId,
            jobRoleId: rolePMId,
            allocationPercentage: 50,
            startDate: "2026-11-01",
            endDate: "2026-12-01",
          },
          userPM,
        ),
      ).rejects.toThrow("Project not found");
    });

    it("covers projects and staffing service direct queries", async () => {
      const userAdmin = {
        id: "u-admin",
        email: "admin@test",
        role: ROLES.ADMIN,
        isActive: true,
        employeeId: null,
      };
      await expect(projectsService.getProjects({}, userAdmin)).rejects.toThrow(
        "not implemented",
      );

      await expect(
        projectsService.createProject({}, userAdmin),
      ).rejects.toThrow("not implemented");

      await expect(
        staffingService.getRequirementsForProject(
          "00000000-0000-0000-0000-000000000000",
        ),
      ).rejects.toThrow("Project not found");
    });

    it("covers session, rate-limiter, and identity loader middleware branches", async () => {
      // 1. Session middleware with connection string branch
      const sessionHandler = createSessionMiddleware({
        useMemoryStore: false,
        connectionString:
          process.env.DATABASE_URL ||
          "postgresql://staffora:staffora_local@localhost:5432/staffora",
        isProduction: false,
      });
      expect(typeof sessionHandler).toBe("function");

      // 2. Rate limiter unauthenticated and exceed branches
      const mockReqUnauth = {
        socket: { remoteAddress: "127.0.0.99" },
      } as unknown as Request;
      let unauthPass = false;
      generalRateLimitMiddleware(mockReqUnauth, {} as Response, () => {
        unauthPass = true;
      });
      expect(unauthPass).toBe(true);

      // 3. Identity loader error and not-found branches
      const mockReqErr = {
        session: { userId: "invalid-id" },
      } as unknown as Request;
      let nextError: unknown = null;
      await identityLoaderMiddleware(mockReqErr, {} as Response, (err) => {
        nextError = err;
      });
      expect(nextError).toBeDefined();

      // User not found in database branch (valid UUID that does not exist in DB)
      let sessionRegenerated = false;
      const mockReqNotFound = {
        session: {
          userId: "00000000-0000-0000-0000-000000000000",
          regenerate: (cb: () => void) => {
            sessionRegenerated = true;
            cb();
          },
        },
      } as unknown as Request;
      let notFoundError: unknown = null;
      await identityLoaderMiddleware(mockReqNotFound, {} as Response, (err) => {
        notFoundError = err;
      });
      expect(notFoundError).toBeUndefined();
      expect(sessionRegenerated).toBe(true);
    });
  });

  describe("10. Sprint 1 Not Implemented Endpoints & Parameter Validation (F15, F22)", () => {
    it("returns 501 Not Implemented for GET /dashboard", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for GET /me", async () => {
      const res = await request(app)
        .get("/api/v1/me")
        .set("Cookie", employeeCookie);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for GET /skills", async () => {
      const res = await request(app)
        .get("/api/v1/skills")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for POST /skills with valid payload", async () => {
      const res = await request(app)
        .post("/api/v1/skills")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({ name: "TypeScript", category: "TECHNICAL" });
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for PATCH /employees/:id/skills/:skillId with valid UUIDs", async () => {
      const validSkillId = randomUUID();
      const res = await request(app)
        .patch(`/api/v1/employees/${employeeOwnId}/skills/${validSkillId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({ proficiencyLevel: 4 });
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for DELETE /employees/:id/skills/:skillId with valid UUIDs (F29)", async () => {
      const validSkillId = randomUUID();
      const res = await request(app)
        .delete(`/api/v1/employees/${employeeOwnId}/skills/${validSkillId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for GET /capacity", async () => {
      const res = await request(app)
        .get("/api/v1/capacity")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for GET /capacity/employees/:id with valid UUID", async () => {
      const res = await request(app)
        .get(`/api/v1/capacity/employees/${employeeOwnId}`)
        .set("Cookie", adminCookie);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 501 Not Implemented for GET /resource-finder with valid query", async () => {
      const res = await request(app)
        .get("/api/v1/resource-finder?startDate=2026-11-01&endDate=2026-11-30")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(501);
      expect(res.body.code).toBe("NOT_IMPLEMENTED");
    });

    it("returns 422 for invalid UUID :id parameters (F22)", async () => {
      const invalidId = "not-a-valid-uuid";

      const endpoints = [
        `/api/v1/employees/${invalidId}`,
        `/api/v1/projects/${invalidId}`,
        `/api/v1/allocations/${invalidId}`,
        `/api/v1/capacity/employees/${invalidId}`,
        `/api/v1/employees/${invalidId}/skills`,
        `/api/v1/projects/${invalidId}/staffing-requirements`,
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint).set("Cookie", adminCookie);
        expect(res.status).toBe(422);
        expect(res.body.code).toBe("UNPROCESSABLE_ENTITY");
        expect(res.body.errors?.id).toContain("Invalid UUID format.");
      }
    });

    it("returns 422 for invalid UUID :skillId parameter (F22)", async () => {
      const invalidSkillId = "not-a-valid-uuid";
      const patchRes = await request(app)
        .patch(`/api/v1/employees/${employeeOwnId}/skills/${invalidSkillId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf)
        .send({ proficiencyLevel: 3 });
      expect(patchRes.status).toBe(422);
      expect(patchRes.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(patchRes.body.errors?.skillId).toContain("Invalid UUID format.");

      const deleteRes = await request(app)
        .delete(`/api/v1/employees/${employeeOwnId}/skills/${invalidSkillId}`)
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", adminCsrf);
      expect(deleteRes.status).toBe(422);
      expect(deleteRes.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(deleteRes.body.errors?.skillId).toContain("Invalid UUID format.");
    });
  });
});
