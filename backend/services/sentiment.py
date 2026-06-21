"""Sentiment scoring with dual-mode support: VADER (default) or FinBERT.

VADER mode (default):
- < 1 ms per article, no dependencies beyond vaderSentiment
- 40+ financial-domain lexicon overrides address VADER's main weakness
- Headline and description scored separately; combined as 0.4 * headline + 0.6 * description

FinBERT mode (opt-in via SENTIMENT_MODEL=finbert):
- ~200-500 ms per article on CPU, ~5-10 ms on CUDA GPU
- Purpose-built transformer trained on financial text (ProsusAI/finbert)
- Batch inference for efficiency; results in [-1, 1] compound equivalent
- Requires: pip install -r requirements-finbert.txt
- Model downloads ~500 MB from HuggingFace Hub on first use

Model is lazily loaded on the first scoring call to avoid slow startup.
Thread lock ensures the model is initialized exactly once under concurrent requests.
"""
from __future__ import annotations

import logging
import math
import re
import threading
import unicodedata
from typing import Optional

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from config import FINBERT_DEVICE, SENTIMENT_MODEL

logger = logging.getLogger(__name__)

# ── VADER setup ────────────────────────────────────────────────

_vader = SentimentIntensityAnalyzer()

_FINANCIAL_LEXICON: dict[str, float] = {
    # Bullish signals
    "beat":          2.0,  "beats":         2.0,  "outperform":  2.5,  "upgrade":     2.0,
    "buyback":       1.8,  "dividend":      1.5,  "acquisition": 1.3,  "bullish":     2.5,
    "breakout":      2.0,  "rally":         2.0,  "surge":       2.0,  "soar":        2.5,
    "record":        1.5,  "growth":        1.4,  "profit":      1.5,  "exceed":      2.0,
    "strong":        1.3,  "robust":        1.5,  "optimistic":  1.8,  "expansion":   1.4,
    "partnership":   1.2,  "ipo":           1.3,  "innovation":  1.2,
    # Bearish signals
    "miss":         -2.0,  "misses":       -2.0,  "downgrade":  -2.5,  "bearish":    -2.5,
    "lawsuit":      -2.0,  "fraud":        -3.0,  "bankruptcy": -3.5,  "recall":     -2.0,
    "decline":      -1.8,  "drop":         -1.5,  "plunge":     -2.5,  "slump":      -2.0,
    "layoff":       -2.0,  "layoffs":      -2.0,  "restructuring": -1.5,
    "investigation":-2.0,  "loss":         -2.0,  "losses":     -2.0,  "deficit":    -1.8,
    "warning":      -1.5,  "concern":      -1.2,  "uncertainty":-1.2,  "volatile":   -1.2,
    "sanction":     -2.0,  "fine":         -1.5,  "penalty":    -1.5,  "default":    -2.5,
}

for _word, _val in _FINANCIAL_LEXICON.items():
    _vader.lexicon[_word] = _val

# ── FinBERT lazy loader ────────────────────────────────────────

_finbert: Optional[object] = None
_finbert_lock = threading.Lock()
_model_name: str = "vader"


def _maybe_load_finbert() -> None:
    """Attempt to lazy-load FinBERT exactly once (thread-safe)."""
    global _finbert, _model_name
    if _finbert is not None or SENTIMENT_MODEL != "finbert":
        return
    with _finbert_lock:
        if _finbert is not None:
            return
        try:
            from transformers import pipeline as hf_pipeline  # type: ignore[import]
            logger.info("Loading FinBERT (ProsusAI/finbert) on device=%d…", FINBERT_DEVICE)
            _finbert = hf_pipeline(
                "text-classification",
                model="ProsusAI/finbert",
                device=FINBERT_DEVICE,
                truncation=True,
                max_length=512,
            )
            _model_name = "finbert"
            logger.info("FinBERT loaded successfully")
        except ImportError:
            logger.warning(
                "transformers not installed — falling back to VADER. "
                "Run: pip install -r requirements-finbert.txt"
            )
        except Exception as exc:
            logger.warning("FinBERT load failed (%s) — falling back to VADER", exc)


def get_model_name() -> str:
    """Return the name of the model currently in use."""
    return _model_name


# ── Text utilities ─────────────────────────────────────────────


def clean_text(text: str) -> str:
    """Normalize and sanitize text before scoring."""
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[^\w\s.,!?%$-]", " ", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def _finbert_to_compound(result: dict) -> float:
    """Map FinBERT label + confidence to [-1, 1] compound equivalent."""
    label = result["label"].lower()
    conf  = float(result["score"])
    if label == "positive":
        return conf
    if label == "negative":
        return -conf
    return 0.0


# ── Public scoring API ─────────────────────────────────────────


def score(text: str) -> float:
    """Score a combined text string with VADER. Backward-compat alias."""
    cleaned = clean_text(text)
    if not cleaned:
        return 0.0
    return _vader.polarity_scores(cleaned)["compound"]


def score_article(headline: str, summary: str | None) -> float:
    """Score an article using headline + description with weighted combination.

    VADER mode : 0.4 * headline_score + 0.6 * description_score
                 (falls back to headline-only when description is absent)
    FinBERT mode: concatenated text fed into the fine-tuned classifier
                  (single forward pass; truncated to 512 tokens)
    """
    if SENTIMENT_MODEL == "finbert":
        _maybe_load_finbert()

    if _finbert is not None and _model_name == "finbert":
        combined = headline
        if summary:
            combined = f"{headline}. {summary[:300]}"
        cleaned = clean_text(combined)
        if not cleaned:
            return 0.0
        try:
            result = _finbert(cleaned[:512])[0]   # type: ignore[index]
            return _finbert_to_compound(result)
        except Exception as exc:
            logger.warning("FinBERT inference error: %s — using VADER", exc)

    # VADER weighted path
    h_score = score(headline)
    if summary and summary.strip():
        s_score = score(summary)
        return 0.4 * h_score + 0.6 * s_score
    return h_score


def batch_score(articles: list[tuple[str, str | None]]) -> list[float]:
    """Score multiple articles, batching FinBERT calls for efficiency.

    For VADER: equivalent to calling score_article() per article.
    For FinBERT: single model call with batch_size=8, ~8× faster than loop.
    """
    if SENTIMENT_MODEL == "finbert":
        _maybe_load_finbert()

    if _finbert is not None and _model_name == "finbert":
        texts: list[str] = []
        for headline, summary in articles:
            combined = headline
            if summary:
                combined = f"{headline}. {summary[:300]}"
            texts.append(clean_text(combined)[:512] or headline[:100])

        try:
            results = _finbert(texts, batch_size=8)   # type: ignore[call-arg]
            return [_finbert_to_compound(r) for r in results]
        except Exception as exc:
            logger.warning("FinBERT batch error: %s — falling back to VADER", exc)

    return [score_article(h, s) for h, s in articles]


# ── Weighting helpers ──────────────────────────────────────────


def recency_multiplier(days_old: float) -> float:
    """Logarithmic recency decay.

    Today (0d) → log(8) ≈ 2.08 · · · 7+ days → log(2) ≈ 0.69
    """
    effective = min(int(days_old), 7)
    weight    = max(1, 7 - effective)
    return math.log(weight + 1)


def weighted_score(compound: float, days_old: float, source_weight: float) -> float:
    """Combine compound score with recency and source-reliability weights."""
    return compound * recency_multiplier(days_old) * source_weight


def get_verdict(metric: float) -> str:
    if metric > 0.20:
        return "STRONG BUY"
    if metric > 0.05:
        return "BUY"
    if metric < -0.20:
        return "STRONG SELL"
    if metric < -0.05:
        return "SELL"
    return "HOLD"
