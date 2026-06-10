# NVIDIA earnings-call transcripts

This folder contains NVIDIA earnings-call transcripts from calls held in calendar
2020 through the most recent available call, FY2027 Q1 on 2026-05-20.

## What is included

- `transcripts/` - downloaded transcript files.
  - FY2020 Q4 through FY2025 Q4 are saved as `.txt` files extracted from public
    transcript archive pages.
  - FY2026 Q1 through FY2027 Q1 are saved as official NVIDIA Investor Relations
    PDF transcripts from NVIDIA's Q4 CDN.
- `manifest.csv` - source URL, local file path, fiscal year, quarter, and call
  date for every transcript.
- `raw_html/` - raw source pages used to extract the `.txt` transcripts.
- `download_transcripts.py` - reproducible downloader.
- `export_pdfs.py` - creates a PDF-only export folder.
- `pdf_export/NVIDIA_Earning_Calls_PDF/` - one PDF per earnings call, ready to
  copy to:
  `C:\Users\jorgeperez\OneDrive - NSC Asesores\Documentos\NVIDIA_Earning_Calls_PDF`

## Source note

NVIDIA's official Investor Relations site currently exposes downloadable
transcript PDFs for FY2026 onward. For FY2025 Q4 and earlier, I could not find
official NVIDIA-hosted transcript PDF downloads; those older transcript files
come from public archive/syndication pages listed in `manifest.csv`.

To re-run the download:

```bash
python3 nvidia_earnings_transcripts/download_transcripts.py
```

To rebuild the PDF-only export:

```bash
python3 nvidia_earnings_transcripts/export_pdfs.py
```
