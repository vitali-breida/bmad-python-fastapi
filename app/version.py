import os
from functools import lru_cache
from pathlib import Path

_VERSION_FILE = Path(__file__).resolve().parent.parent / "VERSION"


@lru_cache(maxsize=1)
def get_product_version() -> str:
    """Product semver: APP_VERSION env (Docker) else root VERSION file."""
    env_version = os.getenv("APP_VERSION")
    if env_version and env_version.strip():
        return env_version.strip()
    if _VERSION_FILE.is_file():
        return _VERSION_FILE.read_text(encoding="utf-8").strip()
    raise RuntimeError(
        "Product version not found: set APP_VERSION or add a root VERSION file"
    )
