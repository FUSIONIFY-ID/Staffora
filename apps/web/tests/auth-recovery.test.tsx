import type React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth, type UserProfile } from "../src/app/providers/auth-provider.js";
import { ProtectedRoute } from "../src/app/router/protected-route.js";
import { LoginPage } from "../src/features/auth/login-page.js";
import { apiClient, getCachedCsrfToken, setCachedCsrfToken } from "../src/api/client.js";

/**
 * Session recovery through the real AuthProvider, ProtectedRoute, and apiClient.
 * fetch is mocked, so the 401 comes from the same code path a lost session uses.
 */

const adminUser: UserProfile = {
  id: "user-admin",
  email: "admin@staffora.internal",
  role: "ADMIN",
  isActive: true,
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const unauthenticated = (): Response =>
  json(401, { message: "Not authenticated.", code: "UNAUTHORIZED" });

function mockApi(respond: (url: string, init?: RequestInit) => Response): void {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) =>
    respond(String(input), init),
  );
}

/** A protected page that loads cached data, so the test can see the cache being cleared. */
const EmployeesPanel: React.FC = () => {
  const query = useQuery({
    queryKey: ["employees"],
    queryFn: () => apiClient<{ data: string }>("/employees"),
  });
  return <p>{query.isError ? "Employees unavailable" : "Capacity page"}</p>;
};

const SignOutButton: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => void logout().then(() => navigate("/login"))}>
      Sign out
    </button>
  );
};

function renderApp(queryClient: QueryClient): void {
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/capacity"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/capacity"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <EmployeesPanel />
                  <SignOutButton />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const newQueryClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

beforeEach(() => {
  setCachedCsrfToken(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Session recovery (AC03.04, TSD 6.4)", () => {
  it("signs the user out in-app when a data request returns 401, and returns them to the page they had open", async () => {
    let signedIn = true;
    mockApi((url) => {
      if (url.endsWith("/auth/me")) return signedIn ? json(200, { data: adminUser }) : unauthenticated();
      if (url.endsWith("/employees")) {
        signedIn = false;
        return unauthenticated();
      }
      return json(404, { message: "Not found", code: "NOT_FOUND" });
    });

    renderApp(newQueryClient());

    expect(await screen.findByText("Capacity page")).toBeInTheDocument();
    expect(await screen.findByText("Please sign in to continue.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("clears the CSRF token and every cached response when the session is lost", async () => {
    let signedIn = true;
    mockApi((url) => {
      if (url.endsWith("/auth/me")) return json(200, { data: adminUser });
      if (url.endsWith("/employees")) return signedIn ? json(200, { data: "ok" }) : unauthenticated();
      return unauthenticated();
    });
    setCachedCsrfToken("csrf-before");
    const queryClient = newQueryClient();
    renderApp(queryClient);

    expect(await screen.findByText("Capacity page")).toBeInTheDocument();
    await waitFor(() => expect(queryClient.getQueryData(["employees"])).toEqual({ data: "ok" }));

    // Lose the session: from now on any data request answers 401.
    signedIn = false;
    await expect(apiClient("/employees")).rejects.toMatchObject({ status: 401 });

    await waitFor(() => expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument());
    expect(getCachedCsrfToken()).toBeNull();
    expect(queryClient.getQueryData(["employees"])).toBeUndefined();
  });

  it("logs out with the CSRF token, clears cached data, and lands on the login page", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return json(200, { data: adminUser });
      if (url.endsWith("/employees")) return json(200, { data: "ok" });
      if (url.endsWith("/auth/logout") && init?.method === "POST") return new Response(null, { status: 204 });
      return unauthenticated();
    });
    setCachedCsrfToken("csrf-logout");
    const queryClient = newQueryClient();
    renderApp(queryClient);

    expect(await screen.findByText("Capacity page")).toBeInTheDocument();
    await waitFor(() => expect(queryClient.getQueryData(["employees"])).toEqual({ data: "ok" }));

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    const logoutCall = fetchSpy.mock.calls.find(([url]) => String(url).endsWith("/auth/logout"));
    expect(new Headers(logoutCall?.[1]?.headers).get("X-CSRF-Token")).toBe("csrf-logout");
    expect(getCachedCsrfToken()).toBeNull();
    expect(queryClient.getQueryData(["employees"])).toBeUndefined();
  });

  it("keeps a failed sign-in on the login page without signing anyone out", async () => {
    mockApi((url) => {
      if (url.endsWith("/auth/me")) return unauthenticated();
      if (url.endsWith("/auth/login")) {
        return json(401, { message: "Invalid email or password.", code: "UNAUTHORIZED" });
      }
      return json(404, { message: "Not found", code: "NOT_FOUND" });
    });
    renderApp(newQueryClient());

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Work Email"), { target: { value: "admin@staffora.internal" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });
});
