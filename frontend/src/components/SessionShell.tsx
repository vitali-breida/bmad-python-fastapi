import { BuildInfo } from "./BuildInfo";

export function SessionResolvingShell() {
  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50"
      data-testid="session-resolving"
    >
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <p className="text-sm text-gray-500">Checking session…</p>
      </main>
      <footer className="border-t border-gray-200 bg-white px-4 py-3">
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
      className="flex min-h-screen flex-col bg-gray-50"
      data-testid="session-error"
    >
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
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
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </main>
      <footer className="border-t border-gray-200 bg-white px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}
