"""Central configuration — all magic values live here."""
from __future__ import annotations
import os

# ── Server / CORS ─────────────────────────────────────────────
CORS_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
]

# ── Fetcher tunables ──────────────────────────────────────────
NEWS_FETCH_TIMEOUT_CONNECT: float = float(os.getenv("FETCH_TIMEOUT_CONNECT", "4"))
NEWS_FETCH_TIMEOUT_READ:    float = float(os.getenv("FETCH_TIMEOUT_READ",    "7"))
MAX_ARTICLES_PER_SOURCE:    int   = int(os.getenv("MAX_ARTICLES_PER_SOURCE", "15"))

# ── Scoring ───────────────────────────────────────────────────
MIN_SENTIMENT_THRESHOLD: float = 0.02   # articles below this absolute value are dropped

# ── Cache ─────────────────────────────────────────────────────
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL", "300"))   # 5 minutes

# ── Persistence ───────────────────────────────────────────────
DB_PATH: str = os.getenv("DB_PATH", "sentiment_history.db")

# ── Source reliability weights (0–1) ─────────────────────────
# Financial-specific sources rank highest; generic aggregators slightly lower.
SOURCE_WEIGHTS: dict[str, float] = {
    "Finnhub":       1.00,
    "Alpha Vantage": 0.95,
    "Yahoo Finance": 0.90,
    "Seeking Alpha": 0.85,
    "Google News":   0.80,
    "Bing News":     0.75,
    "Marketaux":     0.75,
}
DEFAULT_SOURCE_WEIGHT: float = 0.70

# ── Scheduler ─────────────────────────────────────────────────
SCHEDULER_ENABLED: bool = os.getenv("SCHEDULER_ENABLED", "true").lower() == "true"
SCHEDULER_INTERVAL_MINUTES: int = int(os.getenv("SCHEDULER_INTERVAL", "60"))
SCHEDULED_TICKERS: list[str] = [
    t.strip()
    for t in os.getenv(
        "SCHEDULED_TICKERS",
        "TSLA,AAPL,NVDA,MSFT,GOOGL,AMZN,META,AMD",
    ).split(",")
    if t.strip()
]
