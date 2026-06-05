import { Link, useNavigate } from "react-router-dom";
import { useMeQuery } from "../hooks/useAuth";
import { useHealthQuery } from "../hooks/useHealth";
import { prefetchNote, useNotesQuery } from "../hooks/useNotes";
import { queryClient } from "../query/client";
import { mapApiError } from "../query/errors";
import { formatUpdatedAt } from "../formatUpdatedAt";

export function DashboardPage() {
  const navigate = useNavigate();
  const meQuery = useMeQuery();
  const notesQuery = useNotesQuery(meQuery.isSuccess);
  const healthQuery = useHealthQuery(meQuery.isSuccess);

  const notes = notesQuery.data ?? [];
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null;
  const username = meQuery.data?.username ?? "";

  const notesError =
    notesQuery.isError
      ? (mapApiError(notesQuery.error, "Failed to load notes").globalMessage ?? null)
      : null;

  const healthError =
    healthQuery.isError
      ? (mapApiError(healthQuery.error, "Failed to load API version").globalMessage ??
        null)
      : null;

  return (
    <div data-testid="dashboard-app">
      <h1 className="text-2xl font-semibold text-gray-900">
        Hello, {username}
      </h1>
      <p className="mt-2 text-sm text-gray-500">Your notes overview</p>

      {notesQuery.isPending ? (
        <p className="mt-6 text-sm text-gray-500">Loading notes…</p>
      ) : notesError ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {notesError}
        </p>
      ) : notes.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">No notes yet</p>
          <button
            type="button"
            onClick={() => navigate("/notes")}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create your first note
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Total notes</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{notes.length}</p>
          </div>
          {latestNote ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Latest note</p>
              <Link
                to={`/notes/${latestNote.id}`}
                onMouseEnter={() => prefetchNote(queryClient, latestNote.id)}
                onFocus={() => prefetchNote(queryClient, latestNote.id)}
                className="mt-1 block truncate font-medium text-indigo-600 hover:text-indigo-800"
              >
                {latestNote.title}
              </Link>
              {formatUpdatedAt(latestNote.updated_at) ? (
                <p className="mt-1 text-xs text-gray-400">
                  Updated {formatUpdatedAt(latestNote.updated_at)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate("/notes")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New note
        </button>
        <Link
          to="/notes"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View all notes
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">API version</p>
        {healthQuery.isPending ? (
          <p className="mt-1 text-sm text-gray-400">Loading…</p>
        ) : healthError ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {healthError}
          </p>
        ) : (
          <p className="mt-1 text-sm font-medium text-gray-900">
            {healthQuery.data?.version ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}
