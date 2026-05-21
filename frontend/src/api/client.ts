import { clearAccessToken, getAccessToken } from "./auth";

export type AuthHandlers = {
  onUnauthorized: () => void;
};

let authHandlers: AuthHandlers | null = null;

export function setAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && token) {
    clearAccessToken();
    authHandlers?.onUnauthorized();
  }
  return res;
}
