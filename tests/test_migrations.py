from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text


def _alembic_config(db_path: Path) -> Config:
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path.as_posix()}")
    return cfg


def test_upgrade_preserves_rows_and_leaves_updated_at_null(tmp_path: Path) -> None:
    db_path = tmp_path / "migrate.db"
    cfg = _alembic_config(db_path)
    url = f"sqlite:///{db_path.as_posix()}"
    engine = create_engine(url, connect_args={"check_same_thread": False})

    command.upgrade(cfg, "001baseline")

    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO notes (title, body) VALUES ('first', 'a'), ('second', 'b')")
        )

    command.upgrade(cfg, "head")

    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM notes")).scalar_one()
        null_updated = conn.execute(
            text("SELECT COUNT(*) FROM notes WHERE updated_at IS NULL")
        ).scalar_one()

    assert count == 2
    assert null_updated == 2


def test_update_note_sets_updated_at(client: TestClient) -> None:
    create = client.post("/notes", json={"title": "Draft", "body": "v1"})
    assert create.status_code == 201
    assert create.json()["updated_at"] is None

    update = client.put("/notes/1", json={"body": "v2"})
    assert update.status_code == 200
    assert update.json()["updated_at"] is not None
