"""Guards for the Supabase Data API lockdown migration.

The static test always runs. The live checks run only when
CAREERTRACK_PG_TEST_URL points at a migrated, disposable PostgreSQL database,
for example:

    CAREERTRACK_PG_TEST_URL=postgresql+psycopg://postgres:pw@127.0.0.1:55432/careertrack
"""
import importlib.util
import os
import unittest
from pathlib import Path

from sqlalchemy import create_engine, text

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.db.base import Base


MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "alembic"
    / "versions"
    / "d8a0b2c4e6f7_lock_down_supabase_data_api.py"
)


def load_migration():
    spec = importlib.util.spec_from_file_location("lockdown_migration", MIGRATION_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class LockdownCoverageTest(unittest.TestCase):
    def test_every_model_table_is_protected(self):
        protected = set(load_migration().PROTECTED_TABLES)
        model_tables = set(Base.metadata.tables)
        missing = model_tables - protected
        self.assertFalse(
            missing,
            f"New tables must be added to a Data API lockdown migration: {sorted(missing)}",
        )
        self.assertIn("alembic_version", protected)


@unittest.skipUnless(
    os.getenv("CAREERTRACK_PG_TEST_URL"),
    "Set CAREERTRACK_PG_TEST_URL to run live PostgreSQL lockdown checks",
)
class LiveLockdownTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(os.environ["CAREERTRACK_PG_TEST_URL"])
        cls.tables = load_migration().PROTECTED_TABLES

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def test_rls_enabled_without_permissive_policies(self):
        with self.engine.connect() as connection:
            rows = dict(connection.execute(text(
                "SELECT c.relname, c.relrowsecurity FROM pg_class c "
                "JOIN pg_namespace n ON n.oid = c.relnamespace "
                "WHERE n.nspname = 'public' AND c.relname = ANY(:tables)"
            ), {"tables": list(self.tables)}).all())
            policies = connection.execute(text(
                "SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = ANY(:tables)"
            ), {"tables": list(self.tables)}).scalar_one()

        self.assertEqual(set(rows), set(self.tables))
        self.assertTrue(all(rows.values()), f"RLS disabled on: {[t for t, on in rows.items() if not on]}")
        self.assertEqual(policies, 0, "Lockdown relies on deny-by-default; no policies expected")

    def test_api_roles_have_no_table_privileges(self):
        with self.engine.connect() as connection:
            roles = connection.execute(text(
                "SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')"
            )).scalars().all()
            if not roles:
                self.skipTest("Supabase API roles are not present in this database")
            grants = connection.execute(text(
                "SELECT grantee, table_name FROM information_schema.role_table_grants "
                "WHERE table_schema = 'public' AND grantee = ANY(:roles) AND table_name = ANY(:tables)"
            ), {"roles": roles, "tables": list(self.tables)}).all()

        self.assertEqual(grants, [], f"API roles still hold privileges: {grants}")

    def test_api_roles_cannot_read_rows_even_if_granted(self):
        with self.engine.connect() as connection:
            has_anon = connection.execute(text("SELECT 1 FROM pg_roles WHERE rolname = 'anon'")).first()
            connection.rollback()
            if not has_anon:
                self.skipTest("Supabase anon role is not present in this database")
            transaction = connection.begin()
            try:
                connection.execute(text("GRANT SELECT ON public.users TO anon"))
                connection.execute(text("SET LOCAL ROLE anon"))
                visible = connection.execute(text("SELECT count(*) FROM public.users")).scalar_one()
            finally:
                transaction.rollback()

        self.assertEqual(visible, 0)


if __name__ == "__main__":
    unittest.main()
