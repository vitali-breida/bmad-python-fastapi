import { clearAccessToken, getAccessToken } from "./auth";
import { markSessionExpiredNotice } from "./sessionNotice";
import { isAccessTokenExpired } from "./token";

export type UnauthorizedReason = "expired" | "rejected";

export type AuthHandlers = {
  onUnauthorized: (reason: UnauthorizedReason) => void;
};

let authHandlers: AuthHandlers | null = null;
let unauthorizedHandled = false;

export function setAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

export function resetUnauthorizedGuard(): void {
  unauthorizedHandled = false;
}

export function handleSessionUnauthorized(reason: UnauthorizedReason): void {
  if (unauthorizedHandled) {
    return;
  }
  unauthorizedHandled = true;
  authHandlers?.onUnauthorized(reason);
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken();
  if (token && isAccessTokenExpired(token)) {
    markSessionExpiredNotice();
    clearAccessToken();
    handleSessionUnauthorized("expired");
    return new Response(JSON.stringify({ detail: "Session expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && token) {
    const reason: UnauthorizedReason = isAccessTokenExpired(token)
      ? "expired"
      : "rejected";
    if (reason === "expired") {
      markSessionExpiredNotice();
    }
    clearAccessToken();
    handleSessionUnauthorized(reason);
  }
  return res;
}
