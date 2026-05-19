"""add notes updated_at column

Revision ID: 002updated_at
Revises: 001baseline
Create Date: 2026-05-19

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "002updated_at"
down_revision: str | None = "001baseline"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "notes",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notes", "updated_at")
