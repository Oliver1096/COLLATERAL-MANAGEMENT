from datetime import datetime, timezone

from finbert_emisoras.config import TweetSearchConfig
from finbert_emisoras.tweets import Tweet, filter_and_rank_tweets, tweet_weight


def _tweet(**overrides):
    defaults = {
        "id": "1",
        "text": "Strong earnings beat",
        "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        "url": None,
        "username": "analyst",
        "author_name": "Market Analyst",
        "author_description": "financial analyst",
        "verified": True,
        "followers": 100_000,
        "likes": 100,
        "retweets": 20,
        "replies": 10,
        "quotes": 5,
        "views": 5_000,
        "raw": {"description": "financial analyst"},
    }
    defaults.update(overrides)
    return Tweet(**defaults)


def test_tweet_weight_rewards_verified_and_engagement():
    low = _tweet(verified=False, likes=1, retweets=0, replies=0, quotes=0, views=10)
    high = _tweet(verified=True, likes=200, retweets=60, replies=20, quotes=10, views=20_000)

    assert tweet_weight(high, ["analyst"]) > tweet_weight(low, ["analyst"])


def test_filter_and_rank_tweets_keeps_verified_high_interaction_tweets():
    config = TweetSearchConfig(
        actor_id="actor",
        max_items=10,
        hours_before=24,
        hours_after=72,
        top_n=1,
        only_verified=True,
        min_followers=10_000,
        min_interactions=20,
        priority_accounts=[],
        preferred_author_keywords=["analyst"],
        extra_terms=[],
        extra_input={},
    )
    tweets = [
        _tweet(id="low", verified=False, likes=1),
        _tweet(id="high", likes=200, retweets=50),
    ]

    ranked = filter_and_rank_tweets(tweets, config=config)

    assert [tweet.id for tweet in ranked] == ["high"]
    assert ranked[0].weight > 0
