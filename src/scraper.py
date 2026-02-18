from __future__ import annotations

import asyncio
import importlib.machinery
import importlib.util
import os
import sys
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Iterable, Literal

from .models import TweetRecord

ScrapeBackend = Literal["auto", "snscrape", "twikit"]


def normalize_account(account: str) -> str:
    return account.strip().lstrip("@")


def _patch_file_finder_for_snscrape() -> None:
    """
    Compatibilidad Python 3.12:
    snscrape usa `find_module`, removido en importlib moderno.
    """

    if hasattr(importlib.machinery.FileFinder, "find_module"):
        return

    def _find_module(self: importlib.machinery.FileFinder, fullname: str):
        spec = self.find_spec(fullname)
        if spec is None or spec.loader is None:
            return None
        loader = spec.loader
        if hasattr(loader, "load_module"):
            return loader

        class _CompatLoader:
            def __init__(self, wrapped_loader, wrapped_spec):
                self._wrapped_loader = wrapped_loader
                self._wrapped_spec = wrapped_spec

            def load_module(self, module_name: str):
                module = importlib.util.module_from_spec(self._wrapped_spec)
                self._wrapped_loader.exec_module(module)
                sys.modules[module_name] = module
                return module

        return _CompatLoader(loader, spec)

    importlib.machinery.FileFinder.find_module = _find_module  # type: ignore[attr-defined]


_patch_file_finder_for_snscrape()
import snscrape.modules.twitter as sntwitter


@dataclass(slots=True)
class TwikitAuthConfig:
    auth_info_1: str | None = None
    auth_info_2: str | None = None
    password: str | None = None
    totp_secret: str | None = None
    cookies_file: str | None = None

    @classmethod
    def from_env(cls) -> TwikitAuthConfig:
        return cls(
            auth_info_1=os.getenv("X_AUTH_INFO_1"),
            auth_info_2=os.getenv("X_AUTH_INFO_2"),
            password=os.getenv("X_PASSWORD"),
            totp_secret=os.getenv("X_TOTP_SECRET"),
            cookies_file=os.getenv("X_COOKIES_FILE"),
        )

    def has_credentials(self) -> bool:
        return bool(self.auth_info_1 and self.password)

    def has_cookie_file(self) -> bool:
        if not self.cookies_file:
            return False
        return Path(self.cookies_file).expanduser().exists()

    def is_configured(self) -> bool:
        return self.has_cookie_file() or self.has_credentials()


def _build_query(account: str, since: date | None = None, until: date | None = None) -> str:
    query = f"from:{normalize_account(account)}"
    if since:
        query += f" since:{since.isoformat()}"
    if until:
        query += f" until:{until.isoformat()}"
    return query


def _tweet_content(tweet: object) -> str:
    # `renderedContent` suele contener texto más limpio que `rawContent`.
    return getattr(tweet, "renderedContent", "") or getattr(tweet, "rawContent", "")


def _to_record_snscrape(account: str, tweet: object) -> TweetRecord:
    created_at = getattr(tweet, "date")
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    return TweetRecord(
        account=normalize_account(account),
        tweet_id=int(getattr(tweet, "id")),
        created_at=created_at,
        content=_tweet_content(tweet),
        lang=getattr(tweet, "lang", None),
        likes=int(getattr(tweet, "likeCount", 0)),
        replies=int(getattr(tweet, "replyCount", 0)),
        reposts=int(getattr(tweet, "retweetCount", 0)),
        quotes=int(getattr(tweet, "quoteCount", 0)),
        url=str(getattr(tweet, "url")),
    )


def _to_record_twikit(account: str, tweet: object, created_at: datetime) -> TweetRecord:
    return TweetRecord(
        account=normalize_account(account),
        tweet_id=int(getattr(tweet, "id")),
        created_at=created_at,
        content=(getattr(tweet, "full_text", None) or getattr(tweet, "text", "")),
        lang=getattr(tweet, "lang", None),
        likes=int(getattr(tweet, "favorite_count", 0) or 0),
        replies=int(getattr(tweet, "reply_count", 0) or 0),
        reposts=int(getattr(tweet, "retweet_count", 0) or 0),
        quotes=int(getattr(tweet, "quote_count", 0) or 0),
        url=f"https://x.com/{normalize_account(account)}/status/{getattr(tweet, 'id')}",
    )


def _is_in_window(created_at: datetime, since: date | None, until: date | None) -> bool:
    created_date = created_at.date()
    if since and created_date < since:
        return False
    if until and created_date >= until:
        return False
    return True


def scrape_account_with_snscrape(
    account: str,
    limit: int = 100,
    since: date | None = None,
    until: date | None = None,
) -> list[TweetRecord]:
    query = _build_query(account=account, since=since, until=until)
    scraper = sntwitter.TwitterSearchScraper(query)
    records: list[TweetRecord] = []

    for index, tweet in enumerate(scraper.get_items()):
        if index >= limit:
            break
        records.append(_to_record_snscrape(account=account, tweet=tweet))
    return records


async def _build_twikit_client(auth: TwikitAuthConfig):
    from twikit import Client

    client = Client("en-US")
    if auth.has_cookie_file():
        client.load_cookies(str(Path(auth.cookies_file or "").expanduser()))
        return client

    if not auth.has_credentials():
        raise ValueError(
            "Twikit requiere autenticación: define X_COOKIES_FILE o "
            "X_AUTH_INFO_1 + X_PASSWORD."
        )

    await client.login(
        auth_info_1=auth.auth_info_1 or "",
        auth_info_2=auth.auth_info_2,
        password=auth.password or "",
        totp_secret=auth.totp_secret,
        cookies_file=auth.cookies_file,
    )
    return client


async def _scrape_account_with_twikit_async(
    account: str,
    limit: int,
    since: date | None,
    until: date | None,
    auth: TwikitAuthConfig,
) -> list[TweetRecord]:
    client = await _build_twikit_client(auth)
    username = normalize_account(account)
    user = await client.get_user_by_screen_name(username)

    page_size = min(limit, 40)
    timeline = await client.get_user_tweets(user.id, "Tweets", count=page_size)
    records: list[TweetRecord] = []
    reached_since_limit = False

    while len(records) < limit and len(timeline) > 0:
        for tweet in timeline:
            created_at = getattr(tweet, "created_at_datetime")
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            if since and created_at.date() < since:
                reached_since_limit = True
                continue

            if not _is_in_window(created_at=created_at, since=since, until=until):
                continue

            records.append(_to_record_twikit(account=account, tweet=tweet, created_at=created_at))
            if len(records) >= limit:
                break

        if len(records) >= limit or reached_since_limit:
            break

        timeline = await timeline.next()

    return records


def scrape_account_with_twikit(
    account: str,
    limit: int = 100,
    since: date | None = None,
    until: date | None = None,
    twikit_auth_config: TwikitAuthConfig | None = None,
) -> list[TweetRecord]:
    auth = twikit_auth_config or TwikitAuthConfig.from_env()
    return asyncio.run(
        _scrape_account_with_twikit_async(
            account=account, limit=limit, since=since, until=until, auth=auth
        )
    )


def scrape_account(
    account: str,
    limit: int = 100,
    since: date | None = None,
    until: date | None = None,
    backend: ScrapeBackend = "auto",
    twikit_auth_config: TwikitAuthConfig | None = None,
) -> list[TweetRecord]:
    if limit <= 0:
        raise ValueError("El límite de tweets por cuenta debe ser mayor a cero.")

    auth = twikit_auth_config or TwikitAuthConfig.from_env()

    if backend == "snscrape":
        return scrape_account_with_snscrape(account=account, limit=limit, since=since, until=until)

    if backend == "twikit":
        return scrape_account_with_twikit(
            account=account,
            limit=limit,
            since=since,
            until=until,
            twikit_auth_config=auth,
        )

    # backend == "auto"
    try:
        return scrape_account_with_snscrape(account=account, limit=limit, since=since, until=until)
    except Exception as snscrape_exc:  # pragma: no cover - red externa/no determinística
        if auth.is_configured():
            try:
                return scrape_account_with_twikit(
                    account=account,
                    limit=limit,
                    since=since,
                    until=until,
                    twikit_auth_config=auth,
                )
            except Exception as twikit_exc:
                raise RuntimeError(
                    f"Fallo scrapeando @{normalize_account(account)} con snscrape "
                    f"({snscrape_exc}) y fallback twikit ({twikit_exc})."
                ) from twikit_exc

        raise RuntimeError(
            f"Fallo scrapeando @{normalize_account(account)} con snscrape ({snscrape_exc}). "
            "Para fallback con login usa Twikit y define X_COOKIES_FILE o "
            "X_AUTH_INFO_1 + X_PASSWORD."
        ) from snscrape_exc


def scrape_accounts(
    accounts: Iterable[str],
    limit_per_account: int = 100,
    since: date | None = None,
    until: date | None = None,
    backend: ScrapeBackend = "auto",
    twikit_auth_config: TwikitAuthConfig | None = None,
    continue_on_error: bool = True,
) -> tuple[list[TweetRecord], dict[str, str]]:
    all_records: list[TweetRecord] = []
    errors: dict[str, str] = {}

    for account in accounts:
        normalized = normalize_account(account)
        try:
            all_records.extend(
                scrape_account(
                    account=normalized,
                    limit=limit_per_account,
                    since=since,
                    until=until,
                    backend=backend,
                    twikit_auth_config=twikit_auth_config,
                )
            )
        except Exception as exc:
            errors[normalized] = str(exc)
            if not continue_on_error:
                raise

    return all_records, errors
