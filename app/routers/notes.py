from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app import store
from app.database import get_db
from app.models import Note, NoteCreate, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[Note])
def list_notes(db: Session = Depends(get_db)) -> list[Note]:
    return store.list_notes(db)


@router.post("", response_model=Note, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)) -> Note:
    return store.create_note(db, payload)


@router.get("/{note_id}", response_model=Note)
def get_note(note_id: int, db: Session = Depends(get_db)) -> Note:
    note = store.get_note(db, note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=Note)
def update_note(note_id: int, payload: NoteUpdate, db: Session = Depends(get_db)) -> Note:
    note = store.update_note(db, note_id, payload)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db)) -> Response:
    if not store.delete_note(db, note_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
