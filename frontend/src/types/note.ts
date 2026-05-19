export interface Note {
  id: number;
  title: string;
  body: string;
  updated_at: string | null;
}

export interface NoteCreate {
  title: string;
  body: string;
}

export interface NoteUpdate {
  title?: string;
  body?: string;
}
