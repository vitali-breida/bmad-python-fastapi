from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.security import INVALID_CREDENTIALS, hash_password
from app.db_models import UserRow
from tests.conftest import TEST_USER_PASSWORD, TEST_USER_USERNAME

TEST_SECRET_KEY = "test-secret-key-for-pytest-only-not-production"


def test_login_valid_user_returns_token(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/auth/login",
        data={"username": TEST_USER_USERNAME, "password": TEST_USER_PASSWORD},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_unknown_user_returns_401(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/auth/login",
        data={"username": "nobody", "password": "any"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == INVALID_CREDENTIALS


def test_login_wrong_password_returns_401(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/auth/login",
        data={"username": TEST_USER_USERNAME, "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == INVALID_CREDENTIALS


def test_login_inactive_user_returns_401(auth_client: TestClient, db: Session) -> None:
    inactive = UserRow(
        username="inactive",
        hashed_password=hash_password("pw"),
        is_active=False,
    )
    db.add(inactive)
    db.commit()

    response = auth_client.post(
        "/auth/login",
        data={"username": "inactive", "password": "pw"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == INVALID_CREDENTIALS


def test_list_notes_without_token_returns_401(auth_client: TestClient) -> None:
    response = auth_client.get("/notes")
    assert response.status_code == 401


def test_list_notes_with_invalid_token_returns_401(auth_client: TestClient) -> None:
    response = auth_client.get(
        "/notes",
        headers={"Authorization": "Bearer not-a-jwt"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_list_notes_with_non_integer_sub_returns_401(auth_client: TestClient) -> None:
    token = jwt.encode(
        {"sub": "not-an-id", "exp": datetime.now(UTC) + timedelta(minutes=5)},
        TEST_SECRET_KEY,
        algorithm="HS256",
    )
    response = auth_client.get(
        "/notes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_list_notes_with_expired_token_returns_401(auth_client: TestClient) -> None:
    token = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        TEST_SECRET_KEY,
        algorithm="HS256",
    )
    response = auth_client.get(
        "/notes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_list_notes_with_missing_user_sub_returns_401(auth_client: TestClient) -> None:
    token = jwt.encode(
        {"sub": "99999", "exp": datetime.now(UTC) + timedelta(minutes=5)},
        TEST_SECRET_KEY,
        algorithm="HS256",
    )
    response = auth_client.get(
        "/notes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_list_notes_after_user_deactivated_returns_401(
    auth_client: TestClient,
    db: Session,
    test_user: UserRow,
) -> None:
    login = auth_client.post(
        "/auth/login",
        data={"username": TEST_USER_USERNAME, "password": TEST_USER_PASSWORD},
    )
    token = login.json()["access_token"]

    test_user.is_active = False
    db.commit()

    response = auth_client.get(
        "/notes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_auth_me_with_valid_token(auth_client: TestClient, test_user: UserRow) -> None:
    login = auth_client.post(
        "/auth/login",
        data={"username": TEST_USER_USERNAME, "password": TEST_USER_PASSWORD},
    )
    token = login.json()["access_token"]

    response = auth_client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json() == {"id": test_user.id, "username": TEST_USER_USERNAME}


def test_login_then_list_notes(auth_client: TestClient) -> None:
    login = auth_client.post(
        "/auth/login",
        data={"username": TEST_USER_USERNAME, "password": TEST_USER_PASSWORD},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    response = auth_client.get(
        "/notes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json() == []
