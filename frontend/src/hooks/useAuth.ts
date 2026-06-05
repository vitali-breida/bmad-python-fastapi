import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getMe, login } from "../api/auth";
import { authKeys } from "../query/keys";

export function useMeQuery() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => getMe(),
    enabled: !!getAccessToken(),
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
