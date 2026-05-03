from __future__ import annotations

import math
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from apify_client import ApifyClient
from dateutil import parser

from .config import TweetSearchConfig


@dataclass(frozen=True)
class Tweet:
    id: str
    text: str
    created_at: datetime
    url: str | None
    username: str | None
    author_name: str | None
    author_description: str | None
    verified: bool
    followers: int
    likes: int
    retweets: int
    replies: int
    quotes: int
    views: int
    raw: dict[str, Any]
    weight: float = field(default=0.0, compare=False)

    @property
    def interactions(self) -> int:
        return self.likes + self.retweets + self.replies + self.quotes

    def with_weight(self, weight: float) -> Tweet:
        return Tweet(
            id=self.id,
            text=self.text,
            created_at=self.created_at,
            url=self.url,
            username=self.username,
            author_name=self.author_name,
            author_description=self.author_description,
            verified=self.verified,
            followers=self.followers,
            likes=self.likes,
            retweets=self.retweets,
            replies=self.replies,
            quotes=self.quotes,
            views=self.views,
            raw=self.raw,
            weight=weight,
        )

    def to_output_dict(self) -> dict[str, Any]:
        return {
            "tweet_id": self.id,
            "created_at": self.created_at.isoformat(),
            "url": self.url,
            "username": self.username,
            "author_name": self.author_name,
            "author_description": self.author_description,
            "verified": self.verified,
            "followers": self.followers,
            "likes": self.likes,
            "retweets": self.retweets,
            "replies": self.replies,
            "quotes": self.quotes,
            "views": self.views,
            "interactions": self.interactions,
            "tweet_weight": self.weight,
            "text": self.text,
        }


def build_query(ticker: str, company_name: str | None, extra_terms: list[str]) -> str:
    parts = [f"${ticker}", ticker]
    if company_name:
        parts.append(f'"{company_name}"')
    parts.extend(extra_terms)
    unique_parts = list(dict.fromkeys(part for part in parts if part))
    return " OR ".join(unique_parts)


class ApifyTweetClient:
    def __init__(
        self,
        token: str | None,
        actor_id: str,
        max_items: int,
        extra_input: dict[str, Any] | None = None,
    ) -> None:
        if not token:
            raise ValueError("Define APIFY_TOKEN en el entorno o en el YAML.")
        self._client = ApifyClient(token)
        self.actor_id = actor_id
        self.max_items = max_items
        self.extra_input = extra_input or {}

    def search(
        self,
        queries: list[str],
        since: datetime,
        until: datetime,
        language: str | None = None,
    ) -> list[Tweet]:
        search_query = " OR ".join(dict.fromkeys(term for term in queries if term))
        run_input = {
            "searchTerms": [search_query],
            "maxItems": self.max_items,
            "sort": "Top",
            "start": since.isoformat(),
            "end": until.isoformat(),
            **self.extra_input,
        }
        if language:
            run_input["language"] = language

        run = self._client.actor(self.actor_id).call(run_input=run_input)
        dataset_items = self._client.dataset(run["defaultDatasetId"]).iterate_items()
        return [_tweet_from_item(item) for item in dataset_items if _extract_text(item)]


def fetch_tweets_for_event(
    ticker: str,
    earnings_datetime: datetime,
    config: TweetSearchConfig,
    company_name: str | None = None,
    apify_token: str | None = None,
) -> list[Tweet]:
    token = apify_token or os.getenv("APIFY_TOKEN")
    start = earnings_datetime - timedelta(hours=config.hours_before)
    end = earnings_datetime + timedelta(hours=config.hours_after)
    query = build_query(ticker=ticker, company_name=company_name, extra_terms=config.extra_terms)
    client = ApifyTweetClient(
        token=token,
        actor_id=config.actor_id,
        max_items=config.max_items,
        extra_input=config.extra_input,
    )
    return client.search([query], since=start, until=end)


def filter_and_rank_tweets(
    tweets: list[Tweet],
    config: TweetSearchConfig | None = None,
    *,
    preferred_keywords: list[str] | None = None,
    min_interactions: int | None = None,
    require_verified: bool | None = None,
    top_n: int | None = None,
) -> list[Tweet]:
    if config:
        preferred_keywords = config.preferred_author_keywords
        min_interactions = config.min_interactions
        require_verified = config.only_verified
        top_n = config.top_n
        min_followers = config.min_followers
        priority_accounts = config.priority_accounts
    else:
        min_followers = 0
        priority_accounts = []
    preferred_keywords = preferred_keywords or []
    min_interactions = min_interactions if min_interactions is not None else 0
    require_verified = bool(require_verified)
    top_n = top_n or len(tweets)

    weighted = []
    for tweet in tweets:
        if require_verified and not tweet.verified:
            continue
        if min_followers and tweet.followers < min_followers:
            continue
        if tweet.interactions < min_interactions:
            continue
        if not _matches_priority_account(tweet.username, priority_accounts):
            # If priority accounts are configured, keep only those accounts.
            if priority_accounts:
                continue

        weight = tweet_weight(tweet, preferred_keywords)
        weighted.append(tweet.with_weight(weight))

    weighted.sort(key=lambda row: row.weight, reverse=True)
    return weighted[:top_n]


def tweet_weight(tweet: Tweet, preferred_keywords: list[str] | None = None) -> float:
    interactions = (
        tweet.likes
        + 2.0 * tweet.retweets
        + 1.5 * tweet.replies
        + 2.0 * tweet.quotes
        + 0.01 * tweet.views
    )
    authority = math.log1p(tweet.followers)
    verified_bonus = 1.4 if tweet.verified else 1.0
    role_bonus = 1.0
    author_blob = " ".join(
        value.lower()
        for value in [tweet.author_name or "", tweet.author_description or ""]
        if value
    )
    if preferred_keywords and any(keyword.lower() in author_blob for keyword in preferred_keywords):
        role_bonus = 1.25
    return verified_bonus * role_bonus * math.log1p(interactions) * max(authority, 1.0)


def _tweet_from_item(item: dict[str, Any]) -> Tweet:
    author = _first_dict(item, ["author", "user", "profile", "creator"])
    metrics = _first_dict(item, ["public_metrics", "metrics", "statistics", "stats"])

    username = _first_value(item, ["username", "userName", "authorUserName"])
    if not username and author:
        username = _first_value(author, ["username", "userName", "screen_name", "screenName"])
    author_name = (
        _first_value(item, ["authorName", "name"])
        or _first_value(author, ["name", "displayName", "fullName"])
    )
    author_description = (
        _first_value(item, ["authorDescription", "description", "bio"])
        or _first_value(author, ["description", "bio"])
    )

    return Tweet(
        id=str(_first_value(item, ["id", "tweetId", "conversationId"]) or ""),
        text=_extract_text(item),
        created_at=_parse_datetime(_first_value(item, ["createdAt", "created_at", "date", "timestamp"])),
        url=_first_value(item, ["url", "twitterUrl", "xUrl"]),
        username=username,
        author_name=author_name,
        author_description=author_description,
        verified=bool(
            _first_value(item, ["verified", "isVerified", "authorIsVerified"])
            or (author and _first_value(author, ["verified", "isVerified", "blue_verified", "is_blue_verified"]))
        ),
        followers=_as_int(
            _first_value(item, ["followers", "followersCount", "authorFollowers"])
            or (author and _first_value(author, ["followers", "followersCount", "followers_count"]))
        ),
        likes=_as_int(_first_value(item, ["likes", "likeCount", "favoriteCount"]) or _first_value(metrics, ["like_count", "likes"])),
        retweets=_as_int(_first_value(item, ["retweets", "retweetCount"]) or _first_value(metrics, ["retweet_count", "retweets"])),
        replies=_as_int(_first_value(item, ["replies", "replyCount"]) or _first_value(metrics, ["reply_count", "replies"])),
        quotes=_as_int(_first_value(item, ["quotes", "quoteCount"]) or _first_value(metrics, ["quote_count", "quotes"])),
        views=_as_int(_first_value(item, ["views", "viewCount", "impressionCount"]) or _first_value(metrics, ["impression_count", "views"])),
        raw=item,
    )


def _extract_text(item: dict[str, Any]) -> str:
    value = _first_value(item, ["text", "fullText", "full_text", "tweetText", "content"])
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _parse_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        dt = value
    elif value:
        dt = parser.parse(str(value))
    else:
        dt = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _first_dict(item: dict[str, Any] | None, keys: list[str]) -> dict[str, Any]:
    if not item:
        return {}
    for key in keys:
        value = item.get(key)
        if isinstance(value, dict):
            return value
    return {}


def _first_value(item: dict[str, Any] | None, keys: list[str]) -> Any:
    if not item:
        return None
    for key in keys:
        value = item.get(key)
        if value not in (None, ""):
            return value
    return None


def _as_int(value: Any) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _matches_priority_account(username: str | None, priority_accounts: list[str]) -> bool:
    if not priority_accounts:
        return True
    if not username:
        return False
    normalized = username.lower().lstrip("@")
    allowed = {account.lower().lstrip("@") for account in priority_accounts}
    return normalized in allowed
