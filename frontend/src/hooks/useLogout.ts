import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { clearAccessToken } from "../api/auth";
import { clearSessionCaches } from "../query/session";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    clearAccessToken();
    clearSessionCaches(queryClient);
    navigate("/login", { replace: true });
  };
}
