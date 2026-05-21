"""add users table and seed admin

Revision ID: 003_add_users_table
Revises: 002_add_notes_updated_at
Create Date: 2026-05-21

"""

import os
from collections.abc import Sequence

import sqlalchemy as sa
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

from alembic import op

revision: str = "003_add_users_table"
down_revision: str | None = "002_add_notes_updated_at"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _password_hash() -> PasswordHash:
    return PasswordHash((BcryptHasher(),))


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    initial_password = os.getenv("INITIAL_ADMIN_PASSWORD")
    if not initial_password:
        raise RuntimeError(
            "INITIAL_ADMIN_PASSWORD must be set in the environment before "
            "running alembic upgrade (see .env.example)."
        )

    bind = op.get_bind()
    existing = bind.execute(
        sa.text("SELECT id FROM users WHERE username = :username"),
        {"username": "admin"},
    ).first()
    if existing is not None:
        return

    hashed = _password_hash().hash(initial_password)
    bind.execute(
        sa.text(
            "INSERT INTO users (username, hashed_password, is_active) "
            "VALUES (:username, :hashed_password, :is_active)"
        ),
        {"username": "admin", "hashed_password": hashed, "is_active": True},
    )


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
