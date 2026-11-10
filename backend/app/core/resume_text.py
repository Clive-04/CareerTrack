"""Local text extraction. No resume content is sent to an AI service."""
from pathlib import Path
from zipfile import ZipFile

from defusedxml.ElementTree import fromstring
from pypdf import PdfReader

MAX_TEXT = 200_000
MAX_XML = 10 * 1024 * 1024
WORD = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def extract_text(path: Path) -> str:
    """Return readable text, or an empty string when extraction is unavailable.

    Uploads remain downloadable even if malformed, scanned, encrypted, or too
    complex to extract. None in the database means extraction hasn't run yet.
    """
    try:
        if path.suffix.lower() == ".pdf":
            reader = PdfReader(path)
            if reader.is_encrypted or len(reader.pages) > 100:
                return ""
            parts = []
            count = 0
            for page in reader.pages:
                text = page.extract_text() or ""
                count += len(text)
                if count > MAX_TEXT:
                    return ""
                parts.append(text)
            text = "\n".join(parts)
        elif path.suffix.lower() == ".docx":
            with ZipFile(path) as archive:
                info = archive.getinfo("word/document.xml")
                if info.file_size > MAX_XML:
                    return ""
                root = fromstring(archive.read(info))
            # Paragraph traversal also includes paragraphs inside table cells.
            parts = []
            for paragraph in root.iter(WORD + "p"):
                parts.append("".join(
                    node.text or "" if node.tag == WORD + "t" else " "
                    for node in paragraph.iter()
                    if node.tag in {WORD + "t", WORD + "tab", WORD + "br"}
                ))
            text = "\n".join(parts)
        else:
            return ""
        text = "\n".join(line.strip() for line in text.replace("\x00", "").splitlines() if line.strip())
        return text if len(text) <= MAX_TEXT else ""
    except Exception:
        # Document parser errors must not expose document contents or prevent saving.
        return ""
