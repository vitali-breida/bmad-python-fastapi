import type { Note } from "../types/note";
import { NoteListItem } from "./NoteListItem";

type NoteListProps = {
  notes: Note[];
  selectedId: number | null;
  onSelect: (note: Note) => void;
  onDelete: (note: Note) => void;
  onPrefetch?: (id: number) => void;
};

export function NoteList({
  notes,
  selectedId,
  onSelect,
  onDelete,
  onPrefetch,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-gray-500" data-testid="notes-empty">
        No notes yet. Use the button above to create your first note.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {notes.map((note) => (
        <NoteListItem
          key={note.id}
          note={note}
          selected={note.id === selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          onPrefetch={onPrefetch}
        />
      ))}
    </ul>
  );
}
