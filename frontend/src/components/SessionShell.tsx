import { BuildInfo } from "./BuildInfo";

export function SessionResolvingShell() {
  return (
    <div
      className="flex min-h-screen flex-col bg-surface"
      data-testid="session-resolving"
    >
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <div className="rounded-card border border-surface-muted bg-surface-card p-8 shadow-card">
          <p className="text-sm text-text-muted">Checking session…</p>
        </div>
      </main>
      <footer className="border-t border-surface-muted bg-surface-card px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}

type SessionErrorShellProps = {
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
};

export function SessionErrorShell({
  message,
  onRetry,
  onSignOut,
}: SessionErrorShellProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-surface"
      data-testid="session-error"
    >
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <div className="rounded-card border border-surface-muted bg-surface-card p-8 shadow-card">
          <p
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {message}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md border border-surface-muted bg-surface-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
      <footer className="border-t border-surface-muted bg-surface-card px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}
