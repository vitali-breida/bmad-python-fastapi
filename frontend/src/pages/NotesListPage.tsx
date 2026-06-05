import { useCallback, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FieldErrors } from "../api/errors";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { NoteForm } from "../components/NoteForm";
import { NoteList } from "../components/NoteList";
import { useMeQuery } from "../hooks/useAuth";
import {
  prefetchNote,
  useCreateNote,
  useDeleteNote,
  useNotesQuery,
} from "../hooks/useNotes";
import { queryClient } from "../query/client";
import { applyMappedError, mapApiError } from "../query/errors";
import { notesKeys } from "../query/keys";
import type { Note } from "../types/note";

const SCROLL_KEY = "notes-list-scroll-y";

function emptyForm() {
  return { title: "", body: "" };
}

export function NotesListPage() {
  const navigate = useNavigate();
  const meQuery = useMeQuery();
  const notesEnabled = meQuery.isSuccess && meQuery.data != null;

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const {
    data: notes = [],
    isPending: loading,
    isError,
    error: notesError,
  } = useNotesQuery(notesEnabled);

  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const saving = createNote.isPending;

  const listError = isError
    ? (mapApiError(notesError, "Failed to load notes").globalMessage ?? null)
    : null;
  const displayError = globalError ?? listError;

  useLayoutEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = Number(saved);
      sessionStorage.removeItem(SCROLL_KEY);
      if (Number.isFinite(y) && y >= 0) {
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }
  }, [loading]);

  const selectNote = useCallback(
    (note: Note) => {
      if (note.id <= 0) return;
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      navigate(`/notes/${note.id}`);
    },
    [navigate],
  );

  const startNewNote = () => {
    setForm(emptyForm());
    setFieldErrors({});
    setGlobalError(null);
  };

  const handleMutationError = (err: unknown, fallback: string) => {
    applyMappedError(
      mapApiError(err, fallback),
      setGlobalError,
      setFieldErrors,
    );
  };

  const handleSubmit = () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setFieldErrors({ title: "Title is required" });
      return;
    }

    setFieldErrors({});
    setGlobalError(null);

    createNote.mutate(
      { title: trimmedTitle, body: form.body },
      {
        onSuccess: (created) => navigate(`/notes/${created.id}`),
        onError: (err) => handleMutationError(err, "Failed to save note"),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete || deleteNote.isPending) return;
    const id = pendingDelete.id;
    if (id <= 0) {
      const list = queryClient.getQueryData<Note[]>(notesKeys.list());
      if (list) {
        queryClient.setQueryData(
          notesKeys.list(),
          list.filter((note) => note.id !== id),
        );
      }
      setPendingDelete(null);
      return;
    }
    setGlobalError(null);

    deleteNote.mutate(id, {
      onSuccess: () => setPendingDelete(null),
      onError: (err) => handleMutationError(err, "Failed to delete note"),
    });
  };

  return (
    <div data-testid="notes-app">
      <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>

      {displayError ? (
        <p
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {displayError}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading notes…</p>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <section aria-label="Notes list">
            <h2 className="mb-3 text-lg font-medium text-gray-900">All notes</h2>
            <NoteList
              notes={notes}
              selectedId={null}
              onSelect={selectNote}
              onDelete={setPendingDelete}
              onPrefetch={(id) => prefetchNote(queryClient, id)}
            />
          </section>

          <section aria-label="Note editor">
            <h2 className="mb-3 text-lg font-medium text-gray-900">New note</h2>
            <NoteForm
              title={form.title}
              body={form.body}
              fieldErrors={fieldErrors}
              isEditing={false}
              saving={saving}
              onTitleChange={(title) => setForm((f) => ({ ...f, title }))}
              onBodyChange={(body) => setForm((f) => ({ ...f, body }))}
              onSubmit={handleSubmit}
              onNew={startNewNote}
            />
          </section>
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete note?"
          message={`Delete "${pendingDelete.title}"? This cannot be undone.`}
          confirmLabel={deleteNote.isPending ? "Deleting…" : "Delete"}
          confirmDisabled={deleteNote.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
