from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from .pipeline import parse_optional_date, run_pipeline

DEFAULT_ACCOUNTS = ["@elonmusk", "@CathieDWood", "@saylor"]
DEFAULT_ISSUERS_FILE = "config/issuers.csv"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="x-sentiment",
        description="Scraping de X + análisis de sentimiento para cuentas de mercado.",
    )
    parser.add_argument(
        "--accounts",
        nargs="+",
        default=DEFAULT_ACCOUNTS,
        help="Handles a scrapeaear. Ej: --accounts @elonmusk @CathieDWood @saylor",
    )
    parser.add_argument(
        "--limit-per-account",
        type=int,
        default=100,
        help="Cantidad máxima de tweets por cuenta.",
    )
    parser.add_argument(
        "--since",
        type=str,
        default=None,
        help="Fecha inicial (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--until",
        type=str,
        default=None,
        help="Fecha final (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Directorio de salida. Si se omite, se crea data/runs/<timestamp_utc>.",
    )
    parser.add_argument(
        "--issuers-file",
        type=str,
        default=DEFAULT_ISSUERS_FILE,
        help="CSV de emisoras (ticker, aliases).",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output_dir = args.output_dir or f"data/runs/{run_id}"

    since = parse_optional_date(args.since)
    until = parse_optional_date(args.until)

    issuers_file = Path(args.issuers_file)
    if not issuers_file.exists():
        issuers_file = None

    result = run_pipeline(
        accounts=args.accounts,
        limit_per_account=args.limit_per_account,
        output_dir=output_dir,
        since=since,
        until=until,
        issuers_file=issuers_file,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
