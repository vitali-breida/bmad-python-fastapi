import { useCallback, useLayoutEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { getAccessToken } from "./api/auth";
import { setAuthHandlers } from "./api/client";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NoteDetailPage } from "./pages/NoteDetailPage";
import { NotesListPage } from "./pages/NotesListPage";
import { SettingsPage } from "./pages/SettingsPage";
import { queryClient } from "./query/client";
import { clearSessionCaches } from "./query/session";

function RootRedirect() {
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const navigate = useNavigate();

  const resetAuthSession = useCallback(() => {
    clearSessionCaches(queryClient);
  }, []);

  useLayoutEffect(() => {
    setAuthHandlers({
      onUnauthorized: () => {
        resetAuthSession();
        navigate("/login", { replace: true });
      },
    });
  }, [resetAuthSession, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notes" element={<NotesListPage />} />
          <Route path="/notes/:id" element={<NoteDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
