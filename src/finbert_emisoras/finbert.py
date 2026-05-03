from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline


FINBERT_MODEL = "ProsusAI/finbert"


@dataclass(frozen=True)
class FinbertConfig:
    model_name: str = FINBERT_MODEL
    max_chars_per_chunk: int = 1800
    batch_size: int = 16
    device: int | None = None


class FinbertSentimentScorer:
    """Wrapper around ProsusAI FinBERT with financial score normalization."""

    def __init__(
        self,
        config: FinbertConfig | None = None,
        *,
        model_name: str | None = None,
        max_chars_per_chunk: int | None = None,
        batch_size: int | None = None,
        device: int | None = None,
    ) -> None:
        self.config = config or FinbertConfig(
            model_name=model_name or FINBERT_MODEL,
            max_chars_per_chunk=max_chars_per_chunk or 1800,
            batch_size=batch_size or 16,
            device=device,
        )
        device = self.config.device
        if device is None:
            device = 0 if torch.cuda.is_available() else -1

        tokenizer = AutoTokenizer.from_pretrained(self.config.model_name)
        model = AutoModelForSequenceClassification.from_pretrained(self.config.model_name)
        self._classifier = pipeline(
            "text-classification",
            model=model,
            tokenizer=tokenizer,
            top_k=None,
            device=device,
            truncation=True,
        )

    def score_text(self, text: str) -> dict[str, float]:
        chunks = split_text(text, self.config.max_chars_per_chunk)
        if not chunks:
            return empty_sentiment_scores()

        rows = self._score_chunks(chunks)
        return aggregate_sentiment(rows)

    def score_texts(self, texts: Iterable[str]) -> pd.DataFrame:
        records = [self.score_text(text) for text in texts]
        return pd.DataFrame.from_records(records)

    def score_many(self, texts: Iterable[str]) -> pd.DataFrame:
        return self.score_texts(texts)

    def _score_chunks(self, chunks: list[str]) -> pd.DataFrame:
        records: list[dict[str, float]] = []
        for start in range(0, len(chunks), self.config.batch_size):
            batch = chunks[start : start + self.config.batch_size]
            results = self._classifier(batch)
            for chunk, labels in zip(batch, results):
                scores = {item["label"].lower(): float(item["score"]) for item in labels}
                scores["chunk_chars"] = len(chunk)
                records.append(scores)
        return pd.DataFrame.from_records(records)


def split_text(text: str, max_chars: int) -> list[str]:
    normalized = " ".join(str(text).split())
    if not normalized:
        return []

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for sentence in normalized.replace("? ", "?. ").replace("! ", "!. ").split(". "):
        sentence = sentence.strip()
        if not sentence:
            continue
        sentence_len = len(sentence) + 2
        if current and current_len + sentence_len > max_chars:
            chunks.append(". ".join(current))
            current = [sentence]
            current_len = sentence_len
        else:
            current.append(sentence)
            current_len += sentence_len
    if current:
        chunks.append(". ".join(current))
    return chunks


def aggregate_sentiment(rows: pd.DataFrame, weight_col: str = "chunk_chars") -> dict[str, float]:
    if rows.empty:
        return empty_sentiment_scores()

    weights = rows[weight_col].astype(float).to_numpy()
    weights = weights / weights.sum() if weights.sum() else np.ones(len(rows)) / len(rows)
    positive = float(np.average(rows.get("positive", 0.0), weights=weights))
    negative = float(np.average(rows.get("negative", 0.0), weights=weights))
    neutral = float(np.average(rows.get("neutral", 0.0), weights=weights))
    raw_score = positive - negative
    normalized_score = normalize_sentiment(raw_score)

    return {
        "positive_prob": positive,
        "negative_prob": negative,
        "neutral_prob": neutral,
        "raw_sentiment_score": raw_score,
        "normalized_sentiment_score": normalized_score,
    }


def normalize_sentiment(raw_score: float) -> float:
    """Map FinBERT's positive-minus-negative score from [-1, 1] to [0, 100]."""
    clipped = min(1.0, max(-1.0, raw_score))
    return (clipped + 1.0) * 50.0


def empty_sentiment_scores() -> dict[str, float]:
    return {
        "positive_prob": 0.0,
        "negative_prob": 0.0,
        "neutral_prob": 1.0,
        "raw_sentiment_score": 0.0,
        "normalized_sentiment_score": 50.0,
    }


FinBertScorer = FinbertSentimentScorer
