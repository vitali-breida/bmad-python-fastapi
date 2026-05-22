import { useEffect, useState } from "react";
import { clearAccessToken, getAccessToken, login } from "./api/auth";
import { setAuthHandlers } from "./api/client";
import { ApiError } from "./api/errors";
import type { FieldErrors } from "./api/errors";
import * as notesApi from "./api/notes";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { LoginForm } from "./components/LoginForm";
import { NoteForm } from "./components/NoteForm";
import { NoteList } from "./components/NoteList";
import type { Note } from "./types/note";

function emptyForm() {
  return { title: "", body: "" };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(
    () => getAccessToken() !== null,
  );
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  useEffect(() => {
    setAuthHandlers({
      onUnauthorized: () => setIsAuthenticated(false),
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      try {
        const data = await notesApi.listNotes();
        if (!cancelled) {
          setNotes(data);
          setGlobalError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            return;
          }
          const message =
            err instanceof TypeError
              ? "Cannot reach the API. Is uvicorn running on port 8000?"
              : err instanceof ApiError
                ? err.message
                : "Failed to load notes";
          setGlobalError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotes();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleLogin = async (username: string, password: string) => {
    await login(username, password);
    setIsAuthenticated(true);
    setNotes([]);
    setEditingId(null);
    setForm(emptyForm());
    setFieldErrors({});
    setGlobalError(null);
    setLoading(true);
  };

  const handleLogout = () => {
    clearAccessToken();
    setIsAuthenticated(false);
    setNotes([]);
    setPendingDelete(null);
    setGlobalError(null);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const selectNote = (note: Note) => {
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

  const handleSubmit = async () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setFieldErrors({ title: "Title is required" });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    setGlobalError(null);
    try {
      if (editingId === null) {
        const created = await notesApi.createNote({
          title: trimmedTitle,
          body: form.body,
        });
        setNotes((prev) => [...prev, created]);
        selectNote(created);
      } else {
        const updated = await notesApi.updateNote(editingId, {
          title: trimmedTitle,
          body: form.body,
        });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        selectNote(updated);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      if (err instanceof ApiError) {
        if (Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors(err.fieldErrors);
        } else {
          setGlobalError(err.message);
        }
      } else if (err instanceof TypeError) {
        setGlobalError("Cannot reach the API. Is uvicorn running on port 8000?");
      } else {
        setGlobalError("Failed to save note");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setGlobalError(null);
    try {
      await notesApi.deleteNote(id);
      setPendingDelete(null);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) {
        startNewNote();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      const message =
        err instanceof TypeError
          ? "Cannot reach the API. Is uvicorn running on port 8000?"
          : err instanceof ApiError
            ? err.message
            : "Failed to delete note";
      setGlobalError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="notes-app">
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

      <main className="mx-auto max-w-5xl px-4 py-8">
        {globalError ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {globalError}
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
              />
            </section>

            <section aria-label="Note editor">
              <h2 className="mb-3 text-lg font-medium text-gray-900">
                {editingId === null ? "New note" : "Edit note"}
              </h2>
              <NoteForm
                title={form.title}
                body={form.body}
                fieldErrors={fieldErrors}
                isEditing={editingId !== null}
                saving={saving}
                onTitleChange={(title) => setForm((f) => ({ ...f, title }))}
                onBodyChange={(body) => setForm((f) => ({ ...f, body }))}
                onSubmit={() => void handleSubmit()}
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
          onConfirm={() => void confirmDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
