"""Lock application tables away from the Supabase Data API.

CareerTrack never uses Supabase's auto-generated REST/GraphQL API. All data
access goes through the FastAPI backend, which connects as the role that owns
these tables (the role that runs Alembic). Table owners are not subject to row
level security unless it is FORCEd, so the backend keeps working unchanged.

On Supabase, the ``anon`` and ``authenticated`` API roles receive ALL
privileges on new ``public`` tables by default. CareerTrack uses its own JWTs,
not Supabase Auth, so ``auth.uid()`` cannot identify a CareerTrack user and
these roles have no legitimate access. This migration therefore:

* enables RLS on every application table and on ``alembic_version`` with no
  policies, so any non-owner role is denied every row (deny by default);
* revokes all table privileges from ``anon`` and ``authenticated``;
* stops future tables created by the migration role from being granted to
  those roles automatically.

FORCE ROW LEVEL SECURITY is deliberately not used: it would block the backend,
which connects as the table owner.

Every role-specific statement is skipped when the role does not exist, so the
migration is a safe no-op for grants on plain PostgreSQL (local Docker, CI).

Downgrade disables RLS and re-grants Supabase's default privileges (ALL) to
``anon`` and ``authenticated``. That deliberately re-opens the exposure this
migration closes; only downgrade to recover from an unexpected failure.
"""
from alembic import op


revision = "d8a0b2c4e6f7"
down_revision = "c7f9a1b3d5e6"
branch_labels = None
depends_on = None


PROTECTED_TABLES = (
    "alembic_version",
    "users",
    "jobs",
    "applications",
    "interviews",
    "resumes",
    "resume_skills",
    "skills",
    "job_skills",
    "resume_analyses",
)

API_ROLES = ("anon", "authenticated")


def _for_each_existing_role(statement_template: str) -> str:
    """Build a DO block that runs a statement for each API role that exists."""
    roles = ", ".join(f"'{role}'" for role in API_ROLES)
    return f"""
DO $$
DECLARE
    api_role text;
BEGIN
    FOREACH api_role IN ARRAY ARRAY[{roles}] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
            EXECUTE format({statement_template!r}, api_role);
        END IF;
    END LOOP;
END
$$;
"""


def upgrade():
    if op.get_bind().dialect.name != "postgresql":
        return

    table_list = ", ".join(f"public.{table}" for table in PROTECTED_TABLES)

    for table in PROTECTED_TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")

    op.execute(_for_each_existing_role(f"REVOKE ALL ON TABLE {table_list} FROM %I"))
    op.execute(_for_each_existing_role(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I"
    ))


def downgrade():
    if op.get_bind().dialect.name != "postgresql":
        return

    table_list = ", ".join(f"public.{table}" for table in PROTECTED_TABLES)

    op.execute(_for_each_existing_role(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %I"
    ))
    op.execute(_for_each_existing_role(f"GRANT ALL ON TABLE {table_list} TO %I"))

    for table in PROTECTED_TABLES:
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY")
