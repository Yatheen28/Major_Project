"""
OCR Engine - Photo/PDF complaint ingestion.

Extracts text from uploaded images (JPEG, PNG) and PDFs:
  - Images: Tesseract OCR via pytesseract
  - PDFs: PyMuPDF text extraction first (fast, for text-based PDFs),
          falls back to rendering pages as images + Tesseract for scanned PDFs.

The extracted text is fed into the existing ingest pipeline unchanged.
"""

import io
import os
import logging

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)

# Auto-detect Tesseract on Windows if not on PATH
_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

for _path in _TESSERACT_PATHS:
    if os.path.isfile(_path):
        pytesseract.pytesseract.tesseract_cmd = _path
        break


def extract_text_from_image(image_bytes: bytes) -> str:
    """Run Tesseract OCR on an in-memory image."""
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    text = pytesseract.image_to_string(image, lang="eng")
    return text.strip()


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from a PDF.

    1. Try PyMuPDF native text extraction (fast, text-based PDFs).
    2. If result is too short, fall back to OCR on rendered pages.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = len(doc)
    if page_count == 0:
        doc.close()
        return ""

    # Step 1: Native text extraction
    native_texts = [page.get_text("text") for page in doc]
    native_combined = "\n".join(native_texts).strip()

    avg_chars = len(native_combined) / max(page_count, 1)
    if avg_chars >= 30:
        doc.close()
        logger.info("PDF native text: %d chars from %d pages", len(native_combined), page_count)
        return native_combined

    # Step 2: OCR fallback for scanned PDFs
    logger.info("PDF native text too short (%.0f chars/page), falling back to OCR", avg_chars)
    ocr_texts = []
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        img_bytes = pix.tobytes("png")
        page_text = extract_text_from_image(img_bytes)
        if page_text:
            ocr_texts.append(page_text)

    doc.close()
    return "\n".join(ocr_texts).strip()


def extract_text_from_file(file_bytes: bytes, content_type: str, filename: str) -> str:
    """Dispatch to the appropriate extractor based on file type."""
    lower_name = filename.lower()

    if content_type == "application/pdf" or lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)

    image_types = {"image/jpeg", "image/png", "image/jpg", "image/tiff", "image/bmp"}
    image_exts = {".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp"}

    if content_type in image_types or any(lower_name.endswith(ext) for ext in image_exts):
        return extract_text_from_image(file_bytes)

    raise ValueError(
        f"Unsupported file type: {content_type} ({filename}). "
        f"Supported: PDF, JPEG, PNG, TIFF, BMP"
    )
