import type { Note } from "../types/note";

type NoteListProps = {
  notes: Note[];
  selectedId: number | null;
  onSelect: (note: Note) => void;
  onDelete: (note: Note) => void;
};

export function NoteList({ notes, selectedId, onSelect, onDelete }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-gray-500" data-testid="notes-empty">
        No notes yet. Create your first note using the form.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {notes.map((note) => {
        const selected = note.id === selectedId;
        return (
          <li
            key={note.id}
            className={`flex items-start justify-between gap-2 p-3 ${
              selected ? "bg-indigo-50" : "hover:bg-gray-50"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(note)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate font-medium text-gray-900">{note.title}</span>
              {note.body ? (
                <span className="mt-0.5 block truncate text-sm text-gray-500">{note.body}</span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => onDelete(note)}
              className="shrink-0 text-sm text-red-600 hover:text-red-800"
              aria-label={`Delete note ${note.title}`}
            >
              Delete
            </button>
          </li>
        );
      })}
    </ul>
  );
}
