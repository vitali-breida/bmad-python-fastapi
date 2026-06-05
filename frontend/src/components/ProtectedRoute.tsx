import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../api/auth";
import { useMeQuery } from "../hooks/useAuth";
import { useLogout } from "../hooks/useLogout";
import { mapApiError } from "../query/errors";
import { SessionErrorShell, SessionResolvingShell } from "./SessionShell";

export function ProtectedRoute() {
  const token = getAccessToken();
  const meQuery = useMeQuery();
  const logout = useLogout();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (meQuery.isPending) {
    return <SessionResolvingShell />;
  }

  if (meQuery.isError) {
    const sessionMessage =
      mapApiError(meQuery.error, "Session check failed").globalMessage ??
      "Session check failed";
    return (
      <SessionErrorShell
        message={sessionMessage}
        onRetry={() => void meQuery.refetch()}
        onSignOut={logout}
      />
    );
  }

  if (!meQuery.data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
