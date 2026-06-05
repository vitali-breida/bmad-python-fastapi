const STORAGE_KEY = "last-note";

export type LastNote = {
  id: number;
  title: string;
};

export function getLastNote(): LastNote | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as LastNote).id === "number" &&
      (parsed as LastNote).id > 0 &&
      typeof (parsed as LastNote).title === "string"
    ) {
      return parsed as LastNote;
    }
    return null;
  } catch {
    return null;
  }
}

export function setLastNote(note: LastNote): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(note));
}

export function clearLastNoteIfMatch(id: number): void {
  const last = getLastNote();
  if (last?.id === id) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
