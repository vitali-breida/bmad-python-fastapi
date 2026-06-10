import type { Note } from "../types/note";
import { NoteListItem } from "./NoteListItem";

type RecentNotesListProps = {
  notes: Note[];
  onSelect: (note: Note) => void;
  onPrefetch?: (id: number) => void;
};

export function RecentNotesList({ notes, onSelect, onPrefetch }: RecentNotesListProps) {
  if (notes.length === 0) return null;

  return (
    <section aria-label="Recent notes" data-testid="recent-notes">
      <h2 className="mb-3 text-lg font-medium text-text">Recent notes</h2>
      <ul className="divide-y divide-surface-muted rounded-card border border-surface-muted bg-surface-card shadow-card">
        {notes.map((note) => (
          <NoteListItem
            key={note.id}
            note={note}
            showActions={false}
            onSelect={onSelect}
            onPrefetch={onPrefetch}
          />
        ))}
      </ul>
    </section>
  );
}
