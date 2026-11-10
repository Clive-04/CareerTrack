"""add resume metadata

Revision ID: 7a1d3f0c2b11
Revises: 6cbc821cab1d
"""
from alembic import op
import sqlalchemy as sa

revision = "7a1d3f0c2b11"
down_revision = "6cbc821cab1d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("resumes", sa.Column("target_role", sa.String(length=150), nullable=False, server_default=""))
    op.add_column("resumes", sa.Column("skills", sa.Text(), nullable=False, server_default=""))
    op.add_column("resumes", sa.Column("notes", sa.Text(), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("resumes", "notes")
    op.drop_column("resumes", "skills")
    op.drop_column("resumes", "target_role")
