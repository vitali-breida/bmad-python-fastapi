import { useCallback, useLayoutEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { FieldErrors } from "../api/errors";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExpandableCreatePanel } from "../components/ExpandableCreatePanel";
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
import { clearLastNoteIfMatch } from "../utils/lastNote";
import { sortNotesForDisplay } from "../utils/notesSort";
import type { Note } from "../types/note";

const SCROLL_KEY = "notes-list-scroll-y";

function emptyForm() {
  return { title: "", body: "" };
}

export function NotesListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const meQuery = useMeQuery();
  const notesEnabled = meQuery.isSuccess && meQuery.data != null;
  const [bootstrapNew] = useState(() => searchParams.get("new") === "1");

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [panelOverride, setPanelOverride] = useState<boolean | null>(null);

  const {
    data: notes = [],
    isPending: loading,
    isError,
    error: notesError,
  } = useNotesQuery(notesEnabled);

  const sortedNotes = sortNotesForDisplay(notes);
  const panelExpanded =
    panelOverride ?? (bootstrapNew || (!loading && sortedNotes.length === 0));

  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const saving = createNote.isPending;

  const listError = isError
    ? (mapApiError(notesError, "Failed to load notes").globalMessage ?? null)
    : null;
  const displayError = globalError ?? listError;

  useLayoutEffect(() => {
    if (bootstrapNew) {
      setSearchParams({}, { replace: true });
    }
  }, [bootstrapNew, setSearchParams]);

  useLayoutEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = Number(saved);
      sessionStorage.removeItem(SCROLL_KEY);
      if (Number.isFinite(y) && y >= 0) {
        const frameId = requestAnimationFrame(() => window.scrollTo(0, y));
        return () => cancelAnimationFrame(frameId);
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

  const resetForm = () => {
    setForm(emptyForm());
    setFieldErrors({});
    setGlobalError(null);
  };

  const handleCancelCreate = () => {
    setPanelOverride(false);
    resetForm();
  };

  const toggleCreatePanel = () => {
    if (panelExpanded) {
      handleCancelCreate();
    } else {
      resetForm();
      setPanelOverride(true);
    }
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
        onSuccess: (created) =>
          navigate(`/notes/${created.id}`, { state: { toast: "Note created" } }),
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
      onSuccess: () => {
        clearLastNoteIfMatch(id);
        setPendingDelete(null);
        const list = queryClient.getQueryData<Note[]>(notesKeys.list());
        if (list && list.filter((note) => note.id !== id).length === 0) {
          setPanelOverride(null);
        }
      },
      onError: (err) => handleMutationError(err, "Failed to delete note"),
    });
  };

  return (
    <div data-testid="notes-app">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Notes</h1>
        <button
          type="button"
          onClick={toggleCreatePanel}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          + New note
        </button>
      </div>

      {displayError ? (
        <p
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {displayError}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-text-muted">Loading notes…</p>
      ) : (
        <div className="mt-6">
          <ExpandableCreatePanel
            expanded={panelExpanded}
            title={form.title}
            body={form.body}
            fieldErrors={fieldErrors}
            saving={saving}
            onTitleChange={(title) => setForm((f) => ({ ...f, title }))}
            onBodyChange={(body) => setForm((f) => ({ ...f, body }))}
            onSubmit={handleSubmit}
            onCancel={handleCancelCreate}
          />

          <section aria-label="Notes list">
            <NoteList
              notes={sortedNotes}
              selectedId={null}
              onSelect={selectNote}
              onDelete={setPendingDelete}
              onPrefetch={(id) => prefetchNote(queryClient, id)}
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
