import { DeveloperInfo } from "../components/DeveloperInfo";
import { useMeQuery } from "../hooks/useAuth";
import { useLogout } from "../hooks/useLogout";

export function SettingsPage() {
  const meQuery = useMeQuery();
  const logout = useLogout();

  return (
    <div data-testid="settings-app">
      <h1 className="text-2xl font-semibold text-text">Settings</h1>
      <p className="mt-2 text-sm text-text-muted">Your account</p>

      <div className="mt-6 rounded-card border border-surface-muted bg-surface-card p-6 shadow-card">
        <p className="text-sm text-text-muted">Username</p>
        <p className="mt-1 text-lg font-medium text-text">
          {meQuery.data?.username ?? "—"}
        </p>
      </div>

      <DeveloperInfo />

      <button
        type="button"
        onClick={logout}
        className="mt-6 rounded-md border border-surface-muted bg-surface-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
      >
        Log out
      </button>
    </div>
  );
}
