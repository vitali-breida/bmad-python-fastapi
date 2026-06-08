import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getAccessToken } from "../api/auth";
import {
  clearSessionExpiredNotice,
  hasSessionExpiredNotice,
} from "../api/sessionNotice";
import { LoginForm } from "../components/LoginForm";
import { SessionErrorShell, SessionResolvingShell } from "../components/SessionShell";
import { useLoginMutation, useMeQuery } from "../hooks/useAuth";
import { useLogout } from "../hooks/useLogout";
import { mapApiError } from "../query/errors";

export function LoginPage() {
  const navigate = useNavigate();
  const [sessionExpired] = useState(() => hasSessionExpiredNotice());
  const loginMutation = useLoginMutation();
  const token = getAccessToken();
  const meQuery = useMeQuery(!!token && !sessionExpired);
  const logout = useLogout();

  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpiredNotice();
    }
  }, [sessionExpired]);

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
      sessionExpired={sessionExpired}
      onLoginSuccess={() => navigate("/dashboard", { replace: true })}
    />
  );
}
