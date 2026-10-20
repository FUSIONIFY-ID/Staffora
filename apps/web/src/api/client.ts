export interface ApiErrorPayload {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  meta?: Record<string, unknown>;
  requestId?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors: Record<string, string[]>;
  public readonly meta: Record<string, unknown>;
  public readonly requestId?: string;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || "An API error occurred.");
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code || "API_ERROR";
    this.errors = payload.errors || {};
    this.meta = payload.meta || {};
    this.requestId = payload.requestId;
  }
}

let csrfTokenCache: string | null = null;

export function setCachedCsrfToken(token: string | null) {
  csrfTokenCache = token;
}

export function getCachedCsrfToken(): string | null {
  return csrfTokenCache;
}

export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/v1/auth/csrf-token", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const body = await res.json();
      csrfTokenCache = body.data?.csrfToken || null;
      return csrfTokenCache;
    }
  } catch {
    // ignore
  }
  return null;
}

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();
const SESSION_PROBE_ENDPOINTS = ["/auth/login", "/auth/me"];

/**
 * Subscribes to a lost session, meaning a 401 on a data request. The auth provider
 * uses this to clear the session in-app, so the route guard can send the user to
 * /login without a full page reload. Returns the unsubscribe function.
 */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // State-changing requests must attach X-CSRF-Token
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (!csrfTokenCache) {
      await fetchCsrfToken();
    }
    if (csrfTokenCache && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", csrfTokenCache);
    }
    if (
      !headers.has("Content-Type") &&
      options.body &&
      typeof options.body === "string"
    ) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      csrfTokenCache = null;
      // A lost session on a data request signs the user out in-app. Login and the
      // session probe answer 401 for their own reasons and must not sign anyone out.
      if (!SESSION_PROBE_ENDPOINTS.includes(endpoint)) {
        unauthorizedListeners.forEach((listener) => listener());
      }
    }

    const payload: ApiErrorPayload = isJson
      ? body
      : {
          message: typeof body === "string" ? body : "API request failed.",
          code: `HTTP_${response.status}`,
        };

    throw new ApiError(response.status, payload);
  }

  return body as T;
}
