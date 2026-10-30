"""Give skills account ownership without guessing owners of shared records."""
from alembic import op
import sqlalchemy as sa

revision = "b6e8f0a2c4d5"
down_revision = "a4d6e8f0b2c3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("skills", sa.Column("user_id", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_skills_user_id", "skills", "users", ["user_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_skills_user_id", "skills", ["user_id"])
    op.drop_index("ix_skills_name", table_name="skills")
    op.create_index("ix_skills_name", "skills", ["name"])
    op.create_index("uq_skills_user_name", "skills", ["user_id", sa.text("lower(name)")], unique=True)
    # Existing rows have no reliable creator metadata. Preserve them and links,
    # but never expose them as any user's personal skills.


def downgrade():
    duplicate = op.get_bind().execute(sa.text(
        "SELECT 1 FROM skills GROUP BY name HAVING count(*) > 1 LIMIT 1"
    )).first()
    if duplicate:
        raise RuntimeError("Cannot restore global skill uniqueness while duplicate names exist across users.")
    op.drop_index("uq_skills_user_name", table_name="skills")
    op.drop_index("ix_skills_name", table_name="skills")
    op.create_index("ix_skills_name", "skills", ["name"], unique=True)
    op.drop_index("ix_skills_user_id", table_name="skills")
    op.drop_constraint("fk_skills_user_id", "skills", type_="foreignkey")
    op.drop_column("skills", "user_id")
