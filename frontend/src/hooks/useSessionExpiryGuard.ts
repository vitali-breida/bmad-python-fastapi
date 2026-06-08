import { useEffect } from "react";
import { redirectExpiredSession } from "../api/sessionExpiry";

/** Re-check JWT expiry when the tab regains focus (e.g. after lunch). */
export function useSessionExpiryGuard(): void {
  useEffect(() => {
    const check = () => redirectExpiredSession();

    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        check();
      }
    });

    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
}
