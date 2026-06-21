"""VADER-based sentiment scoring with financial domain lexicon enhancement.

Why VADER over FinBERT?
- VADER runs in < 1 ms per article; FinBERT requires ~200-500 ms without a GPU.
- For this workload (25-60 articles per request), VADER adds ~5 ms total vs 10-30 s for FinBERT.
- The financial lexicon additions below address VADER's main weakness in this domain.
- FinBERT is the right call on a GPU-equipped inference server; VADER is the right call here.
"""
from __future__ import annotations
import math
import re
import unicodedata

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_vader = SentimentIntensityAnalyzer()

# Domain-specific overrides injected directly into the VADER lexicon.
# Positive: financial outperformance signals.  Negative: risk/distress signals.
_FINANCIAL_LEXICON: dict[str, float] = {
    # Bullish
    "beat": 2.0,       "beats": 2.0,     "outperform": 2.5,  "upgrade": 2.0,
    "buyback": 1.8,    "dividend": 1.5,  "acquisition": 1.3, "bullish": 2.5,
    "breakout": 2.0,   "rally": 2.0,     "surge": 2.0,       "soar": 2.5,
    "record": 1.5,     "growth": 1.4,    "profit": 1.5,      "exceed": 2.0,
    "strong": 1.3,     "robust": 1.5,    "optimistic": 1.8,  "expansion": 1.4,
    "partnership": 1.2,"ipo": 1.3,       "innovation": 1.2,
    # Bearish
    "miss": -2.0,      "misses": -2.0,   "downgrade": -2.5,  "bearish": -2.5,
    "lawsuit": -2.0,   "fraud": -3.0,    "bankruptcy": -3.5, "recall": -2.0,
    "decline": -1.8,   "drop": -1.5,     "plunge": -2.5,     "slump": -2.0,
    "layoff": -2.0,    "layoffs": -2.0,  "restructuring": -1.5,
    "investigation": -2.0, "loss": -2.0, "losses": -2.0,    "deficit": -1.8,
    "warning": -1.5,   "concern": -1.2,  "uncertainty": -1.2,"volatile": -1.2,
    "sanction": -2.0,  "fine": -1.5,     "penalty": -1.5,    "default": -2.5,
}

for word, score in _FINANCIAL_LEXICON.items():
    _vader.lexicon[word] = score


def clean_text(text: str) -> str:
    """Normalize and sanitize article text before scoring."""
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    text = re.sub(r"<[^>]+>", "", text)                    # strip HTML tags
    text = re.sub(r"[^\w\s.,!?%$-]", " ", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def score(text: str) -> float:
    """Return VADER compound score in [-1.0, 1.0]."""
    cleaned = clean_text(text)
    if not cleaned:
        return 0.0
    return _vader.polarity_scores(cleaned)["compound"]


def recency_multiplier(days_old: float) -> float:
    """
    Logarithmic decay: articles from today get full weight, articles from
    7+ days ago get log(1+1) ≈ 0.69 weight.
    """
    effective = min(int(days_old), 7)
    weight = max(1, 7 - effective)
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
