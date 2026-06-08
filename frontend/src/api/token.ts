/** Decode JWT `exp` (seconds since epoch). Returns null if payload is missing or malformed. */
export function getJwtExpiryEpochSeconds(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    const payload = JSON.parse(atob(base64)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True when JWT has a valid `exp` claim in the past. Malformed tokens return false (server decides). */
export function isAccessTokenExpired(token: string, nowEpochSec = Math.floor(Date.now() / 1000)): boolean {
  const exp = getJwtExpiryEpochSeconds(token);
  if (exp === null) {
    return false;
  }
  return nowEpochSec >= exp;
}
