import { useEffect, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { ApiError } from "../api/errors";
import { BuildInfo } from "./BuildInfo";
import {
  LOGIN_PENDING_HINT_MOMENT_MS,
  LOGIN_PENDING_HINT_WAKEUP_MS,
  loginPendingHint,
} from "./loginPendingHint";

type LoginFormProps = {
  loginMutation: UseMutationResult<
    void,
    unknown,
    { username: string; password: string }
  >;
  onLoginSuccess?: () => void;
  sessionExpired?: boolean;
};

function loginErrorMessage(err: unknown): string {
  if (err instanceof TypeError) {
    return "Cannot reach the API. Is uvicorn running on port 8000?";
  }
  if (err instanceof ApiError) {
    return err.message;
  }
  return "Sign in failed";
}

const inputClass =
  "mt-1 w-full rounded-md border border-surface-muted bg-surface-card px-3 py-2 text-sm shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

export function LoginForm({
  loginMutation,
  onLoginSuccess,
  sessionExpired = false,
}: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingElapsedMs, setPendingElapsedMs] = useState(0);

  useEffect(() => {
    if (!loginMutation.isPending) {
      return;
    }

    const startedAt = Date.now();
    const tick = () => setPendingElapsedMs(Date.now() - startedAt);

    tick();
    const intervalId = window.setInterval(tick, 250);
    const momentTimeoutId = window.setTimeout(
      tick,
      LOGIN_PENDING_HINT_MOMENT_MS + 1,
    );
    const wakeupTimeoutId = window.setTimeout(
      tick,
      LOGIN_PENDING_HINT_WAKEUP_MS + 1,
    );

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(momentTimeoutId);
      window.clearTimeout(wakeupTimeoutId);
    };
  }, [loginMutation.isPending]);

  const pendingHint = loginMutation.isPending
    ? loginPendingHint(pendingElapsedMs)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingElapsedMs(0);
    loginMutation.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => {
          onLoginSuccess?.();
        },
        onError: (err) => {
          setError(loginErrorMessage(err));
        },
      },
    );
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-surface"
      data-testid="login-app"
    >
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <div className="rounded-card border border-surface-muted bg-surface-card p-8 shadow-card">
          <h1 className="text-2xl font-semibold text-text">Sign in</h1>
          <p className="mt-2 text-sm text-text-muted">
            Username is case-sensitive (e.g.{" "}
            <code className="font-mono">admin</code>).
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {sessionExpired ? (
              <p
                className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="alert"
                data-testid="session-expired-notice"
              >
                Your session expired. Sign in again to continue.
              </p>
            ) : null}

            {error ? (
              <p
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-text"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>

            {pendingHint ? (
              <p
                className="text-center text-sm text-text-muted"
                role="status"
                aria-live="polite"
                data-testid="login-pending-hint"
              >
                {pendingHint}
              </p>
            ) : null}
          </form>
        </div>
      </main>

      <footer className="border-t border-surface-muted bg-surface-card px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}
