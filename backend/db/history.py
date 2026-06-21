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
