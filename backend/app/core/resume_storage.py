"""Private resume storage backed by local disk or an S3-compatible service."""
import io
import re
import uuid
import zipfile
from functools import lru_cache
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile

from app.core.config import settings

ROOT = Path(__file__).resolve().parents[2] / "uploads" / "resumes"
MAX_BYTES = 10 * 1024 * 1024
KEY_PATTERN = re.compile(r"[0-9a-f]{32}\.(pdf|docx)")


def valid_key(key: str) -> bool:
    return bool(KEY_PATTERN.fullmatch(key))


def stored_path(key: str) -> Path | None:
    """Resolve a local key. Remote keys never become filesystem paths."""
    if settings.RESUME_STORAGE_BACKEND != "local" or not valid_key(key):
        return None
    return ROOT / key


@lru_cache(maxsize=1)
def s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID.get_secret_value(),
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY.get_secret_value(),
        config=Config(signature_version="s3v4"),
    )


def _storage_unavailable() -> HTTPException:
    return HTTPException(503, "Resume storage is temporarily unavailable. Please try again.")


def save_upload(upload: UploadFile) -> tuple[str, str, bytes]:
    name = (upload.filename or "").replace("\\", "/").split("/")[-1]
    suffix = Path(name).suffix.lower()
    if suffix not in {".pdf", ".docx"} or len(name) > 255:
        raise HTTPException(422, "Choose a PDF or DOCX file with a filename under 256 characters.")
    data = upload.file.read(MAX_BYTES + 1)
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(422, "The file must be non-empty and 10 MB or smaller.")
    valid = data.startswith(b"%PDF-") if suffix == ".pdf" else False
    if suffix == ".docx":
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                valid = {"[Content_Types].xml", "word/document.xml"}.issubset(archive.namelist())
        except (zipfile.BadZipFile, ValueError):
            valid = False
    if not valid:
        raise HTTPException(422, "The file content does not match a PDF or DOCX document.")
    key = uuid.uuid4().hex + suffix
    if settings.RESUME_STORAGE_BACKEND == "local":
        ROOT.mkdir(parents=True, exist_ok=True)
        path = ROOT / key
        try:
            path.write_bytes(data)
        except OSError:
            path.unlink(missing_ok=True)
            raise
    else:
        try:
            s3_client().put_object(
                Bucket=settings.S3_BUCKET,
                Key=key,
                Body=data,
                ContentType=(
                    "application/pdf"
                    if suffix == ".pdf"
                    else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ),
            )
        except (BotoCoreError, ClientError) as exc:
            raise _storage_unavailable() from exc
    return key, name, data


def read_file(key: str) -> bytes | None:
    if not valid_key(key):
        return None
    if settings.RESUME_STORAGE_BACKEND == "local":
        path = stored_path(key)
        if path is None or not path.is_file():
            return None
        try:
            return path.read_bytes()
        except OSError as exc:
            raise _storage_unavailable() from exc
    try:
        response = s3_client().get_object(Bucket=settings.S3_BUCKET, Key=key)
        return response["Body"].read(MAX_BYTES + 1)
    except ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code in {"404", "NoSuchKey", "NotFound"}:
            return None
        raise _storage_unavailable() from exc
    except BotoCoreError as exc:
        raise _storage_unavailable() from exc


def has_file(key: str) -> bool:
    if not valid_key(key):
        return False
    if settings.RESUME_STORAGE_BACKEND == "local":
        path = stored_path(key)
        return bool(path and path.is_file())
    try:
        s3_client().head_object(Bucket=settings.S3_BUCKET, Key=key)
        return True
    except ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code in {"404", "NoSuchKey", "NotFound"}:
            return False
        raise _storage_unavailable() from exc
    except BotoCoreError as exc:
        raise _storage_unavailable() from exc


def remove_file(key: str) -> None:
    if not valid_key(key):
        return
    if settings.RESUME_STORAGE_BACKEND == "local":
        path = stored_path(key)
        if path is not None:
            path.unlink(missing_ok=True)
        return
    try:
        s3_client().delete_object(Bucket=settings.S3_BUCKET, Key=key)
    except (BotoCoreError, ClientError) as exc:
        raise _storage_unavailable() from exc
