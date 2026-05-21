import { apiErrorFromResponse } from "./errors";

const TOKEN_KEY = "access_token";

type TokenResponse = {
  access_token: string;
  token_type: string;
};

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<void> {
  const body = new URLSearchParams({ username, password });
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }
  const data = (await res.json()) as TokenResponse;
  setAccessToken(data.access_token);
}
