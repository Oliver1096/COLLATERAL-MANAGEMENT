from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader

from .config import EventConfig


class EarningsCall:
    def __init__(self, text: str) -> None:
        self.text = text


def extract_pdf_text(pdf_path: str | Path) -> str:
    """Extract plain text from a PDF earnings call transcript."""
    path = Path(pdf_path)
    reader = PdfReader(str(path))
    pages = [(page.extract_text() or "").strip() for page in reader.pages]
    return "\n\n".join(page for page in pages if page)


def load_earnings_call(event: EventConfig) -> EarningsCall:
    return EarningsCall(text=extract_pdf_text(event.earnings_pdf))


def chunk_text(text: str, max_words: int = 220) -> list[str]:
    """Split long transcripts into FinBERT-friendly chunks."""
    words = text.split()
    if not words:
        return []

    chunks: list[str] = []
    for start in range(0, len(words), max_words):
        chunk = " ".join(words[start : start + max_words]).strip()
        if chunk:
            chunks.append(chunk)
    return chunks
