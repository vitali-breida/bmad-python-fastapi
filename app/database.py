import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.auth.config import _is_production

def _normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


def validate_production_database_url() -> None:
    """Fail at container startup if production uses missing or SQLite DATABASE_URL."""
    if not _is_production():
        return
    raw_url = os.getenv("DATABASE_URL")
    if (
        not raw_url
        or not raw_url.strip()
        or raw_url.strip().lower().startswith("sqlite")
    ):
        raise RuntimeError(
            "DATABASE_URL must be set to a PostgreSQL connection string in production "
            "(e.g. Neon on Render). Do not use SQLite in production."
        )


validate_production_database_url()

DATABASE_URL = _normalize_database_url(
    os.getenv("DATABASE_URL", "sqlite:///./notes.db")
)

_connect_args: dict[str, object] = {}
if DATABASE_URL.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
