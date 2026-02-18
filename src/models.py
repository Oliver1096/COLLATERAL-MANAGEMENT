from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class TweetRecord:
    """Estructura base de un tweet scrapeado."""

    account: str
    tweet_id: int
    created_at: datetime
    content: str
    lang: str | None
    likes: int
    replies: int
    reposts: int
    quotes: int
    url: str
