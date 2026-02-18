from __future__ import annotations

import importlib.machinery
import importlib.util
import sys
from datetime import date, timezone
from typing import Iterable

from .models import TweetRecord


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


def _to_record(account: str, tweet: object) -> TweetRecord:
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


def scrape_account(
    account: str,
    limit: int = 100,
    since: date | None = None,
    until: date | None = None,
) -> list[TweetRecord]:
    if limit <= 0:
        raise ValueError("El límite de tweets por cuenta debe ser mayor a cero.")

    query = _build_query(account=account, since=since, until=until)
    scraper = sntwitter.TwitterSearchScraper(query)
    records: list[TweetRecord] = []

    try:
        for index, tweet in enumerate(scraper.get_items()):
            if index >= limit:
                break
            records.append(_to_record(account=account, tweet=tweet))
    except Exception as exc:  # pragma: no cover - red externa/no determinística
        raise RuntimeError(
            f"Fallo scrapeando @{normalize_account(account)}. "
            "X puede estar rate-limiteando o bloqueando el scraping."
        ) from exc

    return records


def scrape_accounts(
    accounts: Iterable[str],
    limit_per_account: int = 100,
    since: date | None = None,
    until: date | None = None,
) -> list[TweetRecord]:
    all_records: list[TweetRecord] = []
    for account in accounts:
        all_records.extend(
            scrape_account(account=account, limit=limit_per_account, since=since, until=until)
        )
    return all_records
