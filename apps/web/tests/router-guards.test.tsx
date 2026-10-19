import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppRouter } from "../src/app/router/index.js";
import * as AuthContextModule from "../src/app/providers/auth-provider.js";
import type { Role, UserProfile } from "../src/app/providers/auth-provider.js";

/**
 * Route-to-role matrix tests.
 *
 * These render the real router, so they fail when a guard is removed. A previous
 * revision of the suite only tested the shell components with MemoryRouter and
 * never exercised ProtectedRoute: disabling the role check in
 * protected-route.tsx left every test passing.
 */

const makeUser = (role: Role): UserProfile => ({
  id: `user-${role.toLowerCase()}`,
  email: `${role.toLowerCase()}@staffora.internal`,
  role,
  isActive: true,
  employee: {
    id: "emp-1",
    employeeCode: "EMP-001",
    fullName: "Budi Santoso",
    workEmail: "budi@staffora.internal",
    departmentId: "dept-1",
    departmentName: "Engineering",
    jobRoleId: "role-1",
    jobRoleTitle: "Full-Stack Developer",
  },
});

function mockAuth(user: UserProfile | null, isLoading = false): void {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user,
    isLoading,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  });
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const DENIED = "Access denied";

describe("route guards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an ADMIN-only route for an Admin", async () => {
    mockAuth(makeUser("ADMIN"));
    renderAt("/admin/users");

    expect(
      await screen.findByRole("heading", { name: "System User Management" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(DENIED)).not.toBeInTheDocument();
  });

  it("denies an ADMIN-only route to a Project Manager, a Resource Manager, and an Employee", async () => {
    for (const role of [
      "PROJECT_MANAGER",
      "RESOURCE_MANAGER",
      "EMPLOYEE",
    ] as Role[]) {
      vi.restoreAllMocks();
      mockAuth(makeUser(role));
      const { unmount } = renderAt("/admin/users");

      expect(
        await screen.findByRole("heading", { name: DENIED }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "System User Management" }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("denies the management-only Workforce routes to an Employee", async () => {
    for (const path of [
      "/resources",
      "/skills",
      "/capacity",
      "/allocations",
      "/dashboard",
    ]) {
      vi.restoreAllMocks();
      mockAuth(makeUser("EMPLOYEE"));
      const { unmount } = renderAt(path);

      expect(
        await screen.findByRole("heading", { name: DENIED }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("allows Projects to an Employee but not to an unauthenticated visitor", async () => {
    mockAuth(makeUser("EMPLOYEE"));
    const allowed = renderAt("/projects");
    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(DENIED)).not.toBeInTheDocument();
    allowed.unmount();

    vi.restoreAllMocks();
    mockAuth(null);
    renderAt("/projects");
    expect(
      await screen.findByRole("heading", { name: /Welcome back/i }),
    ).toBeInTheDocument();
  });

  it("renders My Profile for an Employee and denies it to every other role", async () => {
    vi.restoreAllMocks();
    mockAuth(makeUser("EMPLOYEE"));
    const allowed = renderAt("/my-profile");
    expect(
      await screen.findByRole("heading", { name: "My Profile" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(DENIED)).not.toBeInTheDocument();
    allowed.unmount();

    // PRD §2.2 grants self-view only in the Employee column and US06.02 AC01.01
    // names Employee, while BR-G02 guarantees an employee profile only for Project
    // Manager, Resource Manager, and Employee, so the route must deny the rest.
    for (const role of [
      "ADMIN",
      "PROJECT_MANAGER",
      "RESOURCE_MANAGER",
    ] as Role[]) {
      vi.restoreAllMocks();
      mockAuth(makeUser(role));
      const { unmount } = renderAt("/my-profile");

      expect(
        await screen.findByRole("heading", { name: DENIED }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "My Profile" }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("redirects an unauthenticated visitor from a protected route to the login page", async () => {
    mockAuth(null);
    renderAt("/dashboard");

    expect(
      await screen.findByRole("heading", { name: /Welcome back/i }),
    ).toBeInTheDocument();
  });

  it("redirects the root path to the dashboard for management and to My Profile for an Employee", async () => {
    mockAuth(makeUser("ADMIN"));
    const admin = renderAt("/");
    expect(
      await screen.findByRole("heading", { name: /Selamat datang/i }),
    ).toBeInTheDocument();
    admin.unmount();

    vi.restoreAllMocks();
    mockAuth(makeUser("EMPLOYEE"));
    renderAt("/");
    expect(
      await screen.findByRole("heading", { name: "My Profile" }),
    ).toBeInTheDocument();
  });
});
