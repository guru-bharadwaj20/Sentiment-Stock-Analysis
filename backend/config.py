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

# ── Sentiment model ───────────────────────────────────────────
# "vader"   — fast (<1 ms/article), no GPU needed, default for production
# "finbert" — accurate (~200 ms/article on CPU), requires:
#             pip install -r requirements-finbert.txt
#             Model: ProsusAI/finbert (downloads ~500 MB on first use)
SENTIMENT_MODEL: str = os.getenv("SENTIMENT_MODEL", "vader").lower()
FINBERT_DEVICE:  int = int(os.getenv("FINBERT_DEVICE", "-1"))   # -1 = CPU, 0+ = CUDA GPU

# ── Cache ─────────────────────────────────────────────────────
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL", "300"))   # 5 minutes

# ── Persistence ───────────────────────────────────────────────
DB_PATH: str = os.getenv("DB_PATH", "sentiment_history.db")

# ── Source reliability weights (0–1) ─────────────────────────
# Wire services and institutional providers at top; aggregators slightly lower.
SOURCE_WEIGHTS: dict[str, float] = {
    "Reuters":       1.00,
    "Bloomberg":     1.00,
    "Finnhub":       1.00,
    "Alpha Vantage": 0.95,
    "Yahoo Finance": 0.90,
    "Seeking Alpha": 0.85,
    "Google News":   0.85,
    "Bing News":     0.80,
    "Marketaux":     0.80,
}
DEFAULT_SOURCE_WEIGHT: float = 0.65

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
