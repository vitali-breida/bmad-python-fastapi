from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db_models import NoteRow
from app.models import Note, NoteCreate, NoteUpdate


def _to_note(row: NoteRow) -> Note:
    return Note(id=row.id, title=row.title, body=row.body)


def list_notes(db: Session) -> list[Note]:
    rows = db.scalars(select(NoteRow).order_by(NoteRow.id)).all()
    return [_to_note(row) for row in rows]


def get_note(db: Session, note_id: int) -> Note | None:
    row = db.get(NoteRow, note_id)
    return _to_note(row) if row is not None else None


def create_note(db: Session, payload: NoteCreate) -> Note:
    row = NoteRow(title=payload.title, body=payload.body)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_note(row)


def update_note(db: Session, note_id: int, payload: NoteUpdate) -> Note | None:
    row = db.get(NoteRow, note_id)
    if row is None:
        return None
    if payload.title is not None:
        row.title = payload.title
    if payload.body is not None:
        row.body = payload.body
    db.commit()
    db.refresh(row)
    return _to_note(row)


def delete_note(db: Session, note_id: int) -> bool:
    row = db.get(NoteRow, note_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True
