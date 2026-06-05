import { Navigate, useNavigate } from "react-router-dom";
import { getAccessToken } from "../api/auth";
import { LoginForm } from "../components/LoginForm";
import { SessionErrorShell, SessionResolvingShell } from "../components/SessionShell";
import { useLoginMutation, useMeQuery } from "../hooks/useAuth";
import { useLogout } from "../hooks/useLogout";
import { mapApiError } from "../query/errors";

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const meQuery = useMeQuery();
  const logout = useLogout();
  const token = getAccessToken();

  if (token && meQuery.isPending) {
    return <SessionResolvingShell />;
  }

  if (token && meQuery.isError) {
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

  if (meQuery.isSuccess && meQuery.data) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <LoginForm
      loginMutation={loginMutation}
      onLoginSuccess={() => navigate("/dashboard", { replace: true })}
    />
  );
}
