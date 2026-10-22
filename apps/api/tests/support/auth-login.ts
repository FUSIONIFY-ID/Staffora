import request from "supertest";
import type { Express } from "express";

// POST /auth/login is CSRF-protected like every other state-changing request, so a test has to
// do what the browser does: get a token on an anonymous session first, then sign in with it.
// Shared so every suite that logs in follows the same flow.

const LOGIN_PATH = "/api/v1/auth/login";
const CSRF_TOKEN_PATH = "/api/v1/auth/csrf-token";

export interface CsrfSession {
  cookie: string;
  csrfToken: string;
}

/** Returns the `staffora.sid=<value>` pair from a response, or an empty string when none was set. */
export function sessionCookieFrom(headers: Record<string, unknown>): string {
  const setCookie = headers["set-cookie"];
  const cookie = Array.isArray(setCookie)
    ? setCookie.find((value) => String(value).startsWith("staffora.sid="))
    : undefined;
  return typeof cookie === "string" ? (cookie.split(";")[0] ?? "") : "";
}

/** Gets a CSRF token for the given session cookie, or for a new anonymous session when omitted. */
export async function fetchCsrfSession(
  app: Express,
  cookie?: string,
): Promise<CsrfSession> {
  const call = request(app).get(CSRF_TOKEN_PATH);
  const response = await (cookie ? call.set("Cookie", cookie) : call);
  const csrfToken: unknown = response.body?.data?.csrfToken;
  if (response.status !== 200 || typeof csrfToken !== "string") {
    throw new Error(
      `GET ${CSRF_TOKEN_PATH} failed with status ${response.status}`,
    );
  }
  // A stale or revoked cookie is replaced by a fresh anonymous session; prefer the new cookie.
  return {
    cookie: sessionCookieFrom(response.headers) || cookie || "",
    csrfToken,
  };
}

/** Signs in the way the web client does: CSRF token first, then POST /auth/login with it. */
export async function postLogin(
  app: Express,
  body: Record<string, unknown>,
  cookie?: string,
): Promise<request.Response> {
  const session = await fetchCsrfSession(app, cookie);
  return request(app)
    .post(LOGIN_PATH)
    .set("Cookie", session.cookie)
    .set("X-CSRF-Token", session.csrfToken)
    .send(body);
}
