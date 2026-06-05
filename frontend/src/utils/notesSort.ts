import type { Note } from "../types/note";

function noteSortTime(updated_at: string | null): number {
  if (!updated_at) return 0;
  const t = Date.parse(updated_at);
  return Number.isFinite(t) ? t : 0;
}

export function sortNotesForDisplay(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    const aTime = noteSortTime(a.updated_at);
    const bTime = noteSortTime(b.updated_at);
    if (bTime !== aTime) return bTime - aTime;
    return b.id - a.id;
  });
}
