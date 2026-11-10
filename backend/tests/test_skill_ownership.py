import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import app.models
from app.db.base import Base
from app.models import Skill, User
from app.routers.skill import create_skill, get_skill, get_skills, update_skill, delete_skill
from app.schemas.skill import SkillCreate, SkillUpdate


class SkillOwnershipTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.alice = User(email="alice@example.test", first_name="Alice", last_name="Test", password_hash="unused")
        self.bob = User(email="bob@example.test", first_name="Bob", last_name="Test", password_hash="unused")
        self.db.add_all([self.alice, self.bob])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def create(self, user, name="Python"):
        return create_skill(SkillCreate(name=name), self.db, user)

    def test_same_name_allowed_for_different_accounts(self):
        alice_skill = self.create(self.alice)
        bob_skill = self.create(self.bob)
        self.assertNotEqual(alice_skill.id, bob_skill.id)
        self.assertEqual([s.id for s in get_skills(self.db, self.alice)], [alice_skill.id])
        self.assertEqual([s.id for s in get_skills(self.db, self.bob)], [bob_skill.id])

    def test_read_edit_delete_require_ownership(self):
        skill = self.create(self.alice)
        actions = [lambda: get_skill(skill.id, self.db, self.bob),
                   lambda: update_skill(skill.id, SkillUpdate(name="Changed"), self.db, self.bob),
                   lambda: delete_skill(skill.id, self.db, self.bob)]
        for action in actions:
            with self.assertRaises(HTTPException) as error:
                action()
            self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(get_skill(skill.id, self.db, self.alice).name, "Python")
        self.assertEqual(update_skill(skill.id, SkillUpdate(name="SQL"), self.db, self.alice).name, "SQL")
        delete_skill(skill.id, self.db, self.alice)
        self.assertEqual(get_skills(self.db, self.alice), [])

    def test_duplicate_names_rejected_only_for_owner(self):
        self.create(self.alice)
        other = self.create(self.alice, "SQL")
        for action in [lambda: self.create(self.alice, " python "),
                       lambda: update_skill(other.id, SkillUpdate(name="PYTHON"), self.db, self.alice)]:
            with self.assertRaises(HTTPException) as error:
                action()
            self.assertEqual(error.exception.status_code, 409)
        self.create(self.bob, "python")

    def test_database_enforces_case_insensitive_owner_uniqueness(self):
        self.create(self.alice)
        self.db.add(Skill(user_id=self.alice.id, name="PYTHON"))
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

    def test_legacy_skills_preserved_but_hidden(self):
        legacy = Skill(name="Legacy", notes="Unknown owner")
        self.db.add(legacy)
        self.db.commit()
        self.assertEqual(get_skills(self.db, self.alice), [])
        self.assertEqual(get_skills(self.db, self.bob), [])
        with self.assertRaises(HTTPException):
            get_skill(str(legacy.id), self.db, self.alice)
        self.create(self.alice, "Legacy")
        self.assertIsNotNone(self.db.get(Skill, legacy.id))

    def test_skill_name_wildcards_are_literal(self):
        self.create(self.alice, "Python")
        self.create(self.alice, "%")
        self.create(self.alice, "_")
        self.assertEqual(len(get_skills(self.db, self.alice)), 3)
