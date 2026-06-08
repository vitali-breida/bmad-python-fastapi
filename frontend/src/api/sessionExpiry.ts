import { clearAccessToken, getAccessToken } from "./auth";
import { handleSessionUnauthorized } from "./client";
import { markSessionExpiredNotice } from "./sessionNotice";
import { isAccessTokenExpired } from "./token";
import { queryClient } from "../query/client";
import { clearSessionCaches } from "../query/session";

/** Clear session, caches, and redirect to login when JWT `exp` is in the past. */
export function redirectExpiredSession(): void {
  const token = getAccessToken();
  if (!token || !isAccessTokenExpired(token)) {
    return;
  }
  markSessionExpiredNotice();
  clearAccessToken();
  clearSessionCaches(queryClient);
  handleSessionUnauthorized("expired");
}
