"""Lightweight SQLite persistence for analysis history.

Stores one row per analysis run so the frontend can render a verdict trend.
Uses the stdlib sqlite3 module — no ORM required at this scale.
"""
from __future__ import annotations
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Any

from config import DB_PATH

logger = logging.getLogger(__name__)

_CREATE = """
CREATE TABLE IF NOT EXISTS analysis_history (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker           TEXT    NOT NULL,
    timestamp        TEXT    NOT NULL,
    verdict          TEXT,
    confidence_score REAL,
    avg_sentiment    REAL,
    articles_count   INTEGER
)
"""
_INSERT = """
INSERT INTO analysis_history (ticker, timestamp, verdict, confidence_score, avg_sentiment, articles_count)
VALUES (?, ?, ?, ?, ?, ?)
"""
_SELECT = """
SELECT timestamp, verdict, confidence_score, avg_sentiment
FROM analysis_history
WHERE ticker = ?
ORDER BY timestamp DESC
LIMIT ?
"""
_SELECT_ANALYTICS = """
SELECT timestamp, verdict, confidence_score, avg_sentiment
FROM analysis_history
WHERE ticker = ?
ORDER BY timestamp DESC
LIMIT 30
"""


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init() -> None:
    try:
        with _conn() as c:
            c.execute(_CREATE)
    except Exception as exc:
        logger.error("DB init failed: %s", exc)


def save(
    ticker: str,
    verdict: str,
    confidence_score: float,
    avg_sentiment: float,
    articles_count: int,
) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    try:
        with _conn() as c:
            c.execute(_INSERT, (ticker, ts, verdict, confidence_score, avg_sentiment, articles_count))
    except Exception as exc:
        logger.warning("DB save failed: %s", exc)


def get_history(ticker: str, limit: int = 8) -> list[dict[str, Any]]:
    try:
        with _conn() as c:
            rows = c.execute(_SELECT, (ticker, limit)).fetchall()
        return [dict(r) for r in rows]
    except Exception as exc:
        logger.warning("DB read failed: %s", exc)
        return []


def get_analytics(ticker: str) -> dict[str, Any]:
    """Rolling analytics over the last 30 runs for a ticker."""
    try:
        with _conn() as c:
            rows = [dict(r) for r in c.execute(_SELECT_ANALYTICS, (ticker,)).fetchall()]
    except Exception as exc:
        logger.warning("DB analytics failed: %s", exc)
        return {}

    if not rows:
        return {}

    sentiments  = [r["avg_sentiment"]    for r in rows]
    confidences = [r["confidence_score"] for r in rows]

    last_7  = sentiments[:7]
    last_30 = sentiments

    best  = max(rows, key=lambda r: r["avg_sentiment"])
    worst = min(rows, key=lambda r: r["avg_sentiment"])

    # 3-point moving average over chronological order (oldest first)
    chron = list(reversed(sentiments))
    moving_avg = [
        round(sum(chron[max(0, i - 2): i + 1]) / min(i + 1, 3), 4)
        for i in range(len(chron))
    ]

    verdict_dist: dict[str, int] = {}
    for r in rows:
        v = r["verdict"] or "UNKNOWN"
        verdict_dist[v] = verdict_dist.get(v, 0) + 1

    return {
        "total_runs":                len(rows),
        "rolling_7d_avg_sentiment":  round(sum(last_7) / len(last_7), 4),
        "rolling_30d_avg_sentiment": round(sum(last_30) / len(last_30), 4),
        "avg_confidence":            round(sum(confidences) / len(confidences), 2),
        "best_run": {
            "timestamp": best["timestamp"],
            "sentiment": round(best["avg_sentiment"], 4),
            "verdict":   best["verdict"],
        },
        "worst_run": {
            "timestamp": worst["timestamp"],
            "sentiment": round(worst["avg_sentiment"], 4),
            "verdict":   worst["verdict"],
        },
        "verdict_distribution": verdict_dist,
        "moving_avg_series":    moving_avg,
    }
