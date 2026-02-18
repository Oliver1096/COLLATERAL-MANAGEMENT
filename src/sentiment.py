from __future__ import annotations

import csv
import re
from pathlib import Path

import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from .models import TweetRecord

CASHTAG_PATTERN = re.compile(r"\$([A-Za-z]{1,6})\b")


def sentiment_label(compound_score: float) -> str:
    if compound_score >= 0.05:
        return "positive"
    if compound_score <= -0.05:
        return "negative"
    return "neutral"


def extract_cashtags(text: str) -> list[str]:
    tickers = {match.upper() for match in CASHTAG_PATTERN.findall(text or "")}
    return sorted(tickers)


def load_issuer_catalog(path: str | Path | None) -> dict[str, set[str]]:
    """
    Carga catálogo de emisoras desde CSV con columnas:
    - ticker (obligatoria)
    - aliases (opcional, separados por |)
    """
    if not path:
        return {}

    catalog_path = Path(path)
    if not catalog_path.exists():
        raise FileNotFoundError(f"No existe archivo de emisoras: {catalog_path}")

    catalog: dict[str, set[str]] = {}
    with catalog_path.open("r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        if "ticker" not in reader.fieldnames:
            raise ValueError("El CSV de emisoras debe tener columna 'ticker'.")

        for row in reader:
            ticker = (row.get("ticker") or "").strip().upper()
            if not ticker:
                continue
            raw_aliases = row.get("aliases", "")
            aliases = {
                alias.strip().lower()
                for alias in raw_aliases.split("|")
                if alias and alias.strip()
            }
            aliases.add(ticker.lower())
            catalog[ticker] = aliases

    return catalog


def extract_issuers(text: str, catalog: dict[str, set[str]]) -> list[str]:
    """
    Detecta emisoras por cashtag y por alias textuales (si existe catálogo).
    """
    normalized = (text or "").lower()
    detected = set(extract_cashtags(text))

    if not catalog or not normalized:
        return sorted(detected)

    for ticker, aliases in catalog.items():
        if ticker in detected:
            continue
        for alias in aliases:
            if re.search(rf"\b{re.escape(alias)}\b", normalized):
                detected.add(ticker)
                break

    return sorted(detected)


def records_to_dataframe(
    records: list[TweetRecord], issuer_catalog: dict[str, set[str]] | None = None
) -> pd.DataFrame:
    analyzer = SentimentIntensityAnalyzer()
    issuer_catalog = issuer_catalog or {}
    rows: list[dict[str, object]] = []

    for record in records:
        scores = analyzer.polarity_scores(record.content)
        cashtags = extract_cashtags(record.content)
        issuers = extract_issuers(record.content, issuer_catalog)

        rows.append(
            {
                "account": record.account,
                "tweet_id": record.tweet_id,
                "created_at": record.created_at.isoformat(),
                "content": record.content,
                "lang": record.lang,
                "likes": record.likes,
                "replies": record.replies,
                "reposts": record.reposts,
                "quotes": record.quotes,
                "engagement": record.likes + record.replies + record.reposts + record.quotes,
                "url": record.url,
                "cashtags": ",".join(cashtags),
                "issuers_detected": ",".join(issuers),
                "sentiment_neg": scores["neg"],
                "sentiment_neu": scores["neu"],
                "sentiment_pos": scores["pos"],
                "sentiment_compound": scores["compound"],
                "sentiment_label": sentiment_label(scores["compound"]),
            }
        )

    if not rows:
        return pd.DataFrame(
            columns=[
                "account",
                "tweet_id",
                "created_at",
                "content",
                "lang",
                "likes",
                "replies",
                "reposts",
                "quotes",
                "engagement",
                "url",
                "cashtags",
                "issuers_detected",
                "sentiment_neg",
                "sentiment_neu",
                "sentiment_pos",
                "sentiment_compound",
                "sentiment_label",
            ]
        )

    return pd.DataFrame(rows)


def build_account_summary(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(
            columns=[
                "account",
                "tweets",
                "avg_compound",
                "positive_pct",
                "negative_pct",
                "total_engagement",
            ]
        )

    grouped = df.groupby("account", as_index=False).agg(
        tweets=("tweet_id", "count"),
        avg_compound=("sentiment_compound", "mean"),
        positive_pct=("sentiment_label", lambda s: (s == "positive").mean()),
        negative_pct=("sentiment_label", lambda s: (s == "negative").mean()),
        total_engagement=("engagement", "sum"),
    )
    return grouped.sort_values(by="avg_compound", ascending=False)


def build_issuer_summary(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(
            columns=["issuer", "mentions", "avg_compound", "positive_pct", "negative_pct"]
        )

    exploded = (
        df.assign(issuer=df["issuers_detected"].str.split(","))
        .explode("issuer")
        .dropna(subset=["issuer"])
    )
    exploded = exploded[exploded["issuer"].astype(str).str.len() > 0]

    if exploded.empty:
        return pd.DataFrame(
            columns=["issuer", "mentions", "avg_compound", "positive_pct", "negative_pct"]
        )

    grouped = exploded.groupby("issuer", as_index=False).agg(
        mentions=("tweet_id", "count"),
        avg_compound=("sentiment_compound", "mean"),
        positive_pct=("sentiment_label", lambda s: (s == "positive").mean()),
        negative_pct=("sentiment_label", lambda s: (s == "negative").mean()),
    )
    return grouped.sort_values(by="mentions", ascending=False)
