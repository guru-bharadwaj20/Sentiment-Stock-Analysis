"""Background scheduler — periodically refreshes sentiment for predefined tickers.

Behaviour:
- Sleeps SCHEDULER_INTERVAL_MINUTES before the first run so the server is
  fully ready and a user's first request is unaffected.
- Skips tickers that are already fresh in cache (avoids redundant network calls).
- Retries once on failure (60 s delay) before moving on.
- Tracks last_successful_refresh per ticker; exposed via /scheduler/status.
- 30 s pause between tickers to avoid API rate-limiting.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

_task:         Optional[asyncio.Task] = None
_tickers:      list[str] = []
_last_refresh: dict[str, str] = {}   # ticker → ISO timestamp of last successful refresh


async def _loop(tickers: list[str], interval_s: int) -> None:
    logger.info("Scheduler active: %d tickers, interval=%d min", len(tickers), interval_s // 60)
    while True:
        await asyncio.sleep(interval_s)
        for ticker in tickers:
            from services import cache as _cache
            from services.analyzer import analyze_ticker

            # Skip if a fresh result is already cached — save network quota
            if _cache.get(ticker) is not None:
                logger.info("Scheduler: skipping %s (cache hit)", ticker)
                await asyncio.sleep(30)
                continue

            # Try + one retry
            for attempt in range(2):
                try:
                    await analyze_ticker(ticker)
                    _last_refresh[ticker] = datetime.now(timezone.utc).isoformat()
                    logger.info("Scheduler refresh complete: %s", ticker)
                    break
                except Exception as exc:
                    if attempt == 0:
                        logger.warning(
                            "Scheduler %s failed (attempt 1/2), retrying in 60 s: %s",
                            ticker, exc,
                        )
                        await asyncio.sleep(60)
                    else:
                        logger.warning("Scheduler %s failed (attempt 2/2), skipping: %s", ticker, exc)

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
        "active":        _task is not None and not _task.done(),
        "tickers":       _tickers,
        "count":         len(_tickers),
        "last_refresh":  _last_refresh,
    }
