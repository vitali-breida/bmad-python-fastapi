import pytest

from app.auth.config import validate_production_config
from app.database import validate_production_database_url


def test_production_missing_database_url_raises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "prod-test-secret")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="DATABASE_URL must be set to a PostgreSQL"):
        validate_production_database_url()


def test_production_sqlite_database_url_raises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "prod-test-secret")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./notes.db")

    with pytest.raises(RuntimeError, match="Do not use SQLite in production"):
        validate_production_database_url()


def test_production_whitespace_database_url_raises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "prod-test-secret")
    monkeypatch.setenv("DATABASE_URL", "   ")

    with pytest.raises(RuntimeError, match="DATABASE_URL must be set to a PostgreSQL"):
        validate_production_database_url()


def test_production_uppercase_sqlite_database_url_raises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "prod-test-secret")
    monkeypatch.setenv("DATABASE_URL", "SQLITE:///./notes.db")

    with pytest.raises(RuntimeError, match="Do not use SQLite in production"):
        validate_production_database_url()


def test_production_postgres_database_url_passes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "prod-test-secret")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://user:pass@ep-example.region.aws.neon.tech/neondb?sslmode=require",
    )

    validate_production_database_url()


def test_non_production_allows_missing_database_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    validate_production_database_url()


def test_validate_production_config_includes_database_guard(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "prod-test-secret")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="DATABASE_URL must be set to a PostgreSQL"):
        validate_production_config()
