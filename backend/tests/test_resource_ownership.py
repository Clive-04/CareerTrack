import unittest
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.models
from app.db.base import Base
from app.models import Application, Interview, Job, Resume, User
from app.routers.applications import (
    delete_application,
    get_application,
    get_applications,
    update_application,
)
from app.routers.dashboard import get_dashboard_summary
from app.routers.interviews import delete_interview, get_interview, get_interviews, update_interview
from app.routers.jobs import delete_job, get_job, get_jobs, update_job
from app.schemas.application import ApplicationUpdate
from app.schemas.interview import InterviewUpdate
from app.schemas.job import JobUpdate


DESCRIPTION = " ".join(["requirement"] * 50)


class ResourceOwnershipTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.alice = User(email="alice@example.test", first_name="Alice", last_name="Test", password_hash="unused")
        self.bob = User(email="bob@example.test", first_name="Bob", last_name="Test", password_hash="unused")
        self.db.add_all([self.alice, self.bob])
        self.db.flush()

        self.alice_job = Job(
            user_id=self.alice.id,
            company="Alice Co",
            position="Developer",
            description=DESCRIPTION,
            salary_min=50,
            salary_max=100,
        )
        self.bob_job = Job(user_id=self.bob.id, company="Bob Co", position="Analyst", description=DESCRIPTION)
        self.alice_resume = Resume(user_id=self.alice.id, name="Alice resume", file_name="", file_path="")
        self.db.add_all([self.alice_job, self.bob_job, self.alice_resume])
        self.db.flush()

        self.alice_application = Application(
            user_id=self.alice.id,
            job_id=self.alice_job.id,
            resume_id=self.alice_resume.id,
            status="INTERVIEW",
        )
        self.bob_application = Application(user_id=self.bob.id, job_id=self.bob_job.id, status="SAVED")
        self.db.add_all([self.alice_application, self.bob_application])
        self.db.flush()

        self.alice_interview = Interview(
            application_id=self.alice_application.id,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
            type="Video",
            status="SCHEDULED",
        )
        self.db.add(self.alice_interview)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def assert_not_found(self, action):
        with self.assertRaises(HTTPException) as error:
            action()
        self.assertEqual(error.exception.status_code, 404)

    def test_jobs_are_private_to_their_owner(self):
        self.assertEqual([job.id for job in get_jobs(None, None, None, self.alice, self.db)], [str(self.alice_job.id)])
        self.assert_not_found(lambda: get_job(self.alice_job.id, self.bob, self.db))
        self.assert_not_found(
            lambda: update_job(self.alice_job.id, JobUpdate(position="Stolen"), self.bob, self.db)
        )
        self.assert_not_found(lambda: delete_job(self.alice_job.id, self.bob, self.db))
        with self.assertRaises(HTTPException) as error:
            update_job(self.alice_job.id, JobUpdate(salary_min=101), self.alice, self.db)
        self.assertEqual(error.exception.status_code, 422)

    def test_applications_are_private_to_their_owner(self):
        self.assertEqual(
            [application.id for application in get_applications(self.alice, self.db)],
            [str(self.alice_application.id)],
        )
        self.assert_not_found(lambda: get_application(self.alice_application.id, self.bob, self.db))
        self.assert_not_found(
            lambda: update_application(
                self.alice_application.id, ApplicationUpdate(notes="Stolen"), self.bob, self.db
            )
        )
        self.assert_not_found(lambda: delete_application(self.alice_application.id, self.bob, self.db))

    def test_interviews_are_private_through_application_ownership(self):
        self.assertEqual(
            [interview.id for interview in get_interviews(self.alice, self.db)],
            [str(self.alice_interview.id)],
        )
        self.assertEqual(get_interviews(self.bob, self.db), [])
        self.assert_not_found(lambda: get_interview(self.alice_interview.id, self.bob, self.db))
        self.assert_not_found(
            lambda: update_interview(
                self.alice_interview.id, InterviewUpdate(notes="Stolen"), self.bob, self.db
            )
        )
        self.assert_not_found(lambda: delete_interview(self.alice_interview.id, self.bob, self.db))

    def test_dashboard_counts_only_the_current_users_data(self):
        alice = get_dashboard_summary(self.alice, self.db)
        bob = get_dashboard_summary(self.bob, self.db)
        self.assertEqual((alice.total_jobs, alice.total_applications, alice.upcoming_interviews), (1, 1, 1))
        self.assertEqual((bob.total_jobs, bob.total_applications, bob.upcoming_interviews), (1, 1, 0))
        self.assertEqual(alice.recent_applications[0].company, "Alice Co")
        self.assertEqual(bob.recent_applications[0].company, "Bob Co")


if __name__ == "__main__":
    unittest.main()
