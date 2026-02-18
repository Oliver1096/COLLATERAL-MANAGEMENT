from __future__ import annotations

import json
from dataclasses import asdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from dateutil.parser import isoparse

from .models import TweetRecord
from .scraper import ScrapeBackend, TwikitAuthConfig, scrape_accounts
from .sentiment import (
    build_account_summary,
    build_issuer_summary,
    load_issuer_catalog,
    records_to_dataframe,
)


def parse_optional_date(value: str | None) -> date | None:
    if not value:
        return None
    return isoparse(value).date()


def _serialize_record(record: TweetRecord) -> dict[str, Any]:
    payload = asdict(record)
    payload["created_at"] = record.created_at.isoformat()
    return payload


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def save_outputs(
    output_dir: str | Path,
    records: list[TweetRecord],
    tweets_df: pd.DataFrame,
    account_summary_df: pd.DataFrame,
    issuer_summary_df: pd.DataFrame,
    scrape_errors: dict[str, str] | None = None,
) -> dict[str, str]:
    target = Path(output_dir)
    target.mkdir(parents=True, exist_ok=True)

    raw_json = target / "tweets_raw.json"
    sentiment_csv = target / "tweets_sentiment.csv"
    account_csv = target / "account_summary.csv"
    issuer_csv = target / "issuer_summary.csv"
    metadata_json = target / "run_metadata.json"
    errors_json = target / "scrape_errors.json"

    raw_json.write_text(
        json.dumps([_serialize_record(record) for record in records], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    tweets_df.to_csv(sentiment_csv, index=False)
    account_summary_df.to_csv(account_csv, index=False)
    issuer_summary_df.to_csv(issuer_csv, index=False)
    _write_json(errors_json, scrape_errors or {})

    _write_json(
        metadata_json,
        {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "tweets_count": int(tweets_df.shape[0]),
            "accounts_count": int(account_summary_df.shape[0]),
            "issuers_count": int(issuer_summary_df.shape[0]),
            "failed_accounts_count": int(len(scrape_errors or {})),
        },
    )

    return {
        "raw_json": str(raw_json),
        "sentiment_csv": str(sentiment_csv),
        "account_csv": str(account_csv),
        "issuer_csv": str(issuer_csv),
        "errors_json": str(errors_json),
        "metadata_json": str(metadata_json),
    }


def run_pipeline(
    accounts: list[str],
    limit_per_account: int,
    output_dir: str | Path,
    since: date | None = None,
    until: date | None = None,
    issuers_file: str | Path | None = None,
    backend: ScrapeBackend = "auto",
    continue_on_error: bool = True,
    twikit_auth_config: TwikitAuthConfig | None = None,
) -> dict[str, Any]:
    records, scrape_errors = scrape_accounts(
        accounts=accounts,
        limit_per_account=limit_per_account,
        since=since,
        until=until,
        backend=backend,
        twikit_auth_config=twikit_auth_config,
        continue_on_error=continue_on_error,
    )

    catalog = load_issuer_catalog(issuers_file)
    tweets_df = records_to_dataframe(records, issuer_catalog=catalog)
    account_summary_df = build_account_summary(tweets_df)
    issuer_summary_df = build_issuer_summary(tweets_df)
    paths = save_outputs(
        output_dir=output_dir,
        records=records,
        tweets_df=tweets_df,
        account_summary_df=account_summary_df,
        issuer_summary_df=issuer_summary_df,
        scrape_errors=scrape_errors,
    )

    return {
        "tweets_count": len(records),
        "accounts": accounts,
        "backend": backend,
        "scrape_errors": scrape_errors,
        "output_paths": paths,
    }
