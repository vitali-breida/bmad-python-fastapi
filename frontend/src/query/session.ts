import type { QueryClient } from "@tanstack/react-query";
import { authKeys, healthKeys, notesKeys } from "./keys";

const SCROLL_KEY = "notes-list-scroll-y";

/** Cancel and remove auth, notes, and health caches; clear list scroll position. */
export function clearSessionCaches(queryClient: QueryClient): void {
  sessionStorage.removeItem(SCROLL_KEY);
  void queryClient.cancelQueries({ queryKey: authKeys.all });
  void queryClient.cancelQueries({ queryKey: notesKeys.all });
  void queryClient.cancelQueries({ queryKey: healthKeys.all });
  queryClient.removeQueries({ queryKey: authKeys.all });
  queryClient.removeQueries({ queryKey: notesKeys.all });
  queryClient.removeQueries({ queryKey: healthKeys.all });
}
