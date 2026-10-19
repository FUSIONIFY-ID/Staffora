import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/identity/identity.repository.js", () => ({
  identityRepository: { findByNormalizedEmail: vi.fn(), findById: vi.fn() },
}));
vi.mock("../src/common/auth/password.js", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

import { identityRepository } from "../src/modules/identity/identity.repository.js";
import { verifyPassword } from "../src/common/auth/password.js";
import { identityService } from "../src/modules/identity/identity.service.js";

const timestamp = new Date("2026-10-01T00:00:00.000Z");
const audit = {
  createdAt: timestamp,
  createdBy: null,
  updatedAt: timestamp,
  updatedBy: null,
};

function buildUser(overrides: { isActive?: boolean } = {}) {
  return {
    id: "7d0f9a3e-1111-4c2b-9a51-000000000001",
    normalizedEmail: "employee@staffora.internal",
    passwordHash: "$2b$12$stored-hash",
    role: "EMPLOYEE" as const,
    isActive: overrides.isActive ?? true,
    employeeId: "7d0f9a3e-2222-4c2b-9a51-000000000002",
    ...audit,
    employee: {
      id: "7d0f9a3e-2222-4c2b-9a51-000000000002",
      employeeCode: "EMP001",
      fullName: "Employee Test",
      workEmail: "employee@staffora.internal",
      departmentId: "7d0f9a3e-3333-4c2b-9a51-000000000003",
      jobRoleId: "7d0f9a3e-4444-4c2b-9a51-000000000004",
      status: "ACTIVE" as const,
      ...audit,
      department: {
        id: "7d0f9a3e-3333-4c2b-9a51-000000000003",
        name: "Engineering",
        isActive: true,
        ...audit,
      },
      jobRole: {
        id: "7d0f9a3e-4444-4c2b-9a51-000000000004",
        name: "Backend Engineer",
        isActive: true,
        ...audit,
      },
    },
  };
}

describe("identityService.authenticate (US01.01)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("still runs password verification for unknown emails and returns the generic error (AC02.03)", async () => {
    vi.mocked(identityRepository.findByNormalizedEmail).mockResolvedValue(null);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      identityService.authenticate(
        "ghost@staffora.internal",
        "AnyPassword123!",
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Invalid email or password.",
    });
    expect(verifyPassword).toHaveBeenCalledWith("AnyPassword123!", null);
  });

  it("returns the same generic error for a wrong password (AC02.04)", async () => {
    vi.mocked(identityRepository.findByNormalizedEmail).mockResolvedValue(
      buildUser(),
    );
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      identityService.authenticate(
        "employee@staffora.internal",
        "WrongPassword1!",
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password.",
    });
    expect(verifyPassword).toHaveBeenCalledWith(
      "WrongPassword1!",
      "$2b$12$stored-hash",
    );
  });

  it("rejects an inactive account with the same generic error, even with the correct password (AC02.05, BR02)", async () => {
    vi.mocked(identityRepository.findByNormalizedEmail).mockResolvedValue(
      buildUser({ isActive: false }),
    );
    vi.mocked(verifyPassword).mockResolvedValue(true);

    await expect(
      identityService.authenticate(
        "employee@staffora.internal",
        "CorrectPassword1!",
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Invalid email or password.",
    });
  });

  it("returns the authenticated identity without credential fields (AC02.01)", async () => {
    vi.mocked(identityRepository.findByNormalizedEmail).mockResolvedValue(
      buildUser(),
    );
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const identity = await identityService.authenticate(
      "employee@staffora.internal",
      "CorrectPassword1!",
    );

    expect(identity).toEqual({
      id: "7d0f9a3e-1111-4c2b-9a51-000000000001",
      email: "employee@staffora.internal",
      role: "EMPLOYEE",
      isActive: true,
      employeeId: "7d0f9a3e-2222-4c2b-9a51-000000000002",
      employee: {
        id: "7d0f9a3e-2222-4c2b-9a51-000000000002",
        employeeCode: "EMP001",
        fullName: "Employee Test",
        workEmail: "employee@staffora.internal",
        departmentId: "7d0f9a3e-3333-4c2b-9a51-000000000003",
        departmentName: "Engineering",
        jobRoleId: "7d0f9a3e-4444-4c2b-9a51-000000000004",
        jobRoleTitle: "Backend Engineer",
      },
    });
    expect(identity).not.toHaveProperty("passwordHash");
  });
});

describe("identityService.resolveSessionUser (US01.01)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when the session user no longer exists", async () => {
    vi.mocked(identityRepository.findById).mockResolvedValue(null);
    await expect(
      identityService.resolveSessionUser("missing-id"),
    ).resolves.toBeNull();
  });

  it("returns null when the session user was deactivated (AC02.05)", async () => {
    vi.mocked(identityRepository.findById).mockResolvedValue(
      buildUser({ isActive: false }),
    );
    await expect(
      identityService.resolveSessionUser(
        "7d0f9a3e-1111-4c2b-9a51-000000000001",
      ),
    ).resolves.toBeNull();
  });

  it("returns the identity for an active session user", async () => {
    vi.mocked(identityRepository.findById).mockResolvedValue(buildUser());
    const identity = await identityService.resolveSessionUser(
      "7d0f9a3e-1111-4c2b-9a51-000000000001",
    );
    expect(identity?.role).toBe("EMPLOYEE");
    expect(identity?.employee?.departmentName).toBe("Engineering");
  });
});
