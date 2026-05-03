from finbert_emisoras.aggregation import (
    combine_source_scores,
    normalize_finbert_score,
    weighted_sentiment_score,
)


def test_normalize_finbert_score_maps_range_to_0_100() -> None:
    assert normalize_finbert_score(-1.0) == 0.0
    assert normalize_finbert_score(0.0) == 50.0
    assert normalize_finbert_score(1.0) == 100.0


def test_weighted_sentiment_score_uses_tweet_weights() -> None:
    score = weighted_sentiment_score(
        [
            {"sentiment_score": 0.8, "weight": 3},
            {"sentiment_score": -0.4, "weight": 1},
        ]
    )

    assert round(score.raw_score, 2) == 0.5
    assert round(score.normalized_score, 2) == 75.0
    assert score.observations == 2


def test_combine_source_scores_normalizes_weighted_raw_score() -> None:
    assert combine_source_scores(0.4, -0.2, 0.7, 0.3) == 61.0
