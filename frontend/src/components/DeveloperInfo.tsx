import { CollapsibleSection } from "./CollapsibleSection";
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
    <CollapsibleSection
      title="Developer info"
      className="mt-6 border-dashed bg-surface-muted/50"
      contentClassName="pt-3"
    >
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
    </CollapsibleSection>
  );
}
