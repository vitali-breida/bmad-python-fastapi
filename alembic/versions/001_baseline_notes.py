"""baseline notes table

Revision ID: 001_baseline_notes
Revises:
Create Date: 2026-05-19

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "001_baseline_notes"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.String(length=10_000), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("notes")
