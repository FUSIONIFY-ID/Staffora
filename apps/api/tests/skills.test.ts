import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/common/database/prisma.js";
import { Prisma } from "../src/generated/prisma/client.js";
import { fetchCsrfSession } from "./support/auth-login.js";
import {
  MISSING_ID,
  app,
  createEmployeeViaApi,
  fixture,
  isoDate,
  login,
  setupWorkforceFixture,
  teardownWorkforceFixture,
  unique,
  writeReq,
} from "./support/workforce-fixture.js";
import type { Session } from "./support/workforce-fixture.js";

/**
 * Every skill this suite creates carries this run-unique prefix, so teardown can
 * find the rows again by name even when a test failed before it could record an
 * id. The prefix is also what scopes the `q` filter assertions, so a catalog
 * shared with other suites and leftover rows cannot make them pass or fail by
 * accident.
 */
const SKILL_PREFIX = unique("SKT");

function skillName(label: string): string {
  return `${SKILL_PREFIX} ${label}`;
}

interface SkillBody {
  id: string;
  name: string;
  isActive: boolean;
}

interface EmployeeSkillBody {
  id: string;
  skillId: string;
  skillName: string;
  skillIsActive: boolean;
  proficiencyLevel: number;
}

async function createSkill(session: Session, name: string): Promise<SkillBody> {
  const res = await writeReq(session, "post", "/api/v1/skills").send({ name });
  expect(res.status, `create skill ${name}`).toBe(201);
  return res.body.data as SkillBody;
}

/** Creates an employee owned by this suite through the real API, like the workforce suite. */
async function createEmployee(session: Session): Promise<string> {
  const employee = await createEmployeeViaApi(session);
  return employee.id;
}

function assignSkill(
  session: Session,
  employeeId: string,
  skillId: string,
  proficiencyLevel: number,
): request.Test {
  return writeReq(
    session,
    "post",
    `/api/v1/employees/${employeeId}/skills`,
  ).send({ skillId, proficiencyLevel });
}

async function listEmployeeSkills(
  session: Session,
  employeeId: string,
  query: { page?: number; pageSize?: number } = {},
): Promise<request.Response> {
  return request(app)
    .get(`/api/v1/employees/${employeeId}/skills`)
    .query(query)
    .set("Cookie", session.cookie);
}

/**
 * Creates the project row directly, the way the workforce fixture does:
 * `POST /projects` is still a Sprint 1 scaffold that answers 501, while the
 * staffing requirement itself is created through the real API. `projectCode`
 * carries the skill prefix so teardown can find the project and its staffing
 * requirements again without every test remembering an id.
 *
 * `projectCode` is unique in the database, so a run that needs more than one
 * project passes a label that becomes part of the code; every code still starts
 * with `SKILL_PREFIX`, which is what `removeCreatedProjects` matches on.
 */
async function createProject(label?: string): Promise<string> {
  const project = await prisma.project.create({
    data: {
      projectCode:
        label === undefined ? SKILL_PREFIX : `${SKILL_PREFIX}-${label}`,
      name: `${SKILL_PREFIX} Staffing Project${label === undefined ? "" : ` ${label}`}`,
      // Required by the schema; an ADMIN may manage any project regardless of
      // who is named here.
      projectManagerEmployeeId: fixture.employeeId,
      startDate: new Date(`${isoDate(0)}T00:00:00.000Z`),
      endDate: new Date(`${isoDate(30)}T00:00:00.000Z`),
    },
    select: { id: true },
  });
  return project.id;
}

/** One skill attachment as the staffing requirement endpoints take it. */
interface RequirementSkill {
  skillId: string;
  minimumProficiencyLevel: number;
}

function staffingRequirementsPath(projectId: string): string {
  return `/api/v1/projects/${projectId}/staffing-requirements`;
}

/**
 * The body `POST /projects/{id}/staffing-requirements` expects. `jobRoleId` is
 * read from the fixture at call time, because the fixture is only populated by
 * `beforeAll`.
 */
function staffingRequirementBody(
  skills?: RequirementSkill[],
): Record<string, unknown> {
  return {
    jobRoleId: fixture.jobRoleId,
    headcount: 1,
    allocationPercentage: 50,
    startDate: isoDate(1),
    endDate: isoDate(30),
    ...(skills === undefined ? {} : { skills }),
  };
}

/**
 * Creates a project owned by this suite plus one staffing requirement through
 * the real API, which is the setup every regression test below needs. The
 * label keeps `projectCode` unique per project and still inside the prefix, so
 * `removeCreatedProjects` finds it.
 */
async function createProjectAndRequirement(
  session: Session,
  skills: RequirementSkill[],
  label: string,
): Promise<{ projectId: string; requirementId: string }> {
  const projectId = await createProject(label);
  const created = await writeReq(
    session,
    "post",
    staffingRequirementsPath(projectId),
  ).send(staffingRequirementBody(skills));
  expect(created.status, `create requirement (${label})`).toBe(201);
  return { projectId, requirementId: created.body.data.id as string };
}

/** Deactivates a skill through the API, the way an Admin retires one (AC01.04). */
async function deactivateSkill(
  session: Session,
  skillId: string,
): Promise<void> {
  const res = await writeReq(
    session,
    "patch",
    `/api/v1/skills/${skillId}`,
  ).send({ isActive: false });
  expect(res.status, `deactivate ${skillId}`).toBe(200);
  expect(res.body.data.isActive).toBe(false);
}

/** DELETE /employees/{id}/skills/{skillId} with the CSRF token a write needs. */
function removeAssignment(
  session: Session,
  employeeId: string,
  skillId: string,
): request.Test {
  return request(app)
    .delete(`/api/v1/employees/${employeeId}/skills/${skillId}`)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken);
}

/**
 * Removes the projects this suite created together with their staffing
 * requirements. The join rows point at the skills below, so they have to go
 * first or the skill cleanup hits a foreign key.
 */
async function removeCreatedProjects(): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { projectCode: { startsWith: SKILL_PREFIX } },
    select: { id: true },
  });

  const projectIds = projects.map((project) => project.id);
  if (projectIds.length === 0) {
    return;
  }

  const requirements = await prisma.staffingRequirement.findMany({
    where: { projectId: { in: projectIds } },
    select: { id: true },
  });
  const requirementIds = requirements.map((requirement) => requirement.id);

  if (requirementIds.length > 0) {
    await prisma.staffingRequirementSkill.deleteMany({
      where: { staffingRequirementId: { in: requirementIds } },
    });
  }

  await prisma.staffingRequirement.deleteMany({
    where: { projectId: { in: projectIds } },
  });
  await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
}

/**
 * Removes every row this suite created.
 *
 * Assignments are deleted before the skills they point at, and both are found
 * through the name prefix rather than through ids remembered by each test, so a
 * test that failed halfway still leaves nothing behind. Only skills carrying
 * this run's prefix are touched, which keeps the workforce fixture's own skill
 * and its assignments intact.
 */
async function removeCreatedSkills(): Promise<void> {
  const skills = await prisma.skill.findMany({
    where: { name: { startsWith: SKILL_PREFIX, mode: "insensitive" } },
    select: { id: true },
  });

  const skillIds = skills.map((skill) => skill.id);
  if (skillIds.length === 0) {
    return;
  }

  await prisma.employeeSkill.deleteMany({
    where: { skillId: { in: skillIds } },
  });
  await prisma.skill.deleteMany({ where: { id: { in: skillIds } } });
}

describe("Skills Catalog and Employee Skills API (US02.02)", () => {
  beforeAll(setupWorkforceFixture);
  afterAll(async () => {
    try {
      // Join rows point at the skills, so the project cleanup has to run first.
      await removeCreatedProjects();
    } finally {
      try {
        await removeCreatedSkills();
      } finally {
        // Runs even when the row cleanup throws, so a broken assertion cannot
        // also leak the accounts, employees, and departments of the shared
        // fixture.
        await teardownWorkforceFixture();
      }
    }
  });

  describe("catalog creation (AC01.01, AC01.02)", () => {
    it("lets an Admin and a Resource Manager create a skill and blocks other roles", async () => {
      const admin = await login("admin");
      const resourceManager = await login("resourceManager");
      const projectManager = await login("projectManager");
      const employee = await login("employee");

      const adminName = skillName("Admin Created");
      const adminCreate = await writeReq(admin, "post", "/api/v1/skills").send({
        name: adminName,
      });
      expect(adminCreate.status).toBe(201);
      expect(adminCreate.body.data).toMatchObject({
        name: adminName,
        isActive: true,
      });
      expect(adminCreate.body.data.id).toEqual(expect.any(String));

      const rmName = skillName("Resource Manager Created");
      const rmCreate = await writeReq(
        resourceManager,
        "post",
        "/api/v1/skills",
      ).send({ name: rmName });
      expect(rmCreate.status).toBe(201);
      expect(rmCreate.body.data).toMatchObject({
        name: rmName,
        isActive: true,
      });

      const pmName = skillName("Project Manager Denied");
      const pmCreate = await writeReq(
        projectManager,
        "post",
        "/api/v1/skills",
      ).send({ name: pmName });
      expect(pmCreate.status).toBe(403);
      expect(pmCreate.body.code).toBe("FORBIDDEN");

      const employeeName = skillName("Employee Denied");
      const employeeCreate = await writeReq(
        employee,
        "post",
        "/api/v1/skills",
      ).send({ name: employeeName });
      expect(employeeCreate.status).toBe(403);
      expect(employeeCreate.body.code).toBe("FORBIDDEN");

      // A 403 alone does not prove the row was not written, so the catalog is
      // asked directly.
      const deniedRows = await prisma.skill.count({
        where: { name: { in: [pmName, employeeName] } },
      });
      expect(deniedRows).toBe(0);
    });

    it("rejects an empty or missing name with a 422 that names the field", async () => {
      const admin = await login("admin");

      const emptyName = await writeReq(admin, "post", "/api/v1/skills").send({
        name: "",
      });
      expect(emptyName.status).toBe(422);
      expect(emptyName.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(emptyName.body.errors.name).toBeDefined();

      const missingName = await writeReq(admin, "post", "/api/v1/skills").send(
        {},
      );
      expect(missingName.status).toBe(422);
      expect(missingName.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(missingName.body.errors.name).toBeDefined();
    });
  });

  describe("catalog uniqueness (AC01.03)", () => {
    it("rejects lower-case and upper-case duplicates with 409 DUPLICATE_SKILL_NAME", async () => {
      const admin = await login("admin");
      const name = skillName("React");

      const created = await writeReq(admin, "post", "/api/v1/skills").send({
        name,
      });
      expect(created.status).toBe(201);

      for (const variant of [name.toLowerCase(), name.toUpperCase()]) {
        const duplicate = await writeReq(admin, "post", "/api/v1/skills").send({
          name: variant,
        });
        expect(duplicate.status, variant).toBe(409);
        expect(duplicate.body.code, variant).toBe("DUPLICATE_SKILL_NAME");
      }

      const stored = await prisma.skill.findMany({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true },
      });
      expect(stored).toHaveLength(1);
    });

    it("creates exactly one row when two case-variant creates race", async () => {
      const admin = await login("admin");
      const name = skillName("Concurrent");

      // Both requests can pass a pre-flight lookup, so the unique index on
      // lower(name) is what has to stop the second one; the mapping from that
      // database violation back to DUPLICATE_SKILL_NAME is what this asserts.
      const results = await Promise.all([
        writeReq(admin, "post", "/api/v1/skills").send({ name }),
        writeReq(admin, "post", "/api/v1/skills").send({
          name: name.toUpperCase(),
        }),
      ]);

      const statuses = results.map((res) => res.status).sort((a, b) => a - b);
      expect(statuses).toEqual([201, 409]);

      const loser = results.find((res) => res.status === 409);
      expect(loser?.body.code).toBe("DUPLICATE_SKILL_NAME");

      const stored = await prisma.skill.findMany({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true },
      });
      expect(stored).toHaveLength(1);
    });

    it("rejects a rename that collides case-insensitively with another skill", async () => {
      const admin = await login("admin");
      const source = await createSkill(admin, skillName("Rename Source"));
      const target = await createSkill(admin, skillName("Rename Target"));

      const renamed = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${source.id}`,
      ).send({ name: target.name.toUpperCase() });

      expect(renamed.status).toBe(409);
      expect(renamed.body.code).toBe("DUPLICATE_SKILL_NAME");

      const unchanged = await prisma.skill.findUnique({
        where: { id: source.id },
        select: { name: true },
      });
      expect(unchanged?.name).toBe(source.name);
    });
  });

  describe("catalog lifecycle (AC01.04, AC01.05, BR03)", () => {
    it("deactivates a skill and rejects an empty body or an unknown id", async () => {
      const admin = await login("admin");
      const skill = await createSkill(admin, skillName("Deactivate Me"));

      const deactivated = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${skill.id}`,
      ).send({ isActive: false });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.data).toMatchObject({
        id: skill.id,
        isActive: false,
      });

      // Deactivation is a flag, not a delete: the row stays in the catalog.
      const stillListed = await prisma.skill.findUnique({
        where: { id: skill.id },
        select: { isActive: true },
      });
      expect(stillListed?.isActive).toBe(false);

      const emptyBody = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${skill.id}`,
      ).send({});
      expect(emptyBody.status).toBe(422);
      expect(emptyBody.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(Object.keys(emptyBody.body.errors).length).toBeGreaterThan(0);

      const unknown = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${MISSING_ID}`,
      ).send({ isActive: false });
      expect(unknown.status).toBe(404);
      expect(unknown.body.code).toBe("NOT_FOUND");
    });

    it("rejects a new assignment of a deactivated skill with 422 SKILL_INACTIVE", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("Retired Skill"));

      const deactivated = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${skill.id}`,
      ).send({ isActive: false });
      expect(deactivated.status).toBe(200);

      const assigned = await assignSkill(admin, employeeId, skill.id, 3);
      expect(assigned.status).toBe(422);
      expect(assigned.body.code).toBe("SKILL_INACTIVE");

      const stored = await prisma.employeeSkill.count({
        where: { employeeId, skillId: skill.id },
      });
      expect(stored).toBe(0);
    });

    it("rejects attaching a deactivated skill to a staffing requirement (AC01.05, BR02)", async () => {
      const admin = await login("admin");
      const activeSkill = await createSkill(
        admin,
        skillName("Staffing Active"),
      );
      const retiredSkill = await createSkill(
        admin,
        skillName("Staffing Retired"),
      );
      const projectId = await createProject();

      const requirementBody = {
        jobRoleId: fixture.jobRoleId,
        headcount: 1,
        allocationPercentage: 50,
        startDate: isoDate(1),
        endDate: isoDate(30),
      };
      const staffingPath = `/api/v1/projects/${projectId}/staffing-requirements`;

      // An active skill still attaches, so the guard cannot be passing by
      // rejecting every staffing requirement.
      const accepted = await writeReq(admin, "post", staffingPath).send({
        ...requirementBody,
        skills: [{ skillId: activeSkill.id, minimumProficiencyLevel: 3 }],
      });
      expect(accepted.status).toBe(201);
      expect(
        await prisma.staffingRequirementSkill.count({
          where: { skillId: activeSkill.id },
        }),
      ).toBe(1);

      const deactivated = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${retiredSkill.id}`,
      ).send({ isActive: false });
      expect(deactivated.status).toBe(200);

      const rejected = await writeReq(admin, "post", staffingPath).send({
        ...requirementBody,
        skills: [{ skillId: retiredSkill.id, minimumProficiencyLevel: 3 }],
      });
      expect(rejected.status).toBe(422);
      expect(rejected.body.code).toBe("SKILL_INACTIVE");
      expect(rejected.body.errors.skillId).toBeDefined();

      // The rejected request must not have left a join row behind.
      expect(
        await prisma.staffingRequirementSkill.count({
          where: { skillId: retiredSkill.id },
        }),
      ).toBe(0);
      expect(
        await prisma.staffingRequirement.count({ where: { projectId } }),
      ).toBe(1);

      // The update path deletes and recreates every join row, so it is a new
      // assignment too and has to be rejected before the delete runs.
      const requirementId = accepted.body.data.id as string;
      const updated = await writeReq(
        admin,
        "patch",
        `/api/v1/staffing-requirements/${requirementId}`,
      ).send({
        skills: [{ skillId: retiredSkill.id, minimumProficiencyLevel: 4 }],
      });
      expect(updated.status).toBe(422);
      expect(updated.body.code).toBe("SKILL_INACTIVE");

      expect(
        await prisma.staffingRequirementSkill.count({
          where: { staffingRequirementId: requirementId },
        }),
      ).toBe(1);
      expect(
        await prisma.staffingRequirementSkill.count({
          where: {
            staffingRequirementId: requirementId,
            skillId: retiredSkill.id,
          },
        }),
      ).toBe(0);
    });

    it("keeps an assignment readable after its skill is deactivated (BR03)", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("Historic Skill"));

      const assigned = await assignSkill(admin, employeeId, skill.id, 4);
      expect(assigned.status).toBe(201);

      const deactivated = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${skill.id}`,
      ).send({ isActive: false });
      expect(deactivated.status).toBe(200);

      const list = await listEmployeeSkills(admin, employeeId);
      expect(list.status).toBe(200);
      expect(list.body.meta).toMatchObject({ page: 1, pageSize: 20 });
      expect(list.body.meta.total).toBeGreaterThanOrEqual(1);
      expect(list.body.meta.totalPages).toBeGreaterThanOrEqual(1);

      const rows = list.body.data as EmployeeSkillBody[];
      expect(rows.find((row) => row.skillId === skill.id)).toMatchObject({
        skillName: skill.name,
        proficiencyLevel: 4,
        skillIsActive: false,
      });
    });
  });

  describe("employee skill assignment (AC02.01, AC02.02, BR01)", () => {
    it("assigns a skill as Admin and as Resource Manager and blocks a Project Manager", async () => {
      const admin = await login("admin");
      const resourceManager = await login("resourceManager");
      const projectManager = await login("projectManager");

      const skill = await createSkill(admin, skillName("Assignable"));

      const adminEmployee = await createEmployee(admin);
      const byAdmin = await assignSkill(admin, adminEmployee, skill.id, 3);
      expect(byAdmin.status).toBe(201);
      expect(byAdmin.body.data).toMatchObject({
        skillId: skill.id,
        skillName: skill.name,
        skillIsActive: true,
        proficiencyLevel: 3,
      });
      expect(byAdmin.body.data.id).toEqual(expect.any(String));

      const rmEmployee = await createEmployee(admin);
      const byResourceManager = await assignSkill(
        resourceManager,
        rmEmployee,
        skill.id,
        2,
      );
      expect(byResourceManager.status).toBe(201);
      expect(byResourceManager.body.data).toMatchObject({
        skillId: skill.id,
        proficiencyLevel: 2,
      });

      const pmEmployee = await createEmployee(admin);
      const byProjectManager = await assignSkill(
        projectManager,
        pmEmployee,
        skill.id,
        3,
      );
      expect(byProjectManager.status).toBe(403);
      expect(byProjectManager.body.code).toBe("FORBIDDEN");

      const pmRows = await prisma.employeeSkill.count({
        where: { employeeId: pmEmployee, skillId: skill.id },
      });
      expect(pmRows).toBe(0);
    });

    it("removes an assignment with 204 and keeps the skill in the catalog", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("Removable"));

      const assigned = await assignSkill(admin, employeeId, skill.id, 3);
      expect(assigned.status).toBe(201);

      const removed = await request(app)
        .delete(`/api/v1/employees/${employeeId}/skills/${skill.id}`)
        .set("Cookie", admin.cookie)
        .set("X-CSRF-Token", admin.csrfToken);
      expect(removed.status).toBe(204);

      const list = await listEmployeeSkills(admin, employeeId);
      expect(list.status).toBe(200);
      expect(list.body.meta).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      });
      expect(list.body.data).toEqual([]);

      const skillRow = await prisma.skill.findUnique({
        where: { id: skill.id },
        select: { id: true },
      });
      expect(skillRow?.id).toBe(skill.id);

      const removedAgain = await request(app)
        .delete(`/api/v1/employees/${employeeId}/skills/${skill.id}`)
        .set("Cookie", admin.cookie)
        .set("X-CSRF-Token", admin.csrfToken);
      expect(removedAgain.status).toBe(404);
      expect(removedAgain.body.code).toBe("NOT_FOUND");
    });

    it("requires a proficiency level and rejects values outside 1 to 5", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("Proficiency Rules"));

      const missing = await writeReq(
        admin,
        "post",
        `/api/v1/employees/${employeeId}/skills`,
      ).send({ skillId: skill.id });
      expect(missing.status).toBe(422);
      expect(missing.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(missing.body.errors.proficiencyLevel).toBeDefined();

      for (const level of [0, 6]) {
        const rejected = await assignSkill(admin, employeeId, skill.id, level);
        expect(rejected.status, `level ${level}`).toBe(422);
        expect(rejected.body.code, `level ${level}`).toBe(
          "UNPROCESSABLE_ENTITY",
        );
        expect(
          rejected.body.errors.proficiencyLevel,
          `level ${level}`,
        ).toBeDefined();
      }

      const stored = await prisma.employeeSkill.count({
        where: { employeeId, skillId: skill.id },
      });
      expect(stored).toBe(0);
    });

    it("accepts levels 1 and 5 and rejects 0 and 6 (BR01)", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const lowest = await createSkill(admin, skillName("Level One"));
      const highest = await createSkill(admin, skillName("Level Five"));

      const levelOne = await assignSkill(admin, employeeId, lowest.id, 1);
      expect(levelOne.status).toBe(201);
      expect(levelOne.body.data.proficiencyLevel).toBe(1);

      const levelFive = await assignSkill(admin, employeeId, highest.id, 5);
      expect(levelFive.status).toBe(201);
      expect(levelFive.body.data.proficiencyLevel).toBe(5);

      const otherEmployee = await createEmployee(admin);
      const outside = await createSkill(admin, skillName("Level Outside"));

      for (const level of [0, 6]) {
        const rejected = await assignSkill(
          admin,
          otherEmployee,
          outside.id,
          level,
        );
        expect(rejected.status, `level ${level}`).toBe(422);
        expect(rejected.body.code, `level ${level}`).toBe(
          "UNPROCESSABLE_ENTITY",
        );
        expect(rejected.body.errors.proficiencyLevel).toBeDefined();
      }
    });

    it("returns 404 when the employee or the skill does not exist", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("Missing Reference"));

      const missingEmployee = await assignSkill(admin, MISSING_ID, skill.id, 3);
      expect(missingEmployee.status).toBe(404);
      expect(missingEmployee.body.code).toBe("NOT_FOUND");

      const missingSkill = await assignSkill(admin, employeeId, MISSING_ID, 3);
      expect(missingSkill.status).toBe(404);
      expect(missingSkill.body.code).toBe("NOT_FOUND");
    });
  });

  describe("proficiency updates (AC02.03, AC02.04)", () => {
    it("rejects assigning the same skill twice with 409 SKILL_ALREADY_ASSIGNED", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("Already Assigned"));

      const first = await assignSkill(admin, employeeId, skill.id, 2);
      expect(first.status).toBe(201);

      const second = await assignSkill(admin, employeeId, skill.id, 4);
      expect(second.status).toBe(409);
      expect(second.body.code).toBe("SKILL_ALREADY_ASSIGNED");

      // The losing request must not have overwritten the stored level.
      const stored = await prisma.employeeSkill.findFirst({
        where: { employeeId, skillId: skill.id },
        select: { proficiencyLevel: true },
      });
      expect(stored?.proficiencyLevel).toBe(2);
    });

    it("updates proficiency, returns the new level, and 404s for an unknown skill", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("Proficiency Update"));

      const assigned = await assignSkill(admin, employeeId, skill.id, 2);
      expect(assigned.status).toBe(201);

      const updated = await writeReq(
        admin,
        "patch",
        `/api/v1/employees/${employeeId}/skills/${skill.id}`,
      ).send({ proficiencyLevel: 5 });
      expect(updated.status).toBe(200);
      expect(updated.body.data).toMatchObject({
        skillId: skill.id,
        proficiencyLevel: 5,
      });

      const list = await listEmployeeSkills(admin, employeeId);
      expect(list.status).toBe(200);
      expect(list.body.meta).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(
        (list.body.data as EmployeeSkillBody[]).find(
          (row) => row.skillId === skill.id,
        ),
      ).toMatchObject({ proficiencyLevel: 5 });

      const unknownSkill = await writeReq(
        admin,
        "patch",
        `/api/v1/employees/${employeeId}/skills/${MISSING_ID}`,
      ).send({ proficiencyLevel: 3 });
      expect(unknownSkill.status).toBe(404);
      expect(unknownSkill.body.code).toBe("NOT_FOUND");

      const unknownEmployee = await writeReq(
        admin,
        "patch",
        `/api/v1/employees/${MISSING_ID}/skills/${skill.id}`,
      ).send({ proficiencyLevel: 3 });
      expect(unknownEmployee.status).toBe(404);
      expect(unknownEmployee.body.code).toBe("NOT_FOUND");
    });
  });

  describe("employee self-access (AC02.05)", () => {
    it("lets an Employee read their own skills and hides a colleague behind the unknown-id 404", async () => {
      const admin = await login("admin");
      const employee = await login("employee");
      const skill = await createSkill(admin, skillName("Self Service"));

      const assigned = await assignSkill(
        admin,
        employee.employeeId,
        skill.id,
        3,
      );
      expect(assigned.status).toBe(201);

      const own = await listEmployeeSkills(employee, employee.employeeId);
      expect(own.status).toBe(200);
      expect(own.body.meta).toMatchObject({ page: 1, pageSize: 20 });
      expect(own.body.meta.total).toBeGreaterThanOrEqual(1);
      expect(own.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            skillId: skill.id,
            proficiencyLevel: 3,
          }),
        ]),
      );

      const colleague = await listEmployeeSkills(employee, fixture.employeeId);
      expect(colleague.status).toBe(404);

      const unknown = await listEmployeeSkills(employee, MISSING_ID);
      expect(unknown.status).toBe(404);

      // Status alone would still leak a difference through the body, so the
      // code, message, and field errors are compared too.
      expect(colleague.body.code).toBe(unknown.body.code);
      expect(colleague.body.message).toBe(unknown.body.message);
      expect(colleague.body.errors).toEqual(unknown.body.errors);
    });

    it("denies every employee-skill write to an Employee", async () => {
      const admin = await login("admin");
      const employee = await login("employee");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(
        admin,
        skillName("Employee Denied Write"),
      );

      const assign = await assignSkill(employee, employeeId, skill.id, 3);
      expect(assign.status).toBe(403);
      expect(assign.body.code).toBe("FORBIDDEN");

      const patch = await writeReq(
        employee,
        "patch",
        `/api/v1/employees/${employeeId}/skills/${skill.id}`,
      ).send({ proficiencyLevel: 4 });
      expect(patch.status).toBe(403);
      expect(patch.body.code).toBe("FORBIDDEN");

      const remove = await request(app)
        .delete(`/api/v1/employees/${employeeId}/skills/${skill.id}`)
        .set("Cookie", employee.cookie)
        .set("X-CSRF-Token", employee.csrfToken);
      expect(remove.status).toBe(403);
      expect(remove.body.code).toBe("FORBIDDEN");
    });
  });

  describe("catalog filtering and pagination", () => {
    it("rejects a pageSize above 100 with a 422 field error", async () => {
      const { cookie } = await login("admin");
      const res = await request(app)
        .get("/api/v1/skills")
        .query({ pageSize: 101 })
        .set("Cookie", cookie);

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(res.body.errors.pageSize).toBeDefined();
    });

    it("returns the documented pagination meta", async () => {
      const admin = await login("admin");
      await createSkill(admin, skillName("Paged One"));
      await createSkill(admin, skillName("Paged Two"));

      const res = await request(app)
        .get("/api/v1/skills")
        .query({ page: 2, pageSize: 1 })
        .set("Cookie", admin.cookie);

      expect(res.status).toBe(200);
      expect(res.body.meta).toMatchObject({ page: 2, pageSize: 1 });
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
      expect(res.body.data).toHaveLength(1);
    });

    it("paginates the employee skill list and rejects a pageSize above 100", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const alpha = await createSkill(admin, skillName("Page Alpha"));
      const beta = await createSkill(admin, skillName("Page Beta"));

      expect((await assignSkill(admin, employeeId, alpha.id, 2)).status).toBe(
        201,
      );
      expect((await assignSkill(admin, employeeId, beta.id, 4)).status).toBe(
        201,
      );

      const firstPage = await listEmployeeSkills(admin, employeeId, {
        page: 1,
        pageSize: 1,
      });
      expect(firstPage.status).toBe(200);
      expect(firstPage.body.meta).toEqual({
        page: 1,
        pageSize: 1,
        total: 2,
        totalPages: 2,
      });
      expect(firstPage.body.data).toHaveLength(1);

      const secondPage = await listEmployeeSkills(admin, employeeId, {
        page: 2,
        pageSize: 1,
      });
      expect(secondPage.status).toBe(200);
      expect(secondPage.body.meta).toEqual({
        page: 2,
        pageSize: 1,
        total: 2,
        totalPages: 2,
      });
      expect(secondPage.body.data).toHaveLength(1);

      // Ordering stays by skill name across the page boundary.
      const firstRow = (firstPage.body.data as EmployeeSkillBody[])[0];
      const secondRow = (secondPage.body.data as EmployeeSkillBody[])[0];
      expect(firstRow?.skillId).toBe(alpha.id);
      expect(secondRow?.skillId).toBe(beta.id);

      const rejected = await listEmployeeSkills(admin, employeeId, {
        pageSize: 101,
      });
      expect(rejected.status).toBe(422);
      expect(rejected.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(rejected.body.errors.pageSize).toBeDefined();
    });

    it("filters by name case-insensitively and by the active flag", async () => {
      const admin = await login("admin");
      const activeName = skillName("Query Alpha");
      const inactiveName = skillName("Query Beta");

      const active = await createSkill(admin, activeName);
      const inactive = await createSkill(admin, inactiveName);

      const deactivated = await writeReq(
        admin,
        "patch",
        `/api/v1/skills/${inactive.id}`,
      ).send({ isActive: false });
      expect(deactivated.status).toBe(200);

      const lowerCase = await request(app)
        .get("/api/v1/skills")
        .query({ q: activeName.toLowerCase(), pageSize: 100 })
        .set("Cookie", admin.cookie);
      expect(lowerCase.status).toBe(200);
      expect(
        (lowerCase.body.data as SkillBody[]).map((skill) => skill.id),
      ).toContain(active.id);

      const upperCase = await request(app)
        .get("/api/v1/skills")
        .query({ q: activeName.toUpperCase(), pageSize: 100 })
        .set("Cookie", admin.cookie);
      expect(upperCase.status).toBe(200);
      expect(
        (upperCase.body.data as SkillBody[]).map((skill) => skill.id),
      ).toContain(active.id);

      const sharedTerm = `${SKILL_PREFIX.toLowerCase()} query`;
      const bothCases = await request(app)
        .get("/api/v1/skills")
        .query({ q: sharedTerm, pageSize: 100 })
        .set("Cookie", admin.cookie);
      expect(bothCases.status).toBe(200);
      expect(
        (bothCases.body.data as SkillBody[]).map((skill) => skill.id),
      ).toEqual(expect.arrayContaining([active.id, inactive.id]));

      const inactiveOnly = await request(app)
        .get("/api/v1/skills")
        .query({ q: SKILL_PREFIX, isActive: "false", pageSize: 100 })
        .set("Cookie", admin.cookie);
      expect(inactiveOnly.status).toBe(200);

      const inactiveRows = inactiveOnly.body.data as SkillBody[];
      expect(inactiveRows.length).toBeGreaterThan(0);
      expect(inactiveRows.every((skill) => skill.isActive === false)).toBe(
        true,
      );
      expect(inactiveRows.map((skill) => skill.id)).toContain(inactive.id);
      expect(inactiveRows.map((skill) => skill.id)).not.toContain(active.id);
    });
  });

  describe("authorization matrix (TSD 15.4)", () => {
    it("serves the catalog to Admin, Project Manager, and Resource Manager, and denies an Employee", async () => {
      const cases = [
        { role: "admin" as const, status: 200 },
        { role: "projectManager" as const, status: 200 },
        { role: "resourceManager" as const, status: 200 },
        { role: "employee" as const, status: 403 },
      ];

      for (const testCase of cases) {
        const session = await login(testCase.role);
        const res = await request(app)
          .get("/api/v1/skills")
          .set("Cookie", session.cookie);

        expect(res.status, testCase.role).toBe(testCase.status);
        if (testCase.status === 403) {
          expect(res.body.code).toBe("FORBIDDEN");
        } else {
          expect(res.body.meta).toMatchObject({ page: 1, pageSize: 20 });
        }
      }
    });

    it("rejects every skills endpoint without a session with 401", async () => {
      // CSRF runs before requireAuth, so a state-changing request needs a token
      // bound to an anonymous session before it can reach the 401 branch.
      const anonymous = await fetchCsrfSession(app);
      const asAnonymous = (call: request.Test): request.Test =>
        call
          .set("Cookie", anonymous.cookie)
          .set("X-CSRF-Token", anonymous.csrfToken);

      const calls: Array<[string, () => request.Test]> = [
        ["GET /skills", () => request(app).get("/api/v1/skills")],
        [
          "POST /skills",
          () =>
            asAnonymous(request(app).post("/api/v1/skills")).send({
              name: skillName("No Session"),
            }),
        ],
        [
          "PATCH /skills/:id",
          () =>
            asAnonymous(
              request(app).patch(`/api/v1/skills/${MISSING_ID}`),
            ).send({ isActive: false }),
        ],
        [
          "GET /employees/:id/skills",
          () => request(app).get(`/api/v1/employees/${MISSING_ID}/skills`),
        ],
        [
          "POST /employees/:id/skills",
          () =>
            asAnonymous(
              request(app).post(`/api/v1/employees/${MISSING_ID}/skills`),
            ).send({ skillId: MISSING_ID, proficiencyLevel: 3 }),
        ],
        [
          "PATCH /employees/:id/skills/:skillId",
          () =>
            asAnonymous(
              request(app).patch(
                `/api/v1/employees/${MISSING_ID}/skills/${MISSING_ID}`,
              ),
            ).send({ proficiencyLevel: 3 }),
        ],
        [
          "DELETE /employees/:id/skills/:skillId",
          () =>
            asAnonymous(
              request(app).delete(
                `/api/v1/employees/${MISSING_ID}/skills/${MISSING_ID}`,
              ),
            ),
        ],
      ];

      for (const [label, call] of calls) {
        const res = await call();
        expect(res.status, label).toBe(401);
        expect(res.body.code, label).toBe("UNAUTHORIZED");
      }
    });

    it("rejects a state-changing request without a CSRF token with 403", async () => {
      const admin = await login("admin");
      const blockedName = skillName("No Csrf");

      // Authenticated but tokenless: the session is valid, so only the CSRF
      // check can be what rejects this.
      const authenticated = await request(app)
        .post("/api/v1/skills")
        .set("Cookie", admin.cookie)
        .send({ name: blockedName });
      expect(authenticated.status).toBe(403);
      expect(authenticated.body.code).toBe("FORBIDDEN");

      const writes: Array<[string, () => request.Test]> = [
        [
          "POST /skills",
          () => request(app).post("/api/v1/skills").send({ name: blockedName }),
        ],
        [
          "PATCH /skills/:id",
          () =>
            request(app)
              .patch(`/api/v1/skills/${MISSING_ID}`)
              .send({ isActive: false }),
        ],
        [
          "POST /employees/:id/skills",
          () =>
            request(app)
              .post(`/api/v1/employees/${MISSING_ID}/skills`)
              .send({ skillId: MISSING_ID, proficiencyLevel: 3 }),
        ],
        [
          "PATCH /employees/:id/skills/:skillId",
          () =>
            request(app)
              .patch(`/api/v1/employees/${MISSING_ID}/skills/${MISSING_ID}`)
              .send({ proficiencyLevel: 3 }),
        ],
        [
          "DELETE /employees/:id/skills/:skillId",
          () =>
            request(app).delete(
              `/api/v1/employees/${MISSING_ID}/skills/${MISSING_ID}`,
            ),
        ],
      ];

      for (const [label, call] of writes) {
        const res = await call();
        expect(res.status, label).toBe(403);
        expect(res.body.code, label).toBe("FORBIDDEN");
      }

      const stored = await prisma.skill.count({
        where: { name: blockedName },
      });
      expect(stored).toBe(0);
    });
  });

  /**
   * Regression coverage for the code-review findings F2, F3, F5, F6, and F7 on
   * this card. Each test below fails if the fix it pins is reverted, and every
   * one of them used to answer 500 or reject a legitimate request:
   *
   * - F2: an unknown or repeated skill id reached the database and surfaced as
   *   a foreign-key / unique violation (500) instead of a 422.
   * - F3: re-saving a requirement that still holds a since-deactivated skill
   *   was rejected with 422 SKILL_INACTIVE, so the row could never be edited.
   * - F5: a concurrent delete of the same assignment let P2025 escape as a 500.
   * - F6: the case-insensitive uniqueness rule is only real because the
   *   database enforces `skills_name_lower_key`; the service pre-check cannot.
   * - F7: `%` and `_` in `q` were passed to `ILIKE` unescaped, so a search for
   *   `%` returned the whole catalog.
   */
  describe("review findings regressions (F2, F3, F5, F6, F7)", () => {
    it("rejects an unknown skill id on staffing create with 422 SKILL_REFERENCE_INVALID (F2)", async () => {
      const admin = await login("admin");
      const known = await createSkill(admin, skillName("F2 Known Skill"));

      // A valid requirement first, so "unchanged" is a real baseline instead
      // of an empty project that would also look right if the endpoint never
      // wrote anything.
      const { projectId } = await createProjectAndRequirement(
        admin,
        [{ skillId: known.id, minimumProficiencyLevel: 3 }],
        "F2-Unknown",
      );

      const rejected = await writeReq(
        admin,
        "post",
        staffingRequirementsPath(projectId),
      ).send(
        staffingRequirementBody([
          { skillId: randomUUID(), minimumProficiencyLevel: 3 },
        ]),
      );

      // Before the fix the id went straight into the join insert and the
      // foreign key answered 500; the guard has to catch it first.
      expect(rejected.status).toBe(422);
      expect(rejected.body.code).toBe("SKILL_REFERENCE_INVALID");
      expect(Array.isArray(rejected.body.errors.skills)).toBe(true);
      expect(rejected.body.errors.skills.length).toBeGreaterThan(0);

      expect(
        await prisma.staffingRequirement.count({ where: { projectId } }),
      ).toBe(1);
    });

    it("rejects a repeated skill id in one staffing body with 422 and no requirement (F2)", async () => {
      const admin = await login("admin");
      const skill = await createSkill(admin, skillName("F2 Repeated Skill"));
      const projectId = await createProject("F2-Repeated");

      const rejected = await writeReq(
        admin,
        "post",
        staffingRequirementsPath(projectId),
      ).send(
        staffingRequirementBody([
          { skillId: skill.id, minimumProficiencyLevel: 2 },
          { skillId: skill.id, minimumProficiencyLevel: 4 },
        ]),
      );

      // Uncaught, the duplicate reached the unique index on
      // (staffing_requirement_id, skill_id) and the transaction surfaced as a
      // 500. The array-level refinement in staffing.schema.ts is the layer that
      // answers first, and it is plain field validation, so the code is the
      // generic one; the service's own Set check would answer
      // SKILL_REFERENCE_INVALID if the body ever got past the schema.
      expect(rejected.status).toBe(422);
      expect(rejected.body.code).toBe("UNPROCESSABLE_ENTITY");
      expect(Array.isArray(rejected.body.errors.skills)).toBe(true);
      expect(rejected.body.errors.skills.length).toBeGreaterThan(0);

      expect(
        await prisma.staffingRequirement.count({ where: { projectId } }),
      ).toBe(0);
      expect(
        await prisma.staffingRequirementSkill.count({
          where: { skillId: skill.id },
        }),
      ).toBe(0);
    });

    it("rejects a newly added deactivated skill on PATCH with 422 SKILL_INACTIVE (AC01.05)", async () => {
      const admin = await login("admin");
      const attached = await createSkill(admin, skillName("AC0105 Attached"));
      const retired = await createSkill(admin, skillName("AC0105 Retired"));

      const { requirementId } = await createProjectAndRequirement(
        admin,
        [{ skillId: attached.id, minimumProficiencyLevel: 3 }],
        "AC0105-New",
      );

      // Both are deactivated: the attached one must stay tolerated (it is not a
      // new assignment), the other one must not.
      await deactivateSkill(admin, attached.id);
      await deactivateSkill(admin, retired.id);

      const rejected = await writeReq(
        admin,
        "patch",
        `/api/v1/staffing-requirements/${requirementId}`,
      ).send({
        skills: [
          { skillId: attached.id, minimumProficiencyLevel: 3 },
          { skillId: retired.id, minimumProficiencyLevel: 4 },
        ],
      });

      expect(rejected.status).toBe(422);
      expect(rejected.body.code).toBe("SKILL_INACTIVE");

      // The guard runs before the delete-and-recreate, so the existing join row
      // is still there and the rejected skill never landed.
      expect(
        await prisma.staffingRequirementSkill.count({
          where: { staffingRequirementId: requirementId },
        }),
      ).toBe(1);
      expect(
        await prisma.staffingRequirementSkill.count({
          where: {
            staffingRequirementId: requirementId,
            skillId: retired.id,
          },
        }),
      ).toBe(0);
    });

    it("re-saves a requirement whose skill was deactivated after it was attached (F3)", async () => {
      const admin = await login("admin");
      const skill = await createSkill(admin, skillName("F3 Resave"));

      const { requirementId } = await createProjectAndRequirement(
        admin,
        [{ skillId: skill.id, minimumProficiencyLevel: 2 }],
        "F3-Resave",
      );

      await deactivateSkill(admin, skill.id);

      // The exact case that used to answer 422: the skill is already attached,
      // so re-sending it is not a new assignment even though the update path
      // replaces every join row.
      const resaved = await writeReq(
        admin,
        "patch",
        `/api/v1/staffing-requirements/${requirementId}`,
      ).send({
        skills: [{ skillId: skill.id, minimumProficiencyLevel: 5 }],
      });

      expect(resaved.status).toBe(200);
      expect(resaved.body.data.skills).toEqual([
        expect.objectContaining({
          skillId: skill.id,
          minimumProficiencyLevel: 5,
        }),
      ]);

      const rows = await prisma.staffingRequirementSkill.findMany({
        where: { staffingRequirementId: requirementId },
        select: { skillId: true, minimumProficiencyLevel: true },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        skillId: skill.id,
        minimumProficiencyLevel: 5,
      });
    });

    it("answers 404 for an unknown skill id on employee assignment (F2)", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);

      const res = await assignSkill(admin, employeeId, randomUUID(), 3);

      // Pinned so a future rewrite of the assignment path cannot turn the
      // missing row into a foreign-key 500: the lock lookup has to report the
      // absent skill as an ordinary 404, like the pre-lock path did.
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(await prisma.employeeSkill.count({ where: { employeeId } })).toBe(
        0,
      );
    });

    it("answers one 204 and four 404s for five concurrent deletes of one assignment (F5)", async () => {
      const admin = await login("admin");
      const employeeId = await createEmployee(admin);
      const skill = await createSkill(admin, skillName("F5 Concurrent Delete"));

      const assigned = await assignSkill(admin, employeeId, skill.id, 3);
      expect(assigned.status).toBe(201);

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          removeAssignment(admin, employeeId, skill.id),
        ),
      );

      const statuses = results.map((res) => res.status).sort((a, b) => a - b);
      // Exactly one delete can win; the four losers lose the pre-flight race
      // and have to be told "not found", never "internal server error".
      expect(statuses).toEqual([204, 404, 404, 404, 404]);
      for (const res of results.filter((r) => r.status === 404)) {
        expect(res.body.code).toBe("NOT_FOUND");
      }

      expect(
        await prisma.employeeSkill.count({
          where: { employeeId, skillId: skill.id },
        }),
      ).toBe(0);

      // Removing an assignment never touches the catalog row (BR03).
      const skillRow = await prisma.skill.findUnique({
        where: { id: skill.id },
        select: { id: true },
      });
      expect(skillRow?.id).toBe(skill.id);
    });

    it("lets the database enforce case-insensitive uniqueness through skills_name_lower_key (F6)", async () => {
      const admin = await login("admin");
      const original = await createSkill(admin, skillName("F6 Index Probe"));
      const variant = original.name.toUpperCase();

      try {
        // Bypasses the service pre-check on purpose: the rule is only real if
        // the lower(name) index rejects the row itself, which is what the
        // P2002 mapping in skills.errors.ts relies on.
        const error = await prisma.skill
          .create({ data: { name: variant }, select: { id: true } })
          .then(
            () => null,
            (thrown: unknown) => thrown,
          );

        expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
        const prismaError = error as Prisma.PrismaClientKnownRequestError;
        expect(prismaError.code).toBe("P2002");
        expect(prismaError.meta).toMatchObject({
          driverAdapterError: {
            cause: { constraint: { index: "skills_name_lower_key" } },
          },
        });

        expect(
          await prisma.skill.count({
            where: { name: { equals: original.name, mode: "insensitive" } },
          }),
        ).toBe(1);
      } finally {
        // Nothing is created by the rejected insert, but the probe row is
        // removed here as well so a failure mid-test cannot leave it for the
        // prefix teardown to find.
        await prisma.skill.deleteMany({ where: { name: variant } });
        await prisma.skill.deleteMany({ where: { id: original.id } });
      }
    });

    it("treats % and _ in q as literal characters instead of LIKE wildcards (F7)", async () => {
      const admin = await login("admin");
      const withPercent = await createSkill(
        admin,
        skillName("F7 Percent % Row"),
      );
      const withoutPercent = await createSkill(
        admin,
        skillName("F7 Percent X Row"),
      );

      const catalog = await prisma.skill.findMany({
        select: { id: true, name: true },
      });
      const idsContaining = (character: string): string[] =>
        catalog
          .filter((skill) => skill.name.includes(character))
          .map((skill) => skill.id)
          .sort();

      const search = (q: string): request.Test =>
        request(app)
          .get("/api/v1/skills")
          .query({ q, pageSize: 100 })
          .set("Cookie", admin.cookie);

      // `%25` on the wire, `%` after decoding. Unescaped it becomes the `ILIKE`
      // pattern `%%%`, which matches the whole catalog.
      const percentQuery = await search("%");
      expect(percentQuery.status).toBe(200);
      const percentIds = (percentQuery.body.data as SkillBody[])
        .map((skill) => skill.id)
        .sort();
      expect(percentIds).toEqual(idsContaining("%"));
      expect(percentIds).toContain(withPercent.id);
      expect(percentIds).not.toContain(withoutPercent.id);
      expect(percentQuery.body.meta.total).toBeLessThan(catalog.length);

      // `_` is the single-character wildcard; escaped it matches a literal
      // underscore, so neither of the two skills above can come back.
      const underscoreQuery = await search("_");
      expect(underscoreQuery.status).toBe(200);
      const underscoreIds = (underscoreQuery.body.data as SkillBody[]).map(
        (skill) => skill.id,
      );
      expect(underscoreIds.sort()).toEqual(idsContaining("_"));
      expect(underscoreIds).not.toContain(withPercent.id);
      expect(underscoreIds).not.toContain(withoutPercent.id);
      expect(underscoreQuery.body.meta.total).toBeLessThan(catalog.length);
    });
  });
});
