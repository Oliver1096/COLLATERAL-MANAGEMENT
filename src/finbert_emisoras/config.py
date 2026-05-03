from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml
from dateutil import parser


@dataclass(frozen=True)
class EventConfig:
    ticker: str
    company_name: str
    earnings_datetime: datetime
    earnings_pdf: Path
    search_terms: list[str]
    pre_report_hours: int
    post_report_hours: int

    @property
    def tweet_window(self) -> tuple[datetime, datetime]:
        return (
            self.earnings_datetime - timedelta(hours=self.pre_report_hours),
            self.earnings_datetime + timedelta(hours=self.post_report_hours),
        )

    @property
    def twitter_queries(self) -> list[str]:
        terms = list(dict.fromkeys([f"${self.ticker}", self.ticker, self.company_name, *self.search_terms]))
        return [term for term in terms if term]

    def as_dict(self) -> dict[str, Any]:
        return {
            "ticker": self.ticker,
            "company_name": self.company_name,
            "earnings_datetime": self.earnings_datetime.isoformat(),
            "earnings_pdf": str(self.earnings_pdf),
            "search_terms": self.search_terms,
            "tweet_window_start": self.tweet_window[0].isoformat(),
            "tweet_window_end": self.tweet_window[1].isoformat(),
        }


@dataclass(frozen=True)
class TweetSearchConfig:
    actor_id: str
    max_items: int
    hours_before: int
    hours_after: int
    top_n: int
    only_verified: bool
    min_followers: int
    min_interactions: int
    priority_accounts: list[str]
    preferred_author_keywords: list[str]
    extra_terms: list[str]
    extra_input: dict[str, Any]


@dataclass(frozen=True)
class FinbertSettings:
    model_name: str
    batch_size: int
    max_chars_per_chunk: int
    device: int | None


@dataclass(frozen=True)
class Settings:
    apify_token: str | None
    tweets: TweetSearchConfig
    finbert: FinbertSettings
    output_dir: Path
    call_weight: float
    tweets_weight: float
    benchmark_ticker: str | None
    return_days_after: int
    events: list[EventConfig]


DEFAULT_AUTHOR_KEYWORDS = [
    "economist",
    "economista",
    "analyst",
    "analista",
    "financial analyst",
    "finance",
    "finanzas",
    "portfolio manager",
    "fund manager",
    "investor",
    "inversionista",
    "trader",
    "politician",
    "politico",
    "político",
    "senator",
    "diputado",
    "congress",
    "secretary",
    "minister",
    "ministro",
]


def load_settings(config_path: str | Path) -> Settings:
    path = Path(config_path)
    with path.open("r", encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}

    apify_raw = raw.get("apify", {})
    finbert_raw = raw.get("finbert", {})
    analysis_raw = raw.get("analysis", {})
    tweet_raw = raw.get("tweet_weighting", {})
    market_raw = raw.get("market", {})

    pre_hours = int(analysis_raw.get("pre_report_hours", 24))
    post_hours = int(analysis_raw.get("post_report_hours", 72))
    token_env = apify_raw.get("token_env", "APIFY_TOKEN")

    companies = [
        EventConfig(
            ticker=item["ticker"],
            company_name=item["company_name"],
            earnings_datetime=_parse_datetime(item["earnings_datetime"]),
            earnings_pdf=Path(item["earnings_pdf"]),
            search_terms=list(item.get("search_terms") or []),
            pre_report_hours=int(item.get("pre_report_hours", pre_hours)),
            post_report_hours=int(item.get("post_report_hours", post_hours)),
        )
        for item in raw.get("events", [])
    ]

    return Settings(
        apify_token=apify_raw.get("token") or os.getenv(token_env),
        tweets=TweetSearchConfig(
            actor_id=str(apify_raw.get("actor_id", "apidojo/tweet-scraper-v2")),
            max_items=int(apify_raw.get("max_items_per_event", 250)),
            hours_before=pre_hours,
            hours_after=post_hours,
            top_n=int(analysis_raw.get("top_tweets", 50)),
            only_verified=bool(tweet_raw.get("only_verified", True)),
            min_followers=int(tweet_raw.get("min_followers", 10000)),
            min_interactions=int(tweet_raw.get("min_interactions", 25)),
            priority_accounts=list(tweet_raw.get("priority_accounts") or []),
            preferred_author_keywords=list(
                tweet_raw.get("preferred_author_keywords") or DEFAULT_AUTHOR_KEYWORDS
            ),
            extra_terms=list(tweet_raw.get("extra_terms") or []),
            extra_input=dict(apify_raw.get("extra_input") or {}),
        ),
        finbert=FinbertSettings(
            model_name=str(finbert_raw.get("model_name", "ProsusAI/finbert")),
            batch_size=int(finbert_raw.get("batch_size", 8)),
            max_chars_per_chunk=int(finbert_raw.get("max_chars_per_chunk", 1800)),
            device=finbert_raw.get("device"),
        ),
        output_dir=Path(raw.get("output", {}).get("directory", "outputs")),
        call_weight=float(analysis_raw.get("call_weight", 0.7)),
        tweets_weight=float(analysis_raw.get("tweet_weight", 0.3)),
        benchmark_ticker=market_raw.get("benchmark_ticker"),
        return_days_after=int(market_raw.get("return_days_after", 3)),
        events=companies,
    )


def _parse_datetime(value: Any) -> datetime:
    dt = parser.isoparse(str(value))
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


load_config = load_settings
