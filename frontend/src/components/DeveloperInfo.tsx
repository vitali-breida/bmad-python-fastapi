import { useMeQuery } from "../hooks/useAuth";
import { useHealthQuery } from "../hooks/useHealth";
import { mapApiError } from "../query/errors";

export function DeveloperInfo() {
  const meQuery = useMeQuery();
  const healthQuery = useHealthQuery(meQuery.isSuccess);

  const healthError =
    healthQuery.isError
      ? (mapApiError(healthQuery.error, "Failed to load API version").globalMessage ??
        null)
      : null;

  return (
    <details className="mt-6 rounded-card border border-surface-muted bg-surface-card p-4 shadow-card">
      <summary className="cursor-pointer text-sm font-medium text-text">
        Developer info
      </summary>
      <div className="mt-3 border-t border-surface-muted pt-3">
        <p className="text-sm text-text-muted">API version</p>
        {healthQuery.isPending ? (
          <p className="mt-1 text-sm text-text-muted/70">Loading…</p>
        ) : healthError ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {healthError}
          </p>
        ) : (
          <p className="mt-1 text-sm font-medium text-text">
            {healthQuery.data?.version ?? "—"}
          </p>
        )}
      </div>
    </details>
  );
}
