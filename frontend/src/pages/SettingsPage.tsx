import { useMeQuery } from "../hooks/useAuth";
import { useLogout } from "../hooks/useLogout";

export function SettingsPage() {
  const meQuery = useMeQuery();
  const logout = useLogout();

  return (
    <div data-testid="settings-app">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-2 text-sm text-gray-500">Your account</p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Username</p>
        <p className="mt-1 text-lg font-medium text-gray-900">
          {meQuery.data?.username ?? "—"}
        </p>
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-6 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Log out
      </button>
    </div>
  );
}
