from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.auth.security import INVALID_CREDENTIALS, create_access_token
from app.auth.users import _to_user_read, authenticate_user
from app.database import get_db
from app.db_models import UserRow
from app.models import Token, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(
    username: str = Form(),
    password: str = Form(default=""),
    db: Session = Depends(get_db),
) -> Token:
    user = authenticate_user(db, username, password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(sub=str(user.id))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: UserRow = Depends(get_current_user)) -> UserRead:
    return _to_user_read(current_user)
