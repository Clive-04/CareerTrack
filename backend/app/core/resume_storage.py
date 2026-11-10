"""Private local resume storage; never mounted as a public static directory."""
import io
import re
import uuid
import zipfile
from pathlib import Path

from fastapi import HTTPException, UploadFile

ROOT = Path(__file__).resolve().parents[2] / "uploads" / "resumes"
MAX_BYTES = 10 * 1024 * 1024


def stored_path(key: str) -> Path | None:
    # Only server-generated keys can resolve to stored files, including legacy records.
    if not re.fullmatch(r"[0-9a-f]{32}\.(pdf|docx)", key):
        return None
    return ROOT / key


def save_upload(upload: UploadFile) -> tuple[str, str]:
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
    ROOT.mkdir(parents=True, exist_ok=True)
    key = uuid.uuid4().hex + suffix
    path = ROOT / key
    try:
        path.write_bytes(data)
    except OSError:
        path.unlink(missing_ok=True)
        raise
    return key, name


def remove_file(key: str) -> None:
    path = stored_path(key)
    if path is not None:
        path.unlink(missing_ok=True)
