import io
import unittest
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile

from app.core import resume_storage as storage


class ResumeS3StorageTest(unittest.TestCase):
    def setUp(self):
        storage.s3_client.cache_clear()
        self.settings_patches = [
            patch.object(storage.settings, "RESUME_STORAGE_BACKEND", "s3"),
            patch.object(storage.settings, "S3_BUCKET", "private-resumes"),
        ]
        for setting_patch in self.settings_patches:
            setting_patch.start()
        self.client = Mock()
        self.client_patch = patch.object(storage, "s3_client", return_value=self.client)
        self.client_patch.start()

    def tearDown(self):
        self.client_patch.stop()
        for setting_patch in reversed(self.settings_patches):
            setting_patch.stop()
        storage.s3_client.cache_clear()

    def upload(self):
        return UploadFile(filename="résumé.pdf", file=io.BytesIO(b"%PDF-1.7\ntest"))

    def test_save_read_exists_and_delete(self):
        key, name, data = storage.save_upload(self.upload())
        self.assertTrue(storage.valid_key(key))
        self.assertEqual(name, "résumé.pdf")
        self.assertEqual(data, b"%PDF-1.7\ntest")
        self.client.put_object.assert_called_once()

        self.client.get_object.return_value = {"Body": io.BytesIO(data)}
        self.assertEqual(storage.read_file(key), data)
        self.assertTrue(storage.has_file(key))
        storage.remove_file(key)
        self.client.delete_object.assert_called_once_with(Bucket="private-resumes", Key=key)

    def test_missing_and_storage_failure_are_distinct(self):
        key = "a" * 32 + ".pdf"
        missing = ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")
        self.client.get_object.side_effect = missing
        self.assertIsNone(storage.read_file(key))

        unavailable = ClientError({"Error": {"Code": "AccessDenied"}}, "HeadObject")
        self.client.head_object.side_effect = unavailable
        with self.assertRaises(HTTPException) as error:
            storage.has_file(key)
        self.assertEqual(error.exception.status_code, 503)

    def test_rejects_untrusted_keys_without_contacting_storage(self):
        self.assertIsNone(storage.read_file("../../secret.pdf"))
        self.assertFalse(storage.has_file("not-a-key.pdf"))
        storage.remove_file("../../secret.pdf")
        self.client.assert_not_called()


if __name__ == "__main__":
    unittest.main()
