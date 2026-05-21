import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def _is_production() -> bool:
    env = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
    return env in ("production", "prod")


def get_secret_key() -> str:
    """Return JWT signing secret. Fails fast if unset in production."""
    key = os.getenv("SECRET_KEY")
    if key:
        return key
    if _is_production():
        raise RuntimeError("SECRET_KEY environment variable is required in production")
    raise RuntimeError(
        "SECRET_KEY is not set. Copy .env.example to .env for local development."
    )
