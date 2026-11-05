import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/common/database/prisma.js";
import { postLogin } from "./support/auth-login.js";

// US03.01 Project Management API: role scope, validation, lifecycle, pagination.
// Relies on seeded PRJ-STAFFORA-01 (pm@, employee@ allocated) and PRJ-STAFFORA-02 (pm2@).

interface Session {
  cookie: string;
  csrf: string;
  employeeId: string | null;
}

const PREFIX = `TEST-US0301-${Date.now()}`;

describe("Projects API (PRD US03.01)", () => {
  const app = createApp({ useMemorySession: true });
  let admin: Session;
  let pm: Session;
  let rm: Session;
  let employee: Session;
  let seq = 0;

  async function login(email: string, password: string): Promise<Session> {
    const res = await postLogin(app, { email, password });
    expect(res.status).toBe(200);
    return {
      cookie: res.headers["set-cookie"]?.[0] ?? "",
      csrf: res.body.data.csrfToken,
      employeeId: res.body.data.user.employeeId ?? null,
    };
  }

  function nextCode(): string {
    seq += 1;
    return `${PREFIX}-${seq}`;
  }

  function post(s: Session, body: Record<string, unknown>): request.Test {
    return request(app)
      .post("/api/v1/projects")
      .set("Cookie", s.cookie)
      .set("X-CSRF-Token", s.csrf)
      .send(body);
  }

  function patch(
    s: Session,
    id: string,
    body: Record<string, unknown>,
  ): request.Test {
    return request(app)
      .patch(`/api/v1/projects/${id}`)
      .set("Cookie", s.cookie)
      .set("X-CSRF-Token", s.csrf)
      .send(body);
  }

  function list(s: Session, query = ""): request.Test {
    return request(app).get(`/api/v1/projects${query}`).set("Cookie", s.cookie);
  }

  async function createAsAdmin(
    overrides: Record<string, unknown> = {},
  ): Promise<{ id: string; projectCode: string; status: string }> {
    const res = await post(admin, {
      projectCode: nextCode(),
      name: "US03.01 Fixture",
      projectManagerEmployeeId: pm.employeeId,
      startDate: "2026-11-01",
      endDate: "2026-12-31",
      status: "DRAFT",
      ...overrides,
    });
    expect(res.status).toBe(201);
    return res.body.data;
  }

  const codesOf = (res: request.Response): string[] =>
    (res.body.data as { projectCode: string }[]).map((p) => p.projectCode);

  beforeAll(async () => {
    admin = await login("admin@staffora.internal", "StafforaAdmin2026!");
    pm = await login("pm@staffora.internal", "StafforaPM2026!");
    rm = await login("rm@staffora.internal", "StafforaRM2026!");
    employee = await login("employee@staffora.internal", "StafforaEmp2026!");
  });

  afterAll(async () => {
    await prisma.project.deleteMany({
      where: { projectCode: { startsWith: PREFIX } },
    });
  });

  describe("role-scoped list", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app).get("/api/v1/projects");
      expect(res.status).toBe(401);
    });

    it("ADMIN and RESOURCE_MANAGER see all projects", async () => {
      for (const s of [admin, rm]) {
        const res = await list(s, "?pageSize=100&search=PRJ-STAFFORA");
        expect(res.status).toBe(200);
        expect(codesOf(res)).toEqual(
          expect.arrayContaining(["PRJ-STAFFORA-01", "PRJ-STAFFORA-02"]),
        );
      }
    });

    it("PROJECT_MANAGER sees only projects they manage", async () => {
      const res = await list(pm, "?pageSize=100");
      expect(res.status).toBe(200);
      expect(codesOf(res)).toContain("PRJ-STAFFORA-01");
      expect(codesOf(res)).not.toContain("PRJ-STAFFORA-02");
      for (const p of res.body.data) {
        expect(p.projectManagerEmployeeId).toBe(pm.employeeId);
      }
    });

    it("EMPLOYEE sees only projects with their non-cancelled allocation", async () => {
      const res = await list(employee, "?pageSize=100");
      expect(res.status).toBe(200);
      expect(codesOf(res)).toContain("PRJ-STAFFORA-01");
      expect(codesOf(res)).not.toContain("PRJ-STAFFORA-02");
    });

    it("EMPLOYEE gets 404 on a project outside their scope", async () => {
      const other = await prisma.project.findUniqueOrThrow({
        where: { projectCode: "PRJ-STAFFORA-02" },
      });
      const res = await request(app)
        .get(`/api/v1/projects/${other.id}`)
        .set("Cookie", employee.cookie);
      expect(res.status).toBe(404);
    });

    it("returns pagination meta and applies status/search filters", async () => {
      await createAsAdmin({ status: "PLANNED" });
      await createAsAdmin({ status: "PLANNED" });
      const res = await list(
        admin,
        `?search=${PREFIX}&status=PLANNED&page=1&pageSize=1`,
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.pageSize).toBe(1);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.totalPages).toBe(res.body.meta.total);
      expect(res.body.data[0].status).toBe("PLANNED");
    });
  });

  describe("create", () => {
    it("RESOURCE_MANAGER and EMPLOYEE get 403", async () => {
      for (const s of [rm, employee]) {
        const res = await post(s, {
          projectCode: nextCode(),
          name: "Forbidden",
          projectManagerEmployeeId: pm.employeeId,
          startDate: "2026-11-01",
          endDate: "2026-11-30",
        });
        expect(res.status).toBe(403);
      }
    });

    it("rejects end date before start date with 422", async () => {
      const res = await post(admin, {
        projectCode: nextCode(),
        name: "Bad period",
        projectManagerEmployeeId: pm.employeeId,
        startDate: "2026-11-10",
        endDate: "2026-11-01",
      });
      expect(res.status).toBe(422);
    });

    it("accepts a same-day project (inclusive period) with 201", async () => {
      const project = await createAsAdmin({
        startDate: "2026-11-15",
        endDate: "2026-11-15",
      });
      expect(project.status).toBe("DRAFT");
    });

    it("PROJECT_MANAGER can create a project they manage", async () => {
      const res = await post(pm, {
        projectCode: nextCode(),
        name: "PM own",
        projectManagerEmployeeId: pm.employeeId,
        startDate: "2026-11-01",
        endDate: "2026-11-30",
      });
      expect(res.status).toBe(201);
      expect(res.body.data.projectManagerEmployeeId).toBe(pm.employeeId);
    });

    it("rejects a duplicate project code with 409 DUPLICATE_PROJECT_CODE", async () => {
      const first = await createAsAdmin();
      const res = await post(admin, {
        projectCode: first.projectCode,
        name: "Duplicate",
        projectManagerEmployeeId: pm.employeeId,
        startDate: "2026-11-01",
        endDate: "2026-11-30",
      });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DUPLICATE_PROJECT_CODE");
    });
  });

  describe("update", () => {
    it("PROJECT_MANAGER gets 404 updating another PM's project", async () => {
      const other = await prisma.project.findUniqueOrThrow({
        where: { projectCode: "PRJ-STAFFORA-02" },
      });
      const res = await patch(pm, other.id, { name: "Hijack" });
      expect(res.status).toBe(404);
    });

    it("rejects a single-field update that makes end < start with 422", async () => {
      const project = await createAsAdmin();
      const res = await patch(admin, project.id, { endDate: "2026-10-01" });
      expect(res.status).toBe(422);
    });

    it("rejects an invalid lifecycle transition with 409", async () => {
      const project = await createAsAdmin({ status: "DRAFT" });
      const res = await patch(admin, project.id, { status: "COMPLETED" });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("applies a valid transition with 200", async () => {
      const project = await createAsAdmin({ status: "DRAFT" });
      const res = await patch(pm, project.id, { status: "PLANNED" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("PLANNED");
    });

    it("treats ARCHIVED projects as read-only (409 PROJECT_ARCHIVED)", async () => {
      const project = await createAsAdmin({ status: "ACTIVE" });
      expect(
        (await patch(admin, project.id, { status: "COMPLETED" })).status,
      ).toBe(200);
      expect(
        (await patch(admin, project.id, { status: "ARCHIVED" })).status,
      ).toBe(200);
      const res = await patch(admin, project.id, { name: "Late edit" });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("PROJECT_ARCHIVED");
      const detail = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set("Cookie", admin.cookie);
      expect(detail.status).toBe(200);
    });

    it("blocks shrinking the period below existing allocations (409 PERIOD_CONFLICT)", async () => {
      const seeded = await prisma.project.findUniqueOrThrow({
        where: { projectCode: "PRJ-STAFFORA-01" },
      });
      const res = await patch(admin, seeded.id, { endDate: "2026-10-10" });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("PERIOD_CONFLICT");
    });
  });
});
