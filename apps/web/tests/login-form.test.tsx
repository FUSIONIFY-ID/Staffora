import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../src/features/auth/login-page.js";
import { PublicRoute } from "../src/app/router/public-route.js";
import { getLoginErrorMessage } from "../src/features/auth/login-error.js";
import { ApiError } from "../src/api/client.js";
import * as AuthContextModule from "../src/app/providers/auth-provider.js";
import type { UserProfile } from "../src/app/providers/auth-provider.js";

const adminUser: UserProfile = {
  id: "user-admin",
  email: "admin@staffora.internal",
  role: "ADMIN",
  isActive: true,
};

const employeeUser: UserProfile = {
  id: "user-employee",
  email: "employee@staffora.internal",
  role: "EMPLOYEE",
  isActive: true,
};

type LoginMock = (email: string, password: string) => Promise<UserProfile>;

function mockAuth(login: LoginMock): void {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: null,
    isLoading: false,
    login,
    logout: vi.fn(),
    refresh: vi.fn(),
  });
}

function renderLogin(initialEntry: { pathname: string; state?: unknown } | string = "/login"): void {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/capacity" element={<p>Capacity page</p>} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
          <Route path="/my-profile" element={<p>My profile page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillAndSubmit(email: string, password: string): void {
  fireEvent.change(screen.getByLabelText("Work Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LoginForm validation (AC01.05)", () => {
  it("blocks submission and shows field errors when both fields are empty", async () => {
    const login = vi.fn<LoginMock>();
    mockAuth(login);
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Work email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(screen.getByLabelText("Work Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Work Email")).toHaveAttribute("aria-describedby", "login-email-error");
    expect(screen.getByText("Work email is required.")).toHaveAttribute("id", "login-email-error");
    expect(login).not.toHaveBeenCalled();
  });

  it("rejects a malformed email before calling the API", async () => {
    const login = vi.fn<LoginMock>();
    mockAuth(login);
    renderLogin();

    fillAndSubmit("not-an-email", "whatever");

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});

describe("LoginForm submission", () => {
  it("submits trimmed credentials and disables the form while signing in", async () => {
    let resolveLogin: (user: UserProfile) => void = () => undefined;
    const login = vi.fn<LoginMock>(
      () => new Promise<UserProfile>((resolve) => (resolveLogin = resolve)),
    );
    mockAuth(login);
    renderLogin();

    fillAndSubmit("  admin@staffora.internal ", "secret-password");

    await waitFor(() => expect(login).toHaveBeenCalledWith("admin@staffora.internal", "secret-password"));
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDisabled();
    expect(screen.getByLabelText("Work Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(document.querySelector("form")).toHaveAttribute("aria-busy", "true");
    resolveLogin(adminUser);
  });

  it("shows the generic message for an inactive account and never names the reason (AC02.03, AC02.05)", async () => {
    const login = vi.fn<LoginMock>().mockRejectedValue(
      new ApiError(401, { message: "User account is inactive.", code: "UNAUTHORIZED" }),
    );
    mockAuth(login);
    renderLogin();

    fillAndSubmit("inactive@staffora.internal", "secret-password");

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.queryByText(/inactive/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  it("returns the user to the page they asked for after a successful sign-in (AC02.01)", async () => {
    mockAuth(vi.fn<LoginMock>().mockResolvedValue(adminUser));
    renderLogin({ pathname: "/login", state: { from: "/capacity" } });

    expect(screen.getByText("Please sign in to continue.")).toBeInTheDocument();
    fillAndSubmit("admin@staffora.internal", "secret-password");

    expect(await screen.findByText("Capacity page")).toBeInTheDocument();
  });

  it("sends a sign-in without a pending destination to the role's home page", async () => {
    mockAuth(vi.fn<LoginMock>().mockResolvedValue(employeeUser));
    renderLogin();

    fillAndSubmit("employee@staffora.internal", "secret-password");

    expect(await screen.findByText("My profile page")).toBeInTheDocument();
  });

  it("ignores an unsafe redirect target and falls back to the role's home page", async () => {
    mockAuth(vi.fn<LoginMock>().mockResolvedValue(adminUser));
    renderLogin({ pathname: "/login", state: { from: "//evil.example" } });

    fillAndSubmit("admin@staffora.internal", "secret-password");

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });
});

describe("PublicRoute on /login (AC02.01)", () => {
  it("sends a signed-in user to the page they asked for, instead of showing the form again", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn<LoginMock>(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: "/capacity" } }]}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route path="/capacity" element={<p>Capacity page</p>} />
            <Route path="/dashboard" element={<p>Dashboard page</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Capacity page")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Welcome back" })).not.toBeInTheDocument();
  });
});

describe("getLoginErrorMessage", () => {
  it.each([
    [new ApiError(401, { message: "x", code: "UNAUTHORIZED" }), "Invalid email or password."],
    [new ApiError(422, { message: "x", code: "UNPROCESSABLE_ENTITY" }), "Check your email and password, then try again."],
    [new ApiError(429, { message: "x", code: "TOO_MANY_REQUESTS" }), /Too many sign-in attempts/],
    [new ApiError(500, { message: "db down", code: "INTERNAL" }), /Unable to sign in right now/],
    [new TypeError("Failed to fetch"), /Unable to sign in right now/],
  ])("maps %s to user-facing copy", (error, expected) => {
    expect(getLoginErrorMessage(error)).toMatch(expected);
  });
});
