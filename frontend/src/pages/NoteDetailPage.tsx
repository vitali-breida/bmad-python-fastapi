import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import type { FieldErrors } from "../api/errors";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { NoteForm } from "../components/NoteForm";
import { Toast } from "../components/Toast";
import { useDeleteNote, useNoteQuery, useUpdateNote } from "../hooks/useNotes";
import { applyMappedError, mapApiError } from "../query/errors";
import { formatUpdatedAt } from "../formatUpdatedAt";
import { clearLastNoteIfMatch, setLastNote } from "../utils/lastNote";
import type { Note } from "../types/note";

function parseNoteId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

type NoteDetailEditorProps = {
  noteId: number;
  note: Note;
  initialToast: string | null;
};

function NoteDetailEditor({ noteId, note, initialToast }: NoteDetailEditorProps) {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({ title: note.title, body: note.body });
  const [pendingDelete, setPendingDelete] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(initialToast);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const saving = updateNote.isPending;
  const editorUpdatedAt = formatUpdatedAt(note.updated_at);

  useEffect(() => {
    setLastNote({ id: noteId, title: note.title });
  }, [noteId, note.title]);

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

    updateNote.mutate(
      { id: noteId, payload: { title: trimmedTitle, body: form.body } },
      {
        onSuccess: () => setToastMessage("Saved"),
        onError: (err) => handleMutationError(err, "Failed to save note"),
      },
    );
  };

  const confirmDelete = () => {
    if (deleteNote.isPending) return;
    setGlobalError(null);

    deleteNote.mutate(noteId, {
      onSuccess: () => {
        clearLastNoteIfMatch(noteId);
        navigate("/notes");
      },
      onError: (err) => {
        setPendingDelete(false);
        handleMutationError(err, "Failed to delete note");
      },
    });
  };

  return (
    <>
      {toastMessage ? (
        <Toast message={toastMessage} onDismiss={dismissToast} />
      ) : null}

      {globalError ? (
        <p
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {globalError}
        </p>
      ) : null}

      <section aria-label="Note editor">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-text">Edit note</h1>
          <button
            type="button"
            onClick={() => setPendingDelete(true)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete note
          </button>
        </div>
        {editorUpdatedAt ? (
          <p className="mb-3 text-xs text-text-muted">Last updated {editorUpdatedAt}</p>
        ) : null}
        <NoteForm
          title={form.title}
          body={form.body}
          fieldErrors={fieldErrors}
          isEditing
          saving={saving}
          onTitleChange={(title) => setForm((f) => ({ ...f, title }))}
          onBodyChange={(body) => setForm((f) => ({ ...f, body }))}
          onSubmit={handleSubmit}
          secondaryLabel="Back to notes"
          onSecondary={() => navigate("/notes")}
        />
      </section>

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete note?"
          message={`Delete "${note.title}"? This cannot be undone.`}
          confirmLabel={deleteNote.isPending ? "Deleting…" : "Delete"}
          confirmDisabled={deleteNote.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(false)}
        />
      ) : null}
    </>
  );
}

export function NoteDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: idParam } = useParams<{ id: string }>();
  const noteId = parseNoteId(idParam);
  const noteQuery = useNoteQuery(noteId);

  const locationToast =
    typeof location.state === "object" &&
    location.state !== null &&
    "toast" in location.state &&
    typeof (location.state as { toast: unknown }).toast === "string"
      ? (location.state as { toast: string }).toast
      : null;

  const [initialToast] = useState<string | null>(locationToast);

  useEffect(() => {
    if (!locationToast) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, locationToast, navigate]);

  if (noteId === null) {
    return <Navigate to="/notes" replace />;
  }

  if (noteQuery.isError) {
    const message =
      mapApiError(noteQuery.error, "Failed to load note").globalMessage ??
      "Failed to load note";
    return (
      <div data-testid="note-detail-app">
        <p
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {message}
        </p>
        <button
          type="button"
          onClick={() => navigate("/notes")}
          className="mt-4 text-sm text-accent hover:text-accent/80"
        >
          Back to notes
        </button>
      </div>
    );
  }

  const noteTitle = noteQuery.data?.title ?? "Note";

  return (
    <div data-testid="note-detail-app">
      <div className="mb-6">
        <Breadcrumbs noteTitle={noteTitle} />
      </div>

      {noteQuery.isPending || !noteQuery.data ? (
        <p className="text-sm text-text-muted">Loading note…</p>
      ) : (
        <NoteDetailEditor
          key={noteId}
          noteId={noteId}
          note={noteQuery.data}
          initialToast={initialToast}
        />
      )}
    </div>
  );
}
