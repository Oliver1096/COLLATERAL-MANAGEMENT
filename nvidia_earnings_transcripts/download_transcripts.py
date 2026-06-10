#!/usr/bin/env python3
"""Download NVIDIA earnings-call transcripts from 2020 onward.

NVIDIA's investor-relations site currently exposes downloadable transcript PDFs
for FY2026 onward. Older calls are included here from public transcript archives.
The manifest written by this script marks the source for each quarter.
"""

from __future__ import annotations

import csv
import html
import re
import sys
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "raw_html"
TRANSCRIPT_DIR = ROOT / "transcripts"

USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"


ENTRIES = [
    {
        "fiscal_year": "FY2020",
        "quarter": "Q4",
        "call_date": "2020-02-13",
        "source_name": "The Motley Fool",
        "source_type": "motley",
        "url": "https://www.fool.com/earnings/call-transcripts/2020/02/14/nvidia-corp-nvda-q4-2020-earnings-call-transcript.aspx",
    },
    {
        "fiscal_year": "FY2021",
        "quarter": "Q1",
        "call_date": "2020-05-21",
        "source_name": "The Motley Fool",
        "source_type": "motley",
        "url": "https://www.fool.com/earnings/call-transcripts/2020/05/22/nvidia-corp-nvda-q1-2021-earnings-call-transcript.aspx",
    },
    {
        "fiscal_year": "FY2021",
        "quarter": "Q2",
        "call_date": "2020-08-19",
        "source_name": "The Motley Fool",
        "source_type": "motley",
        "url": "https://www.fool.com/earnings/call-transcripts/2020/08/20/nvidia-nvda-q2-2021-earnings-call-transcript/",
    },
    {
        "fiscal_year": "FY2021",
        "quarter": "Q3",
        "call_date": "2020-11-18",
        "source_name": "StockInsights",
        "source_type": "stockinsights",
        "url": "https://www.stockinsights.ai/us/NVDA/earnings-transcript/fy20-q3-21d8",
    },
    {
        "fiscal_year": "FY2021",
        "quarter": "Q4",
        "call_date": "2021-02-24",
        "source_name": "The Motley Fool",
        "source_type": "motley",
        "url": "https://www.fool.com/earnings/call-transcripts/2021/02/25/nvidia-corp-nvda-q4-2021-earnings-call-transcript/",
    },
    {
        "fiscal_year": "FY2022",
        "quarter": "Q1",
        "call_date": "2021-05-26",
        "source_name": "The Motley Fool",
        "source_type": "motley",
        "url": "https://www.fool.com/earnings/call-transcripts/2021/05/27/nvidia-corp-nvda-q1-2022-earnings-call-transcript/",
    },
    {
        "fiscal_year": "FY2022",
        "quarter": "Q2",
        "call_date": "2021-08-18",
        "source_name": "The Motley Fool",
        "source_type": "motley",
        "url": "https://www.fool.com/earnings/call-transcripts/2021/08/18/nvidia-corporation-nvda-q2-2022-earnings-call-tran/",
    },
    {
        "fiscal_year": "FY2022",
        "quarter": "Q3",
        "call_date": "2021-11-17",
        "source_name": "TickerTrends",
        "source_type": "tickertrends",
        "url": "https://tickertrends.io/transcripts/NVDA/Q3-earnings-transcript-2022",
    },
    {
        "fiscal_year": "FY2022",
        "quarter": "Q4",
        "call_date": "2022-02-16",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q4-2022-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2023",
        "quarter": "Q1",
        "call_date": "2022-05-25",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q1-2023-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2023",
        "quarter": "Q2",
        "call_date": "2022-08-24",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q2-2023-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2023",
        "quarter": "Q3",
        "call_date": "2022-11-16",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q3-2023-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2023",
        "quarter": "Q4",
        "call_date": "2023-02-22",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q4-2023-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2024",
        "quarter": "Q1",
        "call_date": "2023-05-24",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q1-2024-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2024",
        "quarter": "Q2",
        "call_date": "2023-08-23",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q2-2024-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2024",
        "quarter": "Q3",
        "call_date": "2023-11-21",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q3-2024-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2024",
        "quarter": "Q4",
        "call_date": "2024-02-21",
        "source_name": "The Transcript",
        "source_type": "thetranscript",
        "url": "https://thetranscript.net/transcript/5857/nvidia-q4-2024-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2025",
        "quarter": "Q1",
        "call_date": "2024-05-22",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q1-2025-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2025",
        "quarter": "Q2",
        "call_date": "2024-08-28",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q2-2025-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2025",
        "quarter": "Q3",
        "call_date": "2024-11-20",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q3-2025-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2025",
        "quarter": "Q4",
        "call_date": "2025-02-26",
        "source_name": "Nasdaq/The Motley Fool",
        "source_type": "nasdaq",
        "url": "https://www.nasdaq.com/articles/nvidia-nvda-q4-2025-earnings-call-transcript",
    },
    {
        "fiscal_year": "FY2026",
        "quarter": "Q1",
        "call_date": "2025-05-28",
        "source_name": "NVIDIA Investor Relations",
        "source_type": "official_pdf",
        "url": "https://s201.q4cdn.com/141608511/files/doc_financials/2026/q1/NVDA-Q1-2026-Earnings-Call-28-May-2025-5_00-PM-ET.pdf",
    },
    {
        "fiscal_year": "FY2026",
        "quarter": "Q2",
        "call_date": "2025-08-27",
        "source_name": "NVIDIA Investor Relations",
        "source_type": "official_pdf",
        "url": "https://s201.q4cdn.com/141608511/files/doc_financials/2026/q2/NVDA-Q2-2026-Earnings-Call-27-August-2025-5_00-PM-ET.pdf",
    },
    {
        "fiscal_year": "FY2026",
        "quarter": "Q3",
        "call_date": "2025-11-19",
        "source_name": "NVIDIA Investor Relations",
        "source_type": "official_pdf",
        "url": "https://s201.q4cdn.com/141608511/files/doc_financials/2026/q3/NVDA-Q3-2026-Earnings-Call-19-November-2025-5_00-PM-ET.pdf",
    },
    {
        "fiscal_year": "FY2026",
        "quarter": "Q4",
        "call_date": "2026-02-25",
        "source_name": "NVIDIA Investor Relations",
        "source_type": "official_pdf",
        "url": "https://s201.q4cdn.com/141608511/files/doc_financials/2026/q4/NVDA-Q4-2026-Earnings-Call-25-February-2026-5_00-PM-ET.pdf",
    },
    {
        "fiscal_year": "FY2027",
        "quarter": "Q1",
        "call_date": "2026-05-20",
        "source_name": "NVIDIA Investor Relations",
        "source_type": "official_pdf",
        "url": "https://s201.q4cdn.com/141608511/files/doc_financials/2027/q1/NVDA-Q1-2027-Earnings-Call-20-May-2026-5_00-PM-ET.pdf",
    },
]


class TextExtractor(HTMLParser):
    """Extract readable text from a selected HTML subtree."""

    def __init__(self, source_type: str):
        super().__init__(convert_charrefs=True)
        self.source_type = source_type
        self.capture_depth = 0
        self.found = False
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {key: value or "" for key, value in attrs}
        classes = attrs_dict.get("class", "")
        element_id = attrs_dict.get("id", "")

        if self.capture_depth:
            self.capture_depth += 1
            if tag in {"p", "div", "h1", "h2", "h3", "li", "br"}:
                self.parts.append("\n")
            return

        should_capture = False
        if self.source_type == "motley":
            should_capture = element_id == "article-body-transcript"
        elif self.source_type == "nasdaq":
            should_capture = "body__content" in classes
        elif self.source_type == "thetranscript":
            should_capture = "rich-text" in classes and "b-top" in classes
        elif self.source_type == "tickertrends":
            should_capture = "overflow-auto" in classes

        if should_capture:
            self.capture_depth = 1
            self.found = True

    def handle_endtag(self, tag: str) -> None:
        if self.capture_depth:
            if tag in {"p", "div", "h1", "h2", "h3", "li"}:
                self.parts.append("\n")
            self.capture_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.capture_depth:
            self.parts.append(data)

    def text(self) -> str:
        text = html.unescape(" ".join(self.parts))
        text = re.sub(r"[ \t\r\f\v]+", " ", text)
        text = re.sub(r" *\n+ *", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


def filename_for(entry: dict[str, str], suffix: str) -> str:
    fiscal = entry["fiscal_year"].lower()
    quarter = entry["quarter"].lower()
    date = entry["call_date"]
    return f"nvidia_{fiscal}_{quarter}_{date}{suffix}"


def request_url(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error: Exception | None = None
    for attempt in range(1, 5):
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
            time.sleep(attempt)
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def extract_stockinsights_text(raw_html: str) -> str:
    # StockInsights stores the article body in escaped paragraph fragments inside
    # the Next.js payload. Extract that payload rather than the navigation text.
    fragments = re.findall(r"\\u003cp\\u003e(.*?)\\u003c/p\\u003e", raw_html)
    if not fragments:
        return ""
    lines = []
    for fragment in fragments:
        fragment = fragment.replace("\\u003cbr/\\u003e", "\n")
        fragment = re.sub(r"\\u003c/strong\\u003e\\s*-\\s*\\u003cem\\u003e", " - ", fragment)
        fragment = re.sub(r"\\u003c/?(?:strong|em|span|a|div)[^e]*?\\u003e", "", fragment)
        fragment = fragment.replace("\\u0026", "&").replace("\\u0027", "'")
        fragment = fragment.encode("utf-8").decode("unicode_escape")
        lines.append(html.unescape(fragment).strip())
    text = "\n\n".join(line for line in lines if line)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def download_entry(entry: dict[str, str]) -> dict[str, str]:
    source_type = entry["source_type"]
    data = request_url(entry["url"])

    if source_type == "official_pdf":
        local_path = TRANSCRIPT_DIR / filename_for(entry, ".pdf")
        local_path.write_bytes(data)
        return {**entry, "local_file": str(local_path.relative_to(ROOT))}

    raw_path = RAW_DIR / filename_for(entry, ".html")
    raw_path.write_bytes(data)
    raw_html = data.decode("utf-8", "replace")

    if source_type == "stockinsights":
        text = extract_stockinsights_text(raw_html)
    else:
        extractor = TextExtractor(source_type)
        extractor.feed(raw_html)
        text = extractor.text()

    if not text:
        raise RuntimeError(f"no transcript text extracted for {entry['fiscal_year']} {entry['quarter']}")

    text_path = TRANSCRIPT_DIR / filename_for(entry, ".txt")
    header = (
        f"NVIDIA {entry['fiscal_year']} {entry['quarter']} earnings call transcript\n"
        f"Call date: {entry['call_date']}\n"
        f"Source: {entry['source_name']}\n"
        f"URL: {entry['url']}\n\n"
    )
    text_path.write_text(header + text + "\n", encoding="utf-8")
    return {**entry, "local_file": str(text_path.relative_to(ROOT))}


def write_manifest(rows: list[dict[str, str]]) -> None:
    fields = [
        "fiscal_year",
        "quarter",
        "call_date",
        "source_name",
        "source_type",
        "url",
        "local_file",
    ]
    with (ROOT / "manifest.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def main() -> int:
    RAW_DIR.mkdir(exist_ok=True)
    TRANSCRIPT_DIR.mkdir(exist_ok=True)
    rows = []

    for entry in ENTRIES:
        label = f"{entry['fiscal_year']} {entry['quarter']}"
        print(f"Downloading {label} from {entry['source_name']}...", flush=True)
        rows.append(download_entry(entry))

    write_manifest(rows)
    print(f"Downloaded {len(rows)} transcript files into {TRANSCRIPT_DIR.relative_to(ROOT)}")
    print(f"Wrote manifest to {(ROOT / 'manifest.csv').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
