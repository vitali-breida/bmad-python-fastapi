from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_notes_crud_flow(client: TestClient) -> None:
    assert client.get("/notes").json() == []

    create = client.post("/notes", json={"title": "Learn FastAPI", "body": "Step 1"})
    assert create.status_code == 201
    note = create.json()
    assert note["id"] == 1
    assert note["title"] == "Learn FastAPI"
    assert note["body"] == "Step 1"
    assert note["updated_at"] is None

    get_one = client.get("/notes/1")
    assert get_one.status_code == 200
    assert get_one.json() == note

    update = client.put("/notes/1", json={"body": "Step 2"})
    assert update.status_code == 200
    updated = update.json()
    assert updated["body"] == "Step 2"
    assert updated["updated_at"] is not None

    delete = client.delete("/notes/1")
    assert delete.status_code == 204

    missing = client.get("/notes/1")
    assert missing.status_code == 404


def test_get_missing_note_returns_404(client: TestClient) -> None:
    response = client.get("/notes/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"


def test_create_note_requires_title(client: TestClient) -> None:
    response = client.post("/notes", json={"body": "no title"})
    assert response.status_code == 422
