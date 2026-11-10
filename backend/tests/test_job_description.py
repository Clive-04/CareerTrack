import unittest
from pydantic import ValidationError
from app.schemas.job import JobCreate, JobUpdate
from app.schemas.analysis import AnalysisRequest
from app.core.job_description import validate_job_description
from uuid import uuid4


class JobDescriptionTest(unittest.TestCase):
    def test_49_rejected_50_accepted(self):
        for model in [JobCreate, JobUpdate]:
            with self.assertRaises(ValidationError):
                model(company="Example", position="Developer", description="word " * 49)
            self.assertEqual(len(model(company="Example", position="Developer", description="word " * 50).description.split()), 50)

    def test_missing_null_and_whitespace(self):
        with self.assertRaises(ValidationError):
            JobCreate(company="Example", position="Developer")
        for value in [None, "", " \n\t "]:
            with self.assertRaises(ValidationError):
                JobUpdate(description=value)
        self.assertEqual(JobUpdate(company="Renamed").model_dump(exclude_unset=True), {"company": "Renamed"})

    def test_whitespace_and_size_limit(self):
        self.assertEqual(len(validate_job_description("\n\t word  " * 50).split()), 50)
        with self.assertRaises(ValueError):
            validate_job_description("word " * 5000)

    def test_analysis_uses_same_rule(self):
        with self.assertRaises(ValidationError):
            AnalysisRequest(resume_id=uuid4(), consent=True, resume_text="x" * 50, job_description="word " * 49)
