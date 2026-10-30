import io
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject
from app.core.resume_text import extract_text


class ResumeTextTest(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name)

    def tearDown(self):
        self.folder.cleanup()

    def pdf(self, text=True, encrypted=False):
        writer = PdfWriter()
        page = writer.add_blank_page(width=612, height=792)
        if text:
            font = DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"), NameObject("/BaseFont"): NameObject("/Helvetica")})
            page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})})
            stream = DecodedStreamObject()
            stream.set_data(b"BT /F1 12 Tf 50 700 Td (Python developer) Tj ET")
            page[NameObject("/Contents")] = stream
        if encrypted:
            writer.encrypt("secret")
        path = self.root / "resume.pdf"
        writer.write(path)
        return path

    def test_pdf_text(self):
        self.assertIn("Python developer", extract_text(self.pdf()))

    def test_blank_encrypted_and_corrupt_pdf(self):
        self.assertEqual(extract_text(self.pdf(text=False)), "")
        self.assertEqual(extract_text(self.pdf(encrypted=True)), "")
        path = self.root / "corrupt.pdf"
        path.write_bytes(b"%PDF-corrupt")
        self.assertEqual(extract_text(path), "")

    def test_docx_paragraphs_and_tables(self):
        path = self.root / "resume.docx"
        with ZipFile(path, "w") as archive:
            archive.writestr("word/document.xml", '''<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Developer</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Python</w:t><w:tab/><w:t>SQL</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>''')
        self.assertEqual(extract_text(path), "Developer\nPython SQL")

    def test_docx_unsafe_xml(self):
        path = self.root / "resume.docx"
        with ZipFile(path, "w") as archive:
            archive.writestr("word/document.xml", '<!DOCTYPE x [<!ENTITY test "secret">]><x>&test;</x>')
        self.assertEqual(extract_text(path), "")
