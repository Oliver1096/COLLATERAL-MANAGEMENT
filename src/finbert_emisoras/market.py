from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf


@dataclass(frozen=True)
class MarketReturn:
    ticker: str
    start_price: float | None
    end_price: float | None
    return_pct: float | None
    price_series: pd.DataFrame


def fetch_market_return(
    ticker: str,
    event_datetime: datetime,
    days_before: int = 1,
    days_after: int = 3,
) -> MarketReturn:
    """Download prices around the event and compute close-to-close return."""
    start = (event_datetime - timedelta(days=days_before + 3)).date()
    end = (event_datetime + timedelta(days=days_after + 5)).date()
    prices = yf.download(ticker, start=start.isoformat(), end=end.isoformat(), progress=False)

    if prices.empty:
        return MarketReturn(ticker, None, None, None, prices)

    closes = prices["Close"].dropna()
    if closes.empty:
        return MarketReturn(ticker, None, None, None, prices)

    event_date = pd.Timestamp(event_datetime.date())
    start_candidates = closes[closes.index <= event_date]
    end_candidates = closes[closes.index >= event_date + pd.Timedelta(days=days_after)]

    start_price = float(start_candidates.iloc[-1] if not start_candidates.empty else closes.iloc[0])
    end_price = float(end_candidates.iloc[0] if not end_candidates.empty else closes.iloc[-1])
    return_pct = ((end_price / start_price) - 1.0) * 100.0 if start_price else None

    return MarketReturn(ticker, start_price, end_price, return_pct, prices)


def fetch_returns(
    ticker: str,
    event_datetime: datetime,
    window: int | None = None,
    benchmark: str | None = None,
) -> dict[str, float | None]:
    days_after = window if window is not None else 3
    stock_return = fetch_market_return(ticker, event_datetime, days_after=days_after)
    benchmark_return = (
        fetch_market_return(benchmark, event_datetime, days_after=days_after)
        if benchmark
        else None
    )
    benchmark_pct = benchmark_return.return_pct if benchmark_return else None
    excess_return = (
        stock_return.return_pct - benchmark_pct
        if stock_return.return_pct is not None and benchmark_pct is not None
        else None
    )
    return {
        "stock_return_pct": stock_return.return_pct,
        "benchmark_return_pct": benchmark_pct,
        "excess_return_pct": excess_return,
        "start_price": stock_return.start_price,
        "end_price": stock_return.end_price,
    }
