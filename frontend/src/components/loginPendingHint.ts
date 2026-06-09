export const LOGIN_PENDING_HINT_MOMENT_MS = 2_000;
export const LOGIN_PENDING_HINT_WAKEUP_MS = 8_000;

export function loginPendingHint(elapsedMs: number): string | null {
  if (elapsedMs > LOGIN_PENDING_HINT_WAKEUP_MS) {
    return "The server may be waking up — please wait.";
  }
  if (elapsedMs > LOGIN_PENDING_HINT_MOMENT_MS) {
    return "This may take a moment on first visit.";
  }
  return null;
}
