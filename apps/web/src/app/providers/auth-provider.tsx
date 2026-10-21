/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  onUnauthorized,
  setCachedCsrfToken,
} from "../../api/client.js";

export type Role =
  "ADMIN" | "PROJECT_MANAGER" | "RESOURCE_MANAGER" | "EMPLOYEE";

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employeeId?: string | null;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    workEmail: string;
    departmentId: string;
    departmentName: string;
    jobRoleId: string;
    jobRoleTitle: string;
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Drops the user, the CSRF token, and every cached server response, so the next
  // sign-in never shows data from the previous session.
  const clearSession = useCallback((): void => {
    setUser(null);
    setCachedCsrfToken(null);
    queryClient.removeQueries();
  }, [queryClient]);

  // A lost session on any data request signs the user out in-app.
  useEffect(() => onUnauthorized(clearSession), [clearSession]);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient<{ data: UserProfile }>("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const res = await apiClient<{ data: UserProfile }>("/auth/me");
        if (isMounted) setUser(res.data);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void init();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<UserProfile> => {
    const res = await apiClient<{
      data: { user: UserProfile; csrfToken: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setCachedCsrfToken(res.data.csrfToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refresh: fetchCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
