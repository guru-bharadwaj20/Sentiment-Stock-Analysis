"""FastAPI route definitions."""
from __future__ import annotations
import logging

from fastapi import APIRouter, HTTPException, Path

from models.schemas import AnalysisResponse, HealthResponse
from services import cache as _cache
from services.analyzer import analyze_ticker
from db import history as db
import scheduler

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=HealthResponse, tags=["Health"])
async def health():
    return HealthResponse(
        status="ok",
        version="3.0.0",
        cache_entries=_cache.size(),
    )


@router.get(
    "/analyze/{ticker}",
    response_model=AnalysisResponse,
    tags=["Analysis"],
    summary="Analyze market sentiment for a stock ticker",
    responses={
        400: {"description": "Invalid ticker symbol"},
        500: {"description": "Analysis failed"},
    },
)
async def analyze_stock(
    ticker: str = Path(
        ...,
        min_length=1,
        max_length=15,
        description="Stock ticker symbol (e.g. TSLA, RELIANCE.NS)",
        example="TSLA",
    ),
):
    ticker = ticker.upper().strip()

    invalid_chars = set(ticker) - set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-")
    if invalid_chars:
        raise HTTPException(
            status_code=400,
            detail=f"Ticker contains invalid characters: {', '.join(sorted(invalid_chars))}",
        )

    logger.info("Analysis requested: %s", ticker)
    try:
        result = await analyze_ticker(ticker)
        return result
    except Exception as exc:
        logger.exception("Analysis failed for %s", ticker)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


@router.get(
    "/history/{ticker}",
    tags=["History"],
    summary="Return the last N analysis runs for a ticker",
)
async def get_history(
    ticker: str = Path(..., min_length=1, max_length=15),
    limit: int = 8,
):
    ticker = ticker.upper().strip()
    return {"ticker": ticker, "history": db.get_history(ticker, limit=limit)}


@router.delete("/cache", tags=["Admin"], summary="Clear the in-memory sentiment cache")
async def clear_cache():
    _cache.clear()
    return {"message": "Cache cleared"}


@router.get("/scheduler/status", tags=["Admin"], summary="Background scheduler state")
async def get_scheduler_status():
    return scheduler.status()
