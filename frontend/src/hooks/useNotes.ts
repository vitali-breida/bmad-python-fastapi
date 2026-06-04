import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "../api/notes";
import { queryKeys } from "../query/keys";
import type { NoteCreate, NoteUpdate } from "../types/note";

function invalidateNotes(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
}

export function useNotesQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.notes.all,
    queryFn: () => notesApi.listNotes(),
    enabled,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NoteCreate) => notesApi.createNote(payload),
    onSuccess: () => invalidateNotes(queryClient),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NoteUpdate }) =>
      notesApi.updateNote(id, payload),
    onSuccess: () => invalidateNotes(queryClient),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notesApi.deleteNote(id),
    onSuccess: () => invalidateNotes(queryClient),
  });
}
