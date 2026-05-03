from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd

from .config import EventConfig
from .market import MarketReturn
from .tweets import Tweet


@dataclass(frozen=True)
class WeightedScore:
    raw_score: float
    normalized_score: float
    observations: int


def normalize_finbert_score(score: float) -> float:
    """Map FinBERT polarity from [-1, 1] to [0, 100]."""
    return float(np.clip((score + 1.0) * 50.0, 0.0, 100.0))


def weighted_sentiment_score(
    rows: Iterable[dict],
    score_key: str = "sentiment_score",
    weight_key: str = "weight",
) -> WeightedScore:
    df = pd.DataFrame(rows)
    if df.empty:
        return WeightedScore(raw_score=0.0, normalized_score=50.0, observations=0)

    scores = pd.to_numeric(df[score_key], errors="coerce").fillna(0.0)
    weights = pd.to_numeric(df.get(weight_key, 1.0), errors="coerce").fillna(1.0)
    weights = weights.clip(lower=0.0)

    if float(weights.sum()) == 0.0:
        raw = float(scores.mean())
    else:
        raw = float(np.average(scores, weights=weights))

    return WeightedScore(
        raw_score=raw,
        normalized_score=normalize_finbert_score(raw),
        observations=int(len(df)),
    )


def combine_source_scores(
    earnings_score: float,
    tweet_score: float,
    earnings_weight: float,
    tweets_weight: float,
) -> float:
    total_weight = earnings_weight + tweets_weight
    if total_weight <= 0:
        return 50.0

    combined_raw = (
        earnings_score * earnings_weight + tweet_score * tweets_weight
    ) / total_weight
    return normalize_finbert_score(combined_raw)


def build_event_scores(
    event: EventConfig,
    call_scores: dict[str, float],
    tweets: list[Tweet],
    tweet_scores: pd.DataFrame,
    returns: MarketReturn,
    call_weight: float,
    tweets_weight: float,
) -> dict:
    tweet_rows = []
    for tweet, (_, score_row) in zip(tweets, tweet_scores.iterrows()):
        tweet_rows.append(
            {
                "sentiment_score": score_row["raw_sentiment_score"],
                "weight": tweet.weight,
            }
        )
    weighted_tweets = weighted_sentiment_score(tweet_rows, score_key="sentiment_score")

    call_raw = float(call_scores["raw_sentiment_score"])
    combined_score = combine_source_scores(
        earnings_score=call_raw,
        tweet_score=weighted_tweets.raw_score,
        earnings_weight=call_weight,
        tweets_weight=tweets_weight if weighted_tweets.observations else 0.0,
    )

    return {
        "ticker": event.ticker,
        "company_name": event.company_name,
        "earnings_datetime": event.earnings_datetime.isoformat(),
        "earnings_sentiment_raw": call_raw,
        "earnings_sentiment_score": call_scores["normalized_sentiment_score"],
        "tweet_sentiment_raw": weighted_tweets.raw_score,
        "tweet_sentiment_score": weighted_tweets.normalized_score,
        "combined_sentiment_score": combined_score,
        "tweets_used": weighted_tweets.observations,
        "stock_start_price": returns.start_price,
        "stock_end_price": returns.end_price,
        "stock_return_pct": returns.return_pct,
    }
