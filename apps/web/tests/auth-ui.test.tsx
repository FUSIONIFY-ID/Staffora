import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../src/features/auth/login-page.js";
import * as AuthContextModule from "../src/app/providers/auth-provider.js";
import { AppLayout } from "../src/app/layouts/app-layout.js";

function renderLoginPage(): void {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage (AC01 - Login Form)", () => {
  it("renders email, masked password, and submit button", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderLoginPage();

    // AC01.01: Email and Password fields provided
    const emailInput = screen.getByLabelText(/Work Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    // AC01.04: Password masked by default
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(submitButton).toBeInTheDocument();
  });

  it("accepts typed credentials and renders no seeded-account shortcut", () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Work Email/i);
    fireEvent.change(emailInput, {
      target: { value: "someone@staffora.internal" },
    });
    expect(emailInput).toHaveValue("someone@staffora.internal");

    // No quick sign-in control, and therefore no seeded password in the source
    // that the production bundle could ship. Asserted from behaviour — the form
    // offers exactly one control that submits — rather than by naming a
    // credential in the test file.
    expect(screen.queryByText(/Quick Sign-in/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /Sign In/i }),
    ).toBeInTheDocument();
  });
});

describe("AppLayout (AC02 - Role-based navigation)", () => {
  it("renders Admin navigation including Users, Dashboard, and Resources", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "user-admin",
        email: "admin@staffora.internal",
        role: "ADMIN",
        isActive: true,
        employee: {
          id: "emp-admin",
          employeeCode: "EMP-ADM01",
          fullName: "System Administrator",
          workEmail: "admin@staffora.internal",
          departmentId: "dept-1",
          departmentName: "Operations",
          jobRoleId: "role-1",
          jobRoleTitle: "Admin",
        },
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resources" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Capacity" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Allocations" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument(); // Admin only
    // PRD §2.2 grants self-view only in the Employee column, so the Admin menu
    // must not offer My Profile.
    expect(
      screen.queryByRole("link", { name: "My Profile" }),
    ).not.toBeInTheDocument();
  });

  it("renders Employee navigation with My Profile and assigned Projects only", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "user-emp",
        email: "emp@staffora.internal",
        role: "EMPLOYEE",
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
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "My Profile" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Users" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Capacity" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Allocations" }),
    ).not.toBeInTheDocument();
  });
});
