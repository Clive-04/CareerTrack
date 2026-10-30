"""add skill metadata

Revision ID: a4d6e8f0b2c3
Revises: 9c3e5f7b1d22
"""
from alembic import op
import sqlalchemy as sa

revision = "a4d6e8f0b2c3"
down_revision = "9c3e5f7b1d22"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("skills", sa.Column("category", sa.String(length=50), nullable=False, server_default="Other"))
    op.add_column("skills", sa.Column("proficiency", sa.String(length=30), nullable=False, server_default="Beginner"))
    op.add_column("skills", sa.Column("years_experience", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("skills", sa.Column("notes", sa.Text(), nullable=False, server_default=""))

def downgrade() -> None:
    op.drop_column("skills", "notes")
    op.drop_column("skills", "years_experience")
    op.drop_column("skills", "proficiency")
    op.drop_column("skills", "category")
