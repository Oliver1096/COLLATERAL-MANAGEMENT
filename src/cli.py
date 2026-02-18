from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from .pipeline import parse_optional_date, run_pipeline
from .scraper import TwikitAuthConfig

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
    parser.add_argument(
        "--backend",
        choices=["auto", "snscrape", "twikit"],
        default="auto",
        help="Backend de scraping. auto intenta snscrape y luego twikit si hay auth.",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Detener ejecución al primer error de scraping.",
    )
    parser.add_argument(
        "--twikit-cookies-file",
        type=str,
        default=os.getenv("X_COOKIES_FILE"),
        help="Ruta a cookies de X para twikit (o env X_COOKIES_FILE).",
    )
    parser.add_argument(
        "--x-auth-info-1",
        type=str,
        default=os.getenv("X_AUTH_INFO_1"),
        help="Usuario/email/teléfono para login twikit (o env X_AUTH_INFO_1).",
    )
    parser.add_argument(
        "--x-auth-info-2",
        type=str,
        default=os.getenv("X_AUTH_INFO_2"),
        help="Segundo identificador twikit opcional (o env X_AUTH_INFO_2).",
    )
    parser.add_argument(
        "--x-password",
        type=str,
        default=os.getenv("X_PASSWORD"),
        help="Password para twikit (o env X_PASSWORD).",
    )
    parser.add_argument(
        "--x-totp-secret",
        type=str,
        default=os.getenv("X_TOTP_SECRET"),
        help="Secreto TOTP si tu cuenta tiene 2FA (o env X_TOTP_SECRET).",
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

    twikit_auth_config = TwikitAuthConfig(
        auth_info_1=args.x_auth_info_1,
        auth_info_2=args.x_auth_info_2,
        password=args.x_password,
        totp_secret=args.x_totp_secret,
        cookies_file=args.twikit_cookies_file,
    )

    result = run_pipeline(
        accounts=args.accounts,
        limit_per_account=args.limit_per_account,
        output_dir=output_dir,
        since=since,
        until=until,
        issuers_file=issuers_file,
        backend=args.backend,
        continue_on_error=not args.fail_fast,
        twikit_auth_config=twikit_auth_config,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
