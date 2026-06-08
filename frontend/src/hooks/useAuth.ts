import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getMe, login } from "../api/auth";
import { resetUnauthorizedGuard } from "../api/client";
import { authKeys } from "../query/keys";

export function useMeQuery(enabled: boolean = !!getAccessToken()) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => getMe(),
    enabled,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: () => {
      resetUnauthorizedGuard();
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
