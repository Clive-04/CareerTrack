"""Persist private resume analysis history."""
from alembic import op
import sqlalchemy as sa

revision = "c7f9a1b3d5e6"
down_revision = "b6e8f0a2c4d5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("resume_analyses",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.UUID(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_id", sa.UUID(), sa.ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resume_name", sa.String(150), nullable=False),
        sa.Column("job_title", sa.String(200), nullable=False),
        sa.Column("company", sa.String(150), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_analyses_user_id", "resume_analyses", ["user_id"])
    op.create_index("ix_resume_analyses_job_id", "resume_analyses", ["job_id"])


def downgrade():
    op.drop_table("resume_analyses")
