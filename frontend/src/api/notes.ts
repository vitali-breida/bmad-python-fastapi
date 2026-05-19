import { apiErrorFromResponse } from "./errors";
import type { Note, NoteCreate, NoteUpdate } from "../types/note";

const BASE = "/notes";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }
  return res.json() as Promise<T>;
}

export async function listNotes(): Promise<Note[]> {
  const res = await fetch(BASE);
  return parseJson<Note[]>(res);
}

export async function createNote(payload: NoteCreate): Promise<Note> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<Note>(res);
}

export async function updateNote(id: number, payload: NoteUpdate): Promise<Note> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<Note>(res);
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }
}
