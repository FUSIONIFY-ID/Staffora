import { ApiError } from "../../api/client.js";

export const GENERIC_LOGIN_ERROR = "Invalid email or password.";

/**
 * Maps a failed sign-in to user-facing copy. Every 401 shows the same message, even
 * when the backend says why (for example an inactive account), so the form never
 * reveals whether an account exists or is active. A 422 means the request body failed
 * validation, which is not a credential problem, so it gets its own message.
 */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return GENERIC_LOGIN_ERROR;
    }
    if (error.status === 422) {
      return "Check your email and password, then try again.";
    }
    if (error.status === 429) {
      return "Too many sign-in attempts. Please wait a few minutes and try again.";
    }
  }
  return "Unable to sign in right now. Please try again shortly.";
}
