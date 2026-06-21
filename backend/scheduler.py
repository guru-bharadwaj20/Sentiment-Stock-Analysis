"""Background scheduler — periodically refreshes sentiment for predefined tickers.

Starts after startup; sleeps SCHEDULER_INTERVAL_MINUTES before the first run
so the server is fully ready and the user's first request is unaffected.
Between tickers a 30-second pause prevents API rate-limiting.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_task: Optional[asyncio.Task] = None
_tickers: list[str] = []


async def _loop(tickers: list[str], interval_s: int) -> None:
    logger.info("Scheduler active: %d tickers, interval %d min", len(tickers), interval_s // 60)
    while True:
        await asyncio.sleep(interval_s)
        for ticker in tickers:
            try:
                from services import cache as _cache
                from services.analyzer import analyze_ticker
                _cache.delete(ticker)
                await analyze_ticker(ticker)
                logger.info("Scheduled refresh complete: %s", ticker)
            except Exception as exc:
                logger.warning("Scheduler skipped %s: %s", ticker, exc)
            await asyncio.sleep(30)


def start() -> None:
    from config import SCHEDULER_ENABLED, SCHEDULED_TICKERS, SCHEDULER_INTERVAL_MINUTES
    global _task, _tickers
    if not SCHEDULER_ENABLED or not SCHEDULED_TICKERS:
        logger.info("Scheduler disabled (SCHEDULER_ENABLED=false or no tickers)")
        return
    _tickers = list(SCHEDULED_TICKERS)
    _task = asyncio.create_task(_loop(_tickers, SCHEDULER_INTERVAL_MINUTES * 60))
    logger.info("Scheduler task created for %s", _tickers)


def status() -> dict:
    return {
        "active":   _task is not None and not _task.done(),
        "tickers":  _tickers,
        "count":    len(_tickers),
    }
