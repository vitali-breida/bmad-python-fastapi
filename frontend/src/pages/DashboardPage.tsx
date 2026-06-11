import { Link, useNavigate } from "react-router-dom";
import { RecentNotesList } from "../components/RecentNotesList";
import { useMeQuery } from "../hooks/useAuth";
import { prefetchNote, useNotesQuery } from "../hooks/useNotes";
import { queryClient } from "../query/client";
import { notesKeys } from "../query/keys";
import { mapApiError } from "../query/errors";
import { getLastNote } from "../utils/lastNote";
import { sortNotesForDisplay } from "../utils/notesSort";
import type { Note } from "../types/note";

const primaryButtonClass =
  "rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90";

export function DashboardPage() {
  const navigate = useNavigate();
  const meQuery = useMeQuery();
  const notesQuery = useNotesQuery(meQuery.isSuccess && meQuery.data != null);

  const sortedNotes = sortNotesForDisplay(notesQuery.data ?? []);
  const recentNotes = sortedNotes.slice(0, 5);
  const username = meQuery.data?.username ?? "";

  const notesError =
    notesQuery.isError
      ? (mapApiError(notesQuery.error, "Failed to load notes").globalMessage ?? null)
      : null;

  const lastNote = getLastNote();
  const continueNote =
    lastNote && sortedNotes.some((n) => n.id === lastNote.id) ? lastNote : null;
  const continueTitle = continueNote
    ? (continueNote.title ||
        queryClient.getQueryData<Note>(notesKeys.detail(continueNote.id))?.title ||
        "Note")
    : null;

  const selectNote = (note: Note) => {
    if (note.id <= 0) return;
    prefetchNote(queryClient, note.id);
    navigate(`/notes/${note.id}`);
  };

  return (
    <div data-testid="dashboard-app">
      <h1 className="text-2xl font-semibold text-text">Hello, {username}</h1>
      <p className="mt-2 text-sm text-text-muted">Create and manage your notes</p>

      {notesQuery.isPending ? (
        <p className="mt-6 text-sm text-text-muted">Loading notes…</p>
      ) : notesError ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {notesError}
        </p>
      ) : sortedNotes.length === 0 ? (
        <div className="mt-6 rounded-card border border-surface-muted bg-surface-card p-6 shadow-card">
          <p className="text-sm text-text-muted">No notes yet</p>
          <button
            type="button"
            onClick={() => navigate("/notes?new=1")}
            className={`mt-4 ${primaryButtonClass}`}
          >
            Create your first note
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate("/notes?new=1")}
              className={primaryButtonClass}
            >
              New note
            </button>
          </div>

          <div className="mt-6">
            <RecentNotesList
              notes={recentNotes}
              onSelect={selectNote}
              onPrefetch={(id) => prefetchNote(queryClient, id)}
            />
          </div>
        </>
      )}

      {continueNote && continueTitle ? (
        <p className="mt-4 text-sm text-text-muted">
          Continue editing:{" "}
          <Link
            to={`/notes/${continueNote.id}`}
            onMouseEnter={() => prefetchNote(queryClient, continueNote.id)}
            onFocus={() => prefetchNote(queryClient, continueNote.id)}
            className="font-medium text-accent hover:text-accent/80"
          >
            {continueTitle}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
