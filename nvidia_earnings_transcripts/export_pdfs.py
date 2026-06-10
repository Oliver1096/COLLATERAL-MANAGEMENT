#!/usr/bin/env python3
"""Create a PDF-only export of the NVIDIA earnings-call transcript archive."""

from __future__ import annotations

import csv
import shutil
import textwrap
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TRANSCRIPT_DIR = ROOT / "transcripts"
EXPORT_DIR = ROOT / "pdf_export" / "NVIDIA_Earning_Calls_PDF"

PAGE_WIDTH = 612
PAGE_HEIGHT = 792
MARGIN_LEFT = 46
MARGIN_TOP = 746
FONT_SIZE = 9
LINE_HEIGHT = 12
CHARS_PER_LINE = 94
LINES_PER_PAGE = 58


def pdf_escape(text: str) -> str:
    encoded = text.encode("cp1252", "replace").decode("cp1252")
    return encoded.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def txt_to_pages(text: str) -> list[list[str]]:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line:
            lines.append("")
            continue
        wrapped = textwrap.wrap(
            line,
            width=CHARS_PER_LINE,
            replace_whitespace=False,
            drop_whitespace=False,
        )
        lines.extend(wrapped or [""])

    return [lines[i : i + LINES_PER_PAGE] for i in range(0, len(lines), LINES_PER_PAGE)] or [[]]


def write_pdf(text: str, path: Path) -> None:
    pages = txt_to_pages(text)
    objects: list[bytes] = []

    def add_object(body: str | bytes) -> int:
        if isinstance(body, str):
            body = body.encode("latin-1", "replace")
        objects.append(body)
        return len(objects)

    catalog_id = add_object("<< /Type /Catalog /Pages 2 0 R >>")
    pages_id = add_object(b"")
    font_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")
    page_ids: list[int] = []

    for page in pages:
        content_lines = [
            "BT",
            f"/F1 {FONT_SIZE} Tf",
            f"{MARGIN_LEFT} {MARGIN_TOP} Td",
            f"{LINE_HEIGHT} TL",
        ]
        for line in page:
            content_lines.append(f"({pdf_escape(line)}) Tj")
            content_lines.append("T*")
        content_lines.append("ET")
        stream = "\n".join(content_lines).encode("latin-1", "replace")
        content_id = add_object(
            b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream"
        )
        page_id = add_object(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        )
        page_ids.append(page_id)

    objects[pages_id - 1] = (
        f"<< /Type /Pages /Kids [{' '.join(f'{page_id} 0 R' for page_id in page_ids)}] "
        f"/Count {len(page_ids)} >>"
    ).encode("latin-1")

    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for obj_id, body in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{obj_id} 0 obj\n".encode("ascii"))
        output.extend(body)
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )
    path.write_bytes(output)


def export() -> None:
    if EXPORT_DIR.exists():
        shutil.rmtree(EXPORT_DIR)
    EXPORT_DIR.mkdir(parents=True)

    rows = list(csv.DictReader((ROOT / "manifest.csv").open(encoding="utf-8")))
    exported_rows = []
    for row in rows:
        source = ROOT / row["local_file"]
        destination = EXPORT_DIR / source.with_suffix(".pdf").name

        if source.suffix.lower() == ".pdf":
            shutil.copy2(source, destination)
        else:
            write_pdf(source.read_text(encoding="utf-8", errors="replace"), destination)

        exported_rows.append({**row, "pdf_file": destination.name})

    with (EXPORT_DIR / "manifest_pdf_export.csv").open("w", encoding="utf-8", newline="") as fh:
        fields = [
            "fiscal_year",
            "quarter",
            "call_date",
            "source_name",
            "source_type",
            "url",
            "local_file",
            "pdf_file",
        ]
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(exported_rows)

    readme = (
        "NVIDIA earnings-call transcripts PDF export\n"
        "===========================================\n\n"
        "Copy this folder to:\n"
        "C:\\Users\\jorgeperez\\OneDrive - NSC Asesores\\Documentos\\NVIDIA_Earning_Calls_PDF\n\n"
        "Contents:\n"
        "- One PDF per earnings call from FY2020 Q4 through FY2027 Q1.\n"
        "- manifest_pdf_export.csv with source URLs and local PDF filenames.\n\n"
        "Source note:\n"
        "Official NVIDIA Investor Relations transcript PDFs are available for FY2026 onward.\n"
        "Earlier calls were converted to PDF from public transcript archive pages listed in the manifest.\n"
    )
    (EXPORT_DIR / "README.txt").write_text(readme, encoding="utf-8")


if __name__ == "__main__":
    export()
    print(f"Exported PDFs to {EXPORT_DIR}")
