import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.deps import get_current_user
from app.auth.security import hash_password
from app.database import get_db
from app.db_models import Base, UserRow
from app.main import app

TEST_DATABASE_URL = "sqlite://"
TEST_USER_USERNAME = "testuser"
TEST_USER_PASSWORD = "test-password"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def _test_secret_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "SECRET_KEY",
        "test-secret-key-for-pytest-only-not-production",
    )


@pytest.fixture
def db() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db: Session) -> UserRow:
    user = UserRow(
        username=TEST_USER_USERNAME,
        hashed_password=hash_password(TEST_USER_PASSWORD),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def client(db: Session, test_user: UserRow) -> Generator[TestClient, None, None]:
    """Mode A: bypass JWT; notes tests stay fast."""

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass

    def override_get_current_user() -> UserRow:
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(db: Session, test_user: UserRow) -> Generator[TestClient, None, None]:
    """Mode B: real login → Bearer; only get_db is overridden."""

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
