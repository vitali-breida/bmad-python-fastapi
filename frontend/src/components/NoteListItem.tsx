import { useEffect, useRef, useState } from "react";
import { formatUpdatedAt } from "../formatUpdatedAt";
import type { Note } from "../types/note";

const NOTE_ACTION_MENU_CLOSE = "notes:close-action-menus";

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const deleteItemRef = useRef<HTMLButtonElement>(null);
  const updatedLabel = formatUpdatedAt(note.updated_at);

  useEffect(() => {
    const onCloseOthers = (e: Event) => {
      const { noteId } = (e as CustomEvent<{ noteId: number }>).detail;
      if (noteId !== note.id) setMenuOpen(false);
    };
    document.addEventListener(NOTE_ACTION_MENU_CLOSE, onCloseOthers);
    return () => document.removeEventListener(NOTE_ACTION_MENU_CLOSE, onCloseOthers);
  }, [note.id]);

  useEffect(() => {
    if (!menuOpen) return;
    deleteItemRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen((open) => {
      const next = !open;
      if (next) {
        document.dispatchEvent(
          new CustomEvent(NOTE_ACTION_MENU_CLOSE, { detail: { noteId: note.id } }),
        );
      }
      return next;
    });
  };

  return (
    <li
      className={`flex items-start justify-between gap-2 p-3 ${
        selected ? "bg-accent/5" : "hover:bg-surface-muted"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(note)}
        onMouseEnter={() => onPrefetch?.(note.id)}
        onFocus={() => onPrefetch?.(note.id)}
        className="min-w-0 flex-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
      >
        <span className="block truncate font-medium text-text">{note.title}</span>
        {note.body ? (
          <span className="mt-0.5 block truncate text-sm text-text-muted">
            {note.body}
          </span>
        ) : null}
        {updatedLabel ? (
          <span className="mt-0.5 block text-xs text-text-muted/70">
            Updated {updatedLabel}
          </span>
        ) : null}
      </button>
      {showActions && note.id > 0 && onDelete ? (
        <div className="relative shrink-0">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
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
                tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-surface-muted bg-surface-card py-1 shadow-lg"
              >
                <button
                  ref={deleteItemRef}
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
