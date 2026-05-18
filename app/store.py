from threading import Lock

from app.models import Note, NoteCreate, NoteUpdate

_lock = Lock()
_notes: dict[int, Note] = {}
_next_id = 1


def list_notes() -> list[Note]:
    with _lock:
        return sorted(_notes.values(), key=lambda note: note.id)


def get_note(note_id: int) -> Note | None:
    with _lock:
        return _notes.get(note_id)


def create_note(payload: NoteCreate) -> Note:
    global _next_id
    with _lock:
        note = Note(id=_next_id, title=payload.title, body=payload.body)
        _notes[_next_id] = note
        _next_id += 1
        return note


def update_note(note_id: int, payload: NoteUpdate) -> Note | None:
    with _lock:
        existing = _notes.get(note_id)
        if existing is None:
            return None
        data = existing.model_dump()
        if payload.title is not None:
            data["title"] = payload.title
        if payload.body is not None:
            data["body"] = payload.body
        updated = Note(**data)
        _notes[note_id] = updated
        return updated


def delete_note(note_id: int) -> bool:
    with _lock:
        return _notes.pop(note_id, None) is not None


def reset_store() -> None:
    """Clear in-memory state (used by tests)."""
    global _next_id
    with _lock:
        _notes.clear()
        _next_id = 1
