from src.sentiment import extract_cashtags, extract_issuers, sentiment_label


def test_extract_cashtags_deduplicates_and_uppercases() -> None:
    text = "Bullish on $tsla and $TSLA but cautious on $coin."
    assert extract_cashtags(text) == ["COIN", "TSLA"]


def test_extract_issuers_uses_aliases_and_cashtags() -> None:
    catalog = {
        "TSLA": {"tsla", "tesla"},
        "MSTR": {"mstr", "microstrategy"},
    }
    text = "Tesla keeps shipping, and $MSTR keeps buying bitcoin."
    assert extract_issuers(text, catalog) == ["MSTR", "TSLA"]


def test_sentiment_label_thresholds() -> None:
    assert sentiment_label(0.2) == "positive"
    assert sentiment_label(-0.2) == "negative"
    assert sentiment_label(0.0) == "neutral"
