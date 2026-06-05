import { useCallback, useLayoutEffect, useState } from "react";
import { clearAccessToken, getAccessToken } from "./api/auth";
import { setAuthHandlers } from "./api/client";
import type { FieldErrors } from "./api/errors";
import { BuildInfo } from "./components/BuildInfo";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { LoginForm } from "./components/LoginForm";
import { NoteForm } from "./components/NoteForm";
import { NoteList } from "./components/NoteList";
import { useLoginMutation, useMeQuery } from "./hooks/useAuth";
import {
  prefetchNote,
  useCreateNote,
  useDeleteNote,
  useNoteQuery,
  useNotesQuery,
  useUpdateNote,
} from "./hooks/useNotes";
import { queryClient } from "./query/client";
import { applyMappedError, mapApiError } from "./query/errors";
import { authKeys, notesKeys } from "./query/keys";
import { formatUpdatedAt } from "./formatUpdatedAt";
import type { Note } from "./types/note";

function emptyForm() {
  return { title: "", body: "" };
}

export default function App() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const meQuery = useMeQuery();
  const loginMutation = useLoginMutation();
  const notesEnabled = meQuery.isSuccess && meQuery.data != null;

  const {
    data: notes = [],
    isPending: loading,
    isError,
    error: notesError,
  } = useNotesQuery(notesEnabled);

  const noteDetail = useNoteQuery(editingId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const saving = createNote.isPending || updateNote.isPending;

  const listError = isError
    ? (mapApiError(notesError, "Failed to load notes").globalMessage ?? null)
    : null;
  const displayError = globalError ?? listError;

  const resetUiState = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm());
    setFieldErrors({});
    setGlobalError(null);
    setPendingDelete(null);
  }, []);

  const resetAuthSession = useCallback(() => {
    queryClient.removeQueries({ queryKey: authKeys.all });
    queryClient.removeQueries({ queryKey: notesKeys.all });
    resetUiState();
  }, [resetUiState]);

  useLayoutEffect(() => {
    setAuthHandlers({
      onUnauthorized: resetAuthSession,
    });
  }, [resetAuthSession]);

  const handleLogout = () => {
    clearAccessToken();
    resetAuthSession();
  };

  const showApp = meQuery.isSuccess && meQuery.data != null;
  const showResolving = !!getAccessToken() && meQuery.isPending;
  const showSessionError = !!getAccessToken() && meQuery.isError;

  if (showResolving) {
    return (
      <div
        className="flex min-h-screen flex-col bg-gray-50"
        data-testid="session-resolving"
      >
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
          <p className="text-sm text-gray-500">Checking session…</p>
        </main>
        <footer className="border-t border-gray-200 bg-white px-4 py-3">
          <BuildInfo />
        </footer>
      </div>
    );
  }

  if (showSessionError) {
    const sessionMessage =
      mapApiError(meQuery.error, "Session check failed").globalMessage ??
      "Session check failed";
    return (
      <div
        className="flex min-h-screen flex-col bg-gray-50"
        data-testid="session-error"
      >
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
          <p
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {sessionMessage}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void meQuery.refetch()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </main>
        <footer className="border-t border-gray-200 bg-white px-4 py-3">
          <BuildInfo />
        </footer>
      </div>
    );
  }

  if (!showApp) {
    return (
      <LoginForm
        loginMutation={loginMutation}
        onLoginSuccess={resetUiState}
      />
    );
  }

  const selectNote = (note: Note) => {
    if (note.id <= 0) return;
    setEditingId(note.id);
    setForm({ title: note.title, body: note.body });
    setFieldErrors({});
    setGlobalError(null);
  };

  const startNewNote = () => {
    setEditingId(null);
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

    const payload = { title: trimmedTitle, body: form.body };

    if (editingId === null) {
      createNote.mutate(payload, {
        onSuccess: (created) => selectNote(created),
        onError: (err) => handleMutationError(err, "Failed to save note"),
      });
    } else {
      updateNote.mutate(
        { id: editingId, payload },
        {
          onSuccess: (updated) => selectNote(updated),
          onError: (err) => handleMutationError(err, "Failed to save note"),
        },
      );
    }
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
      if (editingId === id) {
        startNewNote();
      }
      return;
    }
    setGlobalError(null);

    deleteNote.mutate(id, {
      onSuccess: () => {
        setPendingDelete(null);
        if (editingId === id) {
          startNewNote();
        }
      },
      onError: (err) => handleMutationError(err, "Failed to delete note"),
    });
  };

  const editorUpdatedAt = formatUpdatedAt(noteDetail.data?.updated_at);

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50"
      data-testid="notes-app"
    >
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {displayError ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {displayError}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-gray-500">Loading notes…</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-label="Notes list">
              <h2 className="mb-3 text-lg font-medium text-gray-900">All notes</h2>
              <NoteList
                notes={notes}
                selectedId={editingId}
                onSelect={selectNote}
                onDelete={setPendingDelete}
                onPrefetch={(id) => prefetchNote(queryClient, id)}
              />
            </section>

            <section aria-label="Note editor">
              <h2 className="mb-3 text-lg font-medium text-gray-900">
                {editingId === null ? "New note" : "Edit note"}
              </h2>
              {editorUpdatedAt ? (
                <p className="mb-3 text-xs text-gray-500">Last updated {editorUpdatedAt}</p>
              ) : null}
              <NoteForm
                title={form.title}
                body={form.body}
                fieldErrors={fieldErrors}
                isEditing={editingId !== null}
                saving={saving}
                onTitleChange={(title) => setForm((f) => ({ ...f, title }))}
                onBodyChange={(body) => setForm((f) => ({ ...f, body }))}
                onSubmit={handleSubmit}
                onNew={startNewNote}
              />
            </section>
          </div>
        )}
      </main>

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

      <footer className="border-t border-gray-200 bg-white px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}
