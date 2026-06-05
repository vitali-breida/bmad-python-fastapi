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
    <details className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-medium text-gray-900">
        Developer info
      </summary>
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-sm text-gray-500">API version</p>
        {healthQuery.isPending ? (
          <p className="mt-1 text-sm text-gray-400">Loading…</p>
        ) : healthError ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {healthError}
          </p>
        ) : (
          <p className="mt-1 text-sm font-medium text-gray-900">
            {healthQuery.data?.version ?? "—"}
          </p>
        )}
      </div>
    </details>
  );
}
