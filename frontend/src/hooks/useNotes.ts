import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAccessToken } from "../api/auth";
import * as notesApi from "../api/notes";
import { notesKeys } from "../query/keys";
import type { Note, NoteCreate, NoteUpdate } from "../types/note";

let tempIdCounter = -1;

function nextTempId(): number {
  tempIdCounter -= 1;
  return tempIdCounter;
}

function shouldRestoreMutationCache(): boolean {
  return getAccessToken() !== null;
}

function applyNotePatch(note: Note, payload: NoteUpdate): Note {
  return {
    ...note,
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.body !== undefined ? { body: payload.body } : {}),
  };
}

export function useNotesQuery(enabled: boolean) {
  return useQuery({
    queryKey: notesKeys.list(),
    queryFn: () => notesApi.listNotes(),
    enabled,
  });
}

export function useNoteQuery(id: number | null) {
  const queryClient = useQueryClient();
  const validId = id != null && id > 0 ? id : null;

  return useQuery({
    queryKey: validId != null ? notesKeys.detail(validId) : notesKeys.detail(0),
    queryFn: () => notesApi.getNote(validId!),
    enabled: validId != null,
    placeholderData: () => {
      if (validId == null) return undefined;
      const list = queryClient.getQueryData<Note[]>(notesKeys.list());
      return list?.find((note) => note.id === validId);
    },
  });
}

export function prefetchNote(queryClient: QueryClient, id: number): void {
  if (id <= 0) return;
  void queryClient.prefetchQuery({
    queryKey: notesKeys.detail(id),
    queryFn: () => notesApi.getNote(id),
    staleTime: 30_000,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NoteCreate) => notesApi.createNote(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.list() });
      const previous = queryClient.getQueryData<Note[]>(notesKeys.list());
      const tempId = nextTempId();
      const optimistic: Note = {
        id: tempId,
        title: payload.title,
        body: payload.body,
        updated_at: null,
      };
      if (previous) {
        queryClient.setQueryData<Note[]>(notesKeys.list(), [...previous, optimistic]);
      }
      return { previous, tempId };
    },
    onError: (_err, _payload, context) => {
      if (!shouldRestoreMutationCache()) return;
      if (context?.previous) {
        queryClient.setQueryData(notesKeys.list(), context.previous);
      }
    },
    onSuccess: (created, _payload, context) => {
      const list = queryClient.getQueryData<Note[]>(notesKeys.list());
      if (list && context?.tempId != null) {
        queryClient.setQueryData<Note[]>(
          notesKeys.list(),
          list.map((note) => (note.id === context.tempId ? created : note)),
        );
      }
      queryClient.setQueryData(notesKeys.detail(created.id), created);
    },
    onSettled: (created) => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.list() });
      if (created?.id) {
        void queryClient.invalidateQueries({ queryKey: notesKeys.detail(created.id) });
      }
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NoteUpdate }) =>
      notesApi.updateNote(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.list() });
      await queryClient.cancelQueries({ queryKey: notesKeys.detail(id) });
      const previousList = queryClient.getQueryData<Note[]>(notesKeys.list());
      const previousDetail = queryClient.getQueryData<Note>(notesKeys.detail(id));

      if (previousList) {
        queryClient.setQueryData<Note[]>(
          notesKeys.list(),
          previousList.map((note) =>
            note.id === id ? applyNotePatch(note, payload) : note,
          ),
        );
      }
      if (previousDetail) {
        queryClient.setQueryData(
          notesKeys.detail(id),
          applyNotePatch(previousDetail, payload),
        );
      }
      return { previousList, previousDetail, id };
    },
    onError: (_err, { id }, context) => {
      if (!shouldRestoreMutationCache()) return;
      if (context?.previousList) {
        queryClient.setQueryData(notesKeys.list(), context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(notesKeys.detail(id), context.previousDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notesKeys.detail(id) });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notesApi.deleteNote(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.list() });
      await queryClient.cancelQueries({ queryKey: notesKeys.detail(id) });
      const previousList = queryClient.getQueryData<Note[]>(notesKeys.list());
      const previousDetail = queryClient.getQueryData<Note>(notesKeys.detail(id));

      if (previousList) {
        queryClient.setQueryData<Note[]>(
          notesKeys.list(),
          previousList.filter((note) => note.id !== id),
        );
      }
      queryClient.removeQueries({ queryKey: notesKeys.detail(id) });
      return { previousList, previousDetail, id };
    },
    onError: (_err, id, context) => {
      if (!shouldRestoreMutationCache()) return;
      if (context?.previousList) {
        queryClient.setQueryData(notesKeys.list(), context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(notesKeys.detail(id), context.previousDetail);
      }
    },
    onSettled: (_data, _err, id) => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notesKeys.detail(id) });
    },
  });
}
