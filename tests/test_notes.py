import pytest
from fastapi.testclient import TestClient

from app import store
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_store() -> None:
    store.reset_store()


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_notes_crud_flow() -> None:
    assert client.get("/notes").json() == []

    create = client.post("/notes", json={"title": "Learn FastAPI", "body": "Step 1"})
    assert create.status_code == 201
    note = create.json()
    assert note["id"] == 1
    assert note["title"] == "Learn FastAPI"
    assert note["body"] == "Step 1"

    get_one = client.get("/notes/1")
    assert get_one.status_code == 200
    assert get_one.json() == note

    update = client.put("/notes/1", json={"body": "Step 2"})
    assert update.status_code == 200
    assert update.json()["body"] == "Step 2"

    delete = client.delete("/notes/1")
    assert delete.status_code == 204

    missing = client.get("/notes/1")
    assert missing.status_code == 404


def test_get_missing_note_returns_404() -> None:
    response = client.get("/notes/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"


def test_create_note_requires_title() -> None:
    response = client.post("/notes", json={"body": "no title"})
    assert response.status_code == 422
