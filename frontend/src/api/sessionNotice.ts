const SESSION_EXPIRED_NOTICE_KEY = "session_expired_notice";

export function markSessionExpiredNotice(): void {
  sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, "1");
}

export function hasSessionExpiredNotice(): boolean {
  return sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY) === "1";
}

export function clearSessionExpiredNotice(): void {
  sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
}

/** Read once; removes the flag so a manual logout does not show the banner later. */
export function consumeSessionExpiredNotice(): boolean {
  const flagged = hasSessionExpiredNotice();
  if (flagged) {
    clearSessionExpiredNotice();
  }
  return flagged;
}
