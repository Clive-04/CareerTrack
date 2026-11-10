import io
import json
import tempfile
import unittest
import uuid
import zipfile
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException, UploadFile
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.models
from app.db.base import Base
from app.models.user import User
from app.models.resume import Resume
from app.core import resume_storage as storage
from app.routers.resume import save_document, download_resume, owned_resume, delete_resume, to_response, extract_resume


class ResumeUploadsTest(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name)
        self.patch = patch.object(storage, "ROOT", self.root)
        self.patch.start()
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.user = User(email="owner@example.test", first_name="Test", last_name="Owner", password_hash="unused")
        self.other = User(email="other@example.test", first_name="Other", last_name="User", password_hash="unused")
        self.db.add_all([self.user, self.other])
        self.db.commit()
        self.metadata = json.dumps({"name": "My resume", "skills": ["Python"], "is_default": True})

    def tearDown(self):
        self.db.close()
        self.engine.dispose()
        self.patch.stop()
        self.folder.cleanup()

    def upload(self, data=b"%PDF-1.7\nexample", name="resume.pdf"):
        return UploadFile(filename=name, file=io.BytesIO(data))

    def test_create_download_replace_delete(self):
        result = save_document(self.metadata, self.upload(), self.user, self.db)
        self.assertTrue(result.has_file)
        resume = owned_resume(uuid.UUID(result.id), self.user, self.db)
        old_path = storage.stored_path(resume.file_path)
        response = download_resume(resume.id, self.user, self.db)
        self.assertEqual(Path(response.path).read_bytes(), b"%PDF-1.7\nexample")
        save_document(self.metadata, None, self.user, self.db, resume)
        self.assertEqual(storage.stored_path(resume.file_path), old_path)
        save_document(self.metadata, self.upload(b"%PDF-1.7\nreplacement"), self.user, self.db, resume)
        self.assertFalse(old_path.exists())
        new_path = storage.stored_path(resume.file_path)
        self.assertTrue(new_path.exists())
        delete_resume(resume.id, self.db, self.user)
        self.assertFalse(new_path.exists())

    def test_other_owner_cannot_access(self):
        result = save_document(self.metadata, self.upload(), self.user, self.db)
        with self.assertRaises(HTTPException) as error:
            download_resume(uuid.UUID(result.id), self.other, self.db)
        self.assertEqual(error.exception.status_code, 404)
        with self.assertRaises(HTTPException):
            owned_resume(uuid.UUID(result.id), self.other, self.db)

    def test_invalid_and_oversized_uploads(self):
        for data, name in [(b"", "empty.pdf"), (b"fake", "fake.pdf"), (b"fake", "file.doc"), (b"fake", "fake.docx"), (b"%PDF-" + b"x" * storage.MAX_BYTES, "large.pdf")]:
            with self.assertRaises(HTTPException):
                save_document(self.metadata, self.upload(data, name), self.user, self.db)
        self.assertEqual(self.db.query(Resume).count(), 0)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_docx_and_legacy_paths(self):
        data = io.BytesIO()
        with zipfile.ZipFile(data, "w") as archive:
            archive.writestr("[Content_Types].xml", "<Types/>")
            archive.writestr("word/document.xml", "<document/>")
        result = save_document(self.metadata, self.upload(data.getvalue(), "resume.docx"), self.user, self.db)
        self.assertTrue(result.has_file)
        self.assertIsNone(storage.stored_path("../../secret.pdf"))
        resume = owned_resume(uuid.UUID(result.id), self.user, self.db)
        storage.remove_file(resume.file_path)
        resume.file_path = "legacy.pdf"
        self.assertFalse(to_response(resume).has_file)
        with self.assertRaises(HTTPException):
            download_resume(resume.id, self.user, self.db)

    def test_database_failure_removes_new_file(self):
        with patch.object(self.db, "commit", side_effect=RuntimeError("test failure")):
            with self.assertRaises(RuntimeError):
                save_document(self.metadata, self.upload(), self.user, self.db)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_extraction_persists_and_replacement_clears_old_text(self):
        data = io.BytesIO()
        with zipfile.ZipFile(data, "w") as archive:
            archive.writestr("[Content_Types].xml", "<Types/>")
            archive.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Python developer</w:t></w:r></w:p></w:document>')
        result = save_document(self.metadata, self.upload(data.getvalue(), "resume.docx"), self.user, self.db)
        self.assertEqual(result.extraction_status, "ready")
        self.db.expire_all()
        resume = owned_resume(uuid.UUID(result.id), self.user, self.db)
        self.assertEqual(resume.parsed_text, "Python developer")
        resume.parsed_text = None
        self.db.commit()
        result = extract_resume(resume.id, self.user, self.db)
        self.assertNotIn("parsed_text", result.model_dump())
        self.db.refresh(resume)
        self.assertEqual(resume.parsed_text, "Python developer")
        with self.assertRaises(HTTPException):
            extract_resume(resume.id, self.other, self.db)
        result = save_document(self.metadata, self.upload(), self.user, self.db, resume)
        self.assertNotIn("file_path", result.model_dump())
        self.assertNotIn("parsed_text", result.model_dump())
        self.db.refresh(resume)
        self.assertEqual(resume.parsed_text, "")
        self.assertEqual(result.extraction_status, "unavailable")
        self.assertTrue(result.has_file)


if __name__ == "__main__":
    unittest.main()
