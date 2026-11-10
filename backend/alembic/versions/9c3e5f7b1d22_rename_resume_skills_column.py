"""rename resume skills metadata column

Revision ID: 9c3e5f7b1d22
Revises: 8b2e4f1a6c90
"""
from alembic import op

revision = "9c3e5f7b1d22"
down_revision = "8b2e4f1a6c90"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("resumes", "skills", new_column_name="skills_json")


def downgrade() -> None:
    op.alter_column("resumes", "skills_json", new_column_name="skills")
