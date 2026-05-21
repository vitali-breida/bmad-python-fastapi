from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.security import verify_password
from app.db_models import UserRow
from app.models import UserRead

MIN_USERNAME_LENGTH = 3


def _to_user_read(row: UserRow) -> UserRead:
    return UserRead(id=row.id, username=row.username)


def get_user_by_username(db: Session, username: str) -> UserRow | None:
    normalized = username.strip()
    if len(normalized) < MIN_USERNAME_LENGTH:
        return None
    return db.scalar(select(UserRow).where(UserRow.username == normalized))


def get_user_by_id(db: Session, user_id: int) -> UserRow | None:
    return db.get(UserRow, user_id)


def authenticate_user(db: Session, username: str, password: str) -> UserRow | None:
    user = get_user_by_username(db, username)
    if user is None:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
