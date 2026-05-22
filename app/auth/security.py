from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

from app.auth.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, get_secret_key

_password_hash = PasswordHash((BcryptHasher(),))

INVALID_CREDENTIALS = "Incorrect username or password"


def hash_password(plain: str) -> str:
    return _password_hash.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _password_hash.verify(plain, hashed)


def create_access_token(*, sub: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": sub, "exp": expire}
    return jwt.encode(payload, get_secret_key(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            get_secret_key(),
            algorithms=[ALGORITHM],
            options={"require": ["exp"]},
        )
    except jwt.InvalidTokenError:
        return None
