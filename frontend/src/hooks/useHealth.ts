import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/health";
import { healthKeys } from "../query/keys";

export function useHealthQuery(enabled: boolean) {
  return useQuery({
    queryKey: healthKeys.health(),
    queryFn: () => getHealth(),
    enabled,
    staleTime: 60_000,
  });
}
