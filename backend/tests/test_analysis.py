import io
import json
import unittest
from datetime import datetime
from unittest.mock import patch
from urllib.error import HTTPError

from fastapi import HTTPException, Response
from pydantic import SecretStr, ValidationError
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

import app.models
from app.db.base import Base
from app.models import User, Job, Resume, ResumeAnalysis, Skill
from app.core import gemini
from app.routers import analysis
from app.routers import applications, jobs
from app.schemas.analysis import AnalysisRequest, PreviewRequest
from app.schemas.application import ApplicationCreate

RESUME = "Python developer with three years of experience building SQL databases and REST APIs."
JOB = "Seeking a Python developer with SQL database skills, REST API design and automated testing experience. " + "The developer will maintain services, review code, collaborate with designers, document interfaces, debug production issues and write reliable tests. Applicants should demonstrate version control skills, clear communication, database modeling experience and familiarity with secure application development practices."
RESULT = {"score": 75, "summary": "Relevant Python and SQL experience.", "matches": [{"requirement": "Python", "evidence": "Python developer"}], "gaps": ["Testing experience is not evidenced."], "suggestions": ["Describe testing work if you have done it."]}


class GeminiTest(unittest.TestCase):
    def setUp(self):
        self.config = patch.object(gemini.settings, "GEMINI_API_KEY", SecretStr("test-key"))
        self.config.start()
        self.addCleanup(self.config.stop)

    def response(self, result=RESULT, finish="STOP"):
        return io.BytesIO(json.dumps({"candidates": [{"finishReason": finish, "content": {"parts": [{"text": json.dumps(result)}]}}]}).encode())

    def test_valid_response_and_request(self):
        with patch.object(gemini, "urlopen", return_value=self.response()) as send:
            result = gemini.analyze(RESUME, JOB)
        self.assertEqual(result.score, 75)
        request = send.call_args.args[0]
        self.assertNotIn("test-key", request.full_url)
        payload = json.loads(request.data)
        self.assertEqual(json.loads(payload["contents"][0]["parts"][0]["text"]), {
            "resume": RESUME,
            "selected_skills_context": "",
            "job_description": JOB,
        })
        self.assertEqual(payload["generationConfig"]["thinkingConfig"], {"thinkingLevel": "low"})
        self.assertNotIn("tools", payload)
        self.assertEqual(send.call_args.kwargs["timeout"], gemini.settings.GEMINI_TIMEOUT_SECONDS)

    def test_missing_key_never_sends(self):
        with patch.object(gemini.settings, "GEMINI_API_KEY", SecretStr("")), patch.object(gemini, "urlopen") as send:
            with self.assertRaises(HTTPException) as error:
                gemini.analyze(RESUME, JOB)
            self.assertEqual(error.exception.status_code, 503)
            send.assert_not_called()

    def test_quota_and_timeout(self):
        for failure, code in [(HTTPError("https://example.test", 429, "quota", {}, None), 429), (TimeoutError(), 504)]:
            with patch.object(gemini, "urlopen", side_effect=failure):
                with self.assertRaises(HTTPException) as error:
                    gemini.analyze(RESUME, JOB)
                self.assertEqual(error.exception.status_code, code)

    def test_transient_provider_error_retries_then_succeeds(self):
        failures = [HTTPError("https://example.test", 503, "overloaded", {}, None) for _ in range(2)]
        with patch.object(gemini, "urlopen", side_effect=[*failures, self.response()]) as send, patch.object(gemini, "sleep") as wait:
            result = gemini.analyze(RESUME, JOB)
        self.assertEqual(result.score, 75)
        self.assertEqual(send.call_count, 3)
        self.assertEqual([item.args[0] for item in wait.call_args_list], [1, 2])

    def test_overload_after_retries_has_specific_message(self):
        failures = [HTTPError("https://example.test", 503, "overloaded", {}, None) for _ in range(3)]
        with patch.object(gemini, "urlopen", side_effect=failures) as send, patch.object(gemini, "sleep") as wait:
            with self.assertRaises(HTTPException) as error:
                gemini.analyze(RESUME, JOB)
        self.assertEqual(error.exception.status_code, 503)
        self.assertIn("overloaded", error.exception.detail.lower())
        self.assertEqual(send.call_count, 3)
        self.assertEqual(wait.call_count, 2)

    def test_bad_or_unsupported_response(self):
        unsupported = {**RESULT, "matches": [{"requirement": "Python", "evidence": "Invented qualification"}]}
        for response in [self.response({**RESULT, "score": 500}), self.response(finish="MAX_TOKENS"), io.BytesIO(b"not json")]:
            with patch.object(gemini, "urlopen", return_value=response):
                with self.assertRaises(HTTPException) as error:
                    gemini.analyze(RESUME, JOB)
                self.assertEqual(error.exception.status_code, 502)

        with patch.object(gemini, "urlopen", return_value=self.response(unsupported)):
            result = gemini.analyze(RESUME, JOB)
        self.assertEqual(result.matches, [])

    def test_evidence_normalizes_unicode_punctuation(self):
        resume = "Built developer-facing APIs — with Python."
        result_data = {**RESULT, "matches": [{"requirement": "APIs", "evidence": "APIs - with Python"}]}
        with patch.object(gemini, "urlopen", return_value=self.response(result_data)):
            result = gemini.analyze(resume, JOB)
        self.assertEqual(len(result.matches), 1)


class AnalysisRouteTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        with self.engine.connect() as connection:
            connection.execute(text("PRAGMA foreign_keys=ON"))
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.owner = User(email="owner@example.test", first_name="Sample", last_name="Owner", password_hash="unused")
        self.other = User(email="other@example.test", first_name="Other", last_name="User", password_hash="unused")
        self.db.add_all([self.owner, self.other])
        self.db.flush()
        self.job = Job(user_id=self.owner.id, company="Company", position="Developer", description=JOB)
        self.resume = Resume(user_id=self.owner.id, name="Sample", file_name="sample.pdf", file_path="",
                             parsed_text=RESUME, skills_json=json.dumps(["Python"]))
        self.skill = Skill(user_id=self.owner.id, name="Python", category="Programming",
                           proficiency="Advanced", years_experience=3,
                           notes="Built data processing tools not listed in the resume.")
        self.db.add_all([self.job, self.resume, self.skill])
        self.db.commit()
        self.skills_context = analysis.selected_skills_context(self.resume, self.owner.id, self.db)
        self.request = AnalysisRequest(resume_id=self.resume.id, consent=True, resume_text=RESUME,
                                       skills_context=self.skills_context, job_description=JOB)
        analysis._last_requests.clear()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()
        analysis._last_requests.clear()

    def test_preview_is_local_and_redacts_contacts(self):
        self.resume.parsed_text = RESUME + " Sample Owner owner@example.test +1 (555) 123-4567 https://example.test"
        with patch.object(analysis, "analyze") as send:
            result = analysis.preview(self.job.id, PreviewRequest(resume_id=self.resume.id), Response(), self.owner, self.db)
            send.assert_not_called()
        self.assertNotIn("owner@example.test", result["resume_text"])
        self.assertNotIn("Sample Owner", result["resume_text"])
        self.assertIn("Python", result["skills_context"])
        self.assertIn("Built data processing tools", result["skills_context"])

    def test_no_consent_or_foreign_records_never_send(self):
        with patch.object(analysis, "analyze") as send:
            for user, consent in [(self.owner, False), (self.other, True)]:
                with self.assertRaises(HTTPException):
                    analysis.analyze_resume(self.job.id, self.request.model_copy(update={"consent": consent}), Response(), user, self.db)
            self.resume.user_id = self.other.id
            self.db.commit()
            with self.assertRaises(HTTPException):
                analysis.analyze_resume(self.job.id, self.request, Response(), self.owner, self.db)
            send.assert_not_called()

    def test_missing_text_and_job_description_never_send(self):
        with patch.object(analysis, "analyze") as send:
            self.resume.parsed_text = ""
            with self.assertRaises(HTTPException):
                analysis.analyze_resume(self.job.id, self.request, Response(), self.owner, self.db)
            self.resume.parsed_text = RESUME
            self.job.description = "No description provided."
            with self.assertRaises(HTTPException):
                analysis.analyze_resume(self.job.id, self.request, Response(), self.owner, self.db)
            send.assert_not_called()

    def test_only_reviewed_text_sent_and_throttled(self):
        request = self.request.model_copy(update={"resume_text": RESUME + " Reviewed."})
        with patch.object(analysis, "analyze", return_value=RESULT) as send:
            response = Response()
            analysis.analyze_resume(self.job.id, request, response, self.owner, self.db)
            send.assert_called_once_with(request.resume_text, JOB, request.skills_context)
            self.assertEqual(response.headers["Cache-Control"], "no-store")
            with self.assertRaises(HTTPException) as error:
                analysis.analyze_resume(self.job.id, request, Response(), self.owner, self.db)
            self.assertEqual(error.exception.status_code, 429)

    def test_consent_is_strict(self):
        with self.assertRaises(ValidationError):
            AnalysisRequest(resume_id=self.resume.id, consent="yes", resume_text=RESUME, job_description=JOB)

    def saved(self):
        with patch.object(analysis, "analyze", return_value=RESULT):
            return analysis.analyze_resume(self.job.id, self.request, Response(), self.owner, self.db)

    def test_history_persists_as_private_snapshot(self):
        saved = self.saved()
        self.job.position = "Renamed job"
        self.resume.name = "Renamed resume"
        self.db.commit()
        self.db.expire_all()
        history = analysis.list_analyses(self.job.id, Response(), self.owner, self.db)
        self.assertEqual(history[0].id, saved.id)
        self.assertEqual(history[0].job_title, "Developer")
        self.assertEqual(history[0].resume_name, "Sample")
        self.assertEqual(history[0].score, 75)
        with self.assertRaises(HTTPException) as error:
            analysis.list_analyses(self.job.id, Response(), self.other, self.db)
        self.assertEqual(error.exception.status_code, 404)
        with self.assertRaises(HTTPException):
            analysis.delete_analysis(self.job.id, saved.id, self.other, self.db)
        analysis.delete_analysis(self.job.id, saved.id, self.owner, self.db)
        self.assertEqual(analysis.list_analyses(self.job.id, Response(), self.owner, self.db), [])

    def test_history_survives_resume_deletion_but_not_job_deletion(self):
        saved = self.saved()
        self.db.delete(self.resume)
        self.db.commit()
        self.db.expire_all()
        history = analysis.list_analyses(self.job.id, Response(), self.owner, self.db)
        self.assertIsNone(history[0].resume_id)
        self.assertEqual(history[0].resume_name, "Sample")
        self.db.delete(self.job)
        self.db.commit()
        self.assertIsNone(self.db.get(ResumeAnalysis, saved.id))

    def test_provider_failure_saves_no_history(self):
        with patch.object(analysis, "analyze", side_effect=HTTPException(502, "Unavailable")):
            with self.assertRaises(HTTPException):
                analysis.analyze_resume(self.job.id, self.request, Response(), self.owner, self.db)
        self.assertEqual(self.db.query(ResumeAnalysis).count(), 0)

    def test_short_reviewed_description_is_blocked(self):
        request = self.request.model_copy(update={"job_description": "Short description"})
        with patch.object(analysis, "analyze") as send:
            with self.assertRaises(HTTPException):
                analysis.analyze_resume(self.job.id, request, Response(), self.owner, self.db)
            send.assert_not_called()

    def test_latest_analysis_is_included_with_job(self):
        saved = self.saved()
        result = jobs.get_jobs(None, None, None, self.owner, self.db)[0]
        self.assertEqual(result.latest_analysis_score, 75)
        self.assertEqual(result.latest_analysis_resume_id, str(self.resume.id))
        self.assertEqual(result.latest_analysis_created_at, saved.created_at)
        self.assertFalse(result.latest_analysis_is_stale)
        self.assertEqual(result.latest_analysis_stale_reasons, [])

    def test_job_description_change_marks_analysis_stale(self):
        self.saved()
        self.job.description = JOB + " The responsibilities have changed."
        self.db.commit()
        result = jobs.get_jobs(None, None, None, self.owner, self.db)[0]
        self.assertTrue(result.latest_analysis_is_stale)
        self.assertIn("job description changed", result.latest_analysis_stale_reasons[0].lower())

    def test_resume_change_and_deletion_mark_analysis_stale(self):
        self.saved()
        self.resume.parsed_text = RESUME + " Added current project details."
        self.db.commit()
        result = jobs.get_jobs(None, None, None, self.owner, self.db)[0]
        self.assertTrue(result.latest_analysis_is_stale)
        self.assertTrue(any("resume" in reason.lower() for reason in result.latest_analysis_stale_reasons))

        self.db.delete(self.resume)
        self.db.commit()
        result = jobs.get_jobs(None, None, None, self.owner, self.db)[0]
        self.assertTrue(any("resume was deleted" in reason.lower() for reason in result.latest_analysis_stale_reasons))

    def test_selected_skill_change_marks_analysis_stale(self):
        self.saved()
        self.skill.notes = "Added recent accessibility project details."
        self.db.commit()

        result = jobs.get_jobs(None, None, None, self.owner, self.db)[0]

        self.assertTrue(result.latest_analysis_is_stale)
        self.assertTrue(any("selected skills changed" in reason.lower() for reason in result.latest_analysis_stale_reasons))

    def test_reanalysis_restores_fresh_status(self):
        previous = self.saved()
        self.db.get(ResumeAnalysis, previous.id).created_at = datetime(2000, 1, 1)
        self.resume.parsed_text = RESUME + " Added current project details."
        self.db.commit()
        self.assertTrue(jobs.get_jobs(None, None, None, self.owner, self.db)[0].latest_analysis_is_stale)

        analysis._last_requests.clear()
        self.saved()
        result = jobs.get_jobs(None, None, None, self.owner, self.db)[0]
        self.assertFalse(result.latest_analysis_is_stale)

    def test_application_resume_must_belong_to_user(self):
        foreign_resume = Resume(
            user_id=self.other.id,
            name="Private resume",
            file_name="private.pdf",
            file_path="",
        )
        self.db.add(foreign_resume)
        self.db.commit()
        with self.assertRaises(HTTPException) as error:
            applications.create_application(
                ApplicationCreate(job_id=str(self.job.id), resume_id=str(foreign_resume.id)),
                self.owner,
                self.db,
            )
        self.assertEqual(error.exception.status_code, 404)

        created = applications.create_application(
            ApplicationCreate(job_id=str(self.job.id), resume_id=str(self.resume.id)),
            self.owner,
            self.db,
        )
        self.assertEqual(created.resume_id, str(self.resume.id))
