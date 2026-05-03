from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def plot_sentiment_vs_return(results: pd.DataFrame, output_path: Path) -> None:
    if results.empty:
        raise ValueError("No hay resultados para graficar.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    ordered = results.sort_values(["ticker", "earnings_datetime"])

    fig, ax1 = plt.subplots(figsize=(12, 6))
    labels = [
        f"{row.ticker}\n{pd.Timestamp(row.earnings_datetime).date()}"
        for row in ordered.itertuples()
    ]
    x = range(len(ordered))

    ax1.bar(
        x,
        ordered["combined_sentiment_score"],
        color="#2f80ed",
        alpha=0.75,
        label="Sentimiento combinado normalizado",
    )
    ax1.set_ylabel("Sentimiento normalizado (0 a 100)")
    ax1.set_ylim(0, 100)
    ax1.axhline(50, color="#333333", linewidth=0.8, linestyle="--")

    ax2 = ax1.twinx()
    ax2.plot(
        x,
        ordered["stock_return_pct"],
        color="#f2994a",
        marker="o",
        linewidth=2,
        label="Rendimiento de la emisora (%)",
    )
    ax2.set_ylabel("Rendimiento (%)")

    ax1.set_xticks(list(x))
    ax1.set_xticklabels(labels, rotation=45, ha="right")
    ax1.set_title("Sentimiento FinBERT vs rendimiento de la emisora")

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="best")

    fig.tight_layout()
    fig.savefig(output_path, dpi=160)
    plt.close(fig)
