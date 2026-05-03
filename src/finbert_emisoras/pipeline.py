from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from finbert_emisoras.aggregation import build_event_scores
from finbert_emisoras.config import load_settings
from finbert_emisoras.finbert import FinbertConfig, FinbertSentimentScorer
from finbert_emisoras.market import fetch_market_return
from finbert_emisoras.pdf_loader import load_earnings_call
from finbert_emisoras.tweets import ApifyTweetClient, filter_and_rank_tweets
from finbert_emisoras.visualization import plot_sentiment_vs_return


def run_pipeline(config_path: str | Path) -> pd.DataFrame:
    settings = load_settings(config_path)
    settings.output_dir.mkdir(parents=True, exist_ok=True)

    scorer = FinbertSentimentScorer(
        FinbertConfig(
            model_name=settings.finbert.model_name,
            device=settings.finbert.device,
            batch_size=settings.finbert.batch_size,
            max_chars_per_chunk=settings.finbert.max_chars_per_chunk,
        )
    )
    tweet_client = ApifyTweetClient(
        token=settings.apify_token,
        actor_id=settings.tweets.actor_id,
        max_items=settings.tweets.max_items,
        extra_input=settings.tweets.extra_input,
    )

    rows = []
    all_tweets = []

    for event in settings.events:
        call = load_earnings_call(event)
        call_scores = scorer.score_text(call.text)

        since, until = event.tweet_window
        raw_tweets = tweet_client.search(
            queries=event.twitter_queries,
            since=since,
            until=until,
        )
        ranked_tweets = filter_and_rank_tweets(
            raw_tweets,
            config=settings.tweets,
        )

        tweet_texts = [tweet.text for tweet in ranked_tweets]
        tweet_scores = scorer.score_texts(tweet_texts) if tweet_texts else pd.DataFrame()

        returns = fetch_market_return(
            ticker=event.ticker,
            event_datetime=event.earnings_datetime,
            days_after=settings.return_days_after,
        )

        row = build_event_scores(
            event=event,
            call_scores=call_scores,
            tweets=ranked_tweets,
            tweet_scores=tweet_scores,
            returns=returns,
            call_weight=settings.call_weight,
            tweets_weight=settings.tweets_weight,
        )
        rows.append(row)

        for tweet, (_, score_row) in zip(ranked_tweets, tweet_scores.iterrows()):
            tweet_payload = tweet.to_output_dict()
            tweet_payload.update(
                {
                    "ticker": event.ticker,
                    "earnings_datetime": event.earnings_datetime.isoformat(),
                    "sentiment_score_raw": score_row["raw_sentiment_score"],
                    "sentiment_score_normalized": score_row["normalized_sentiment_score"],
                    "positive_prob": score_row["positive_prob"],
                    "negative_prob": score_row["negative_prob"],
                    "neutral_prob": score_row["neutral_prob"],
                }
            )
            all_tweets.append(tweet_payload)

    results = pd.DataFrame(rows)
    results_path = settings.output_dir / "sentiment_event_scores.csv"
    results.to_csv(results_path, index=False)

    if all_tweets:
        tweets_path = settings.output_dir / "selected_tweets.csv"
        pd.DataFrame(all_tweets).to_csv(tweets_path, index=False)

    metadata_path = settings.output_dir / "run_metadata.json"
    metadata_path.write_text(
        json.dumps(
            {
                "model_name": settings.finbert.model_name,
                "apify_actor_id": settings.tweets.actor_id,
                "events": [event.as_dict() for event in settings.events],
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    plot_sentiment_vs_return(
        results=results,
        output_path=settings.output_dir / "sentiment_vs_return.png",
    )

    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analisis de sentimiento financiero con earnings calls, tweets y FinBERT."
    )
    parser.add_argument(
        "--config",
        default="config/example.yaml",
        help="Ruta al archivo YAML de configuracion.",
    )
    args = parser.parse_args()

    results = run_pipeline(args.config)
    print(results.to_string(index=False))


if __name__ == "__main__":
    main()
