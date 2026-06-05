import { useState } from "react";
import { formatUpdatedAt } from "../formatUpdatedAt";
import type { Note } from "../types/note";

type NoteListItemProps = {
  note: Note;
  selected?: boolean;
  showActions?: boolean;
  onSelect: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onPrefetch?: (id: number) => void;
};

export function NoteListItem({
  note,
  selected = false,
  showActions = true,
  onSelect,
  onDelete,
  onPrefetch,
}: NoteListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const updatedLabel = formatUpdatedAt(note.updated_at);

  return (
    <li
      className={`flex items-start justify-between gap-2 p-3 ${
        selected ? "bg-indigo-50" : "hover:bg-gray-50"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(note)}
        onMouseEnter={() => onPrefetch?.(note.id)}
        onFocus={() => onPrefetch?.(note.id)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate font-medium text-gray-900">{note.title}</span>
        {note.body ? (
          <span className="mt-0.5 block truncate text-sm text-gray-500">{note.body}</span>
        ) : null}
        {updatedLabel ? (
          <span className="mt-0.5 block text-xs text-gray-400">Updated {updatedLabel}</span>
        ) : null}
      </button>
      {showActions && note.id > 0 && onDelete ? (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={`Actions for note ${note.title}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            ⋯
          </button>
          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(note);
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
