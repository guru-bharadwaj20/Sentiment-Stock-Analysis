"""FastAPI route definitions."""
from __future__ import annotations
import logging

from fastapi import APIRouter, HTTPException, Path, Query

from models.schemas import AnalysisResponse, HealthResponse, HistoryAnalytics
from services import cache as _cache
from services.analyzer import analyze_ticker
from services.sentiment import get_model_name
from db import history as db
import scheduler

logger = logging.getLogger(__name__)

router = APIRouter()

_TICKER_EXAMPLE = {
    "TSLA": {
        "summary": "Tesla Inc. — electric vehicles",
        "value": {"ticker": "TSLA"},
    },
    "AAPL": {
        "summary": "Apple Inc.",
        "value": {"ticker": "AAPL"},
    },
}


@router.get(
    "/",
    response_model=HealthResponse,
    tags=["Health"],
    summary="API health check",
    openapi_extra={
        "responses": {
            "200": {
                "content": {
                    "application/json": {
                        "example": {
                            "status": "ok",
                            "version": "3.0.0",
                            "cache_entries": 2,
                            "sentiment_model": "vader",
                        }
                    }
                }
            }
        }
    },
)
async def health():
    return HealthResponse(
        status="ok",
        version="3.0.0",
        cache_entries=_cache.size(),
        sentiment_model=get_model_name(),
    )


@router.get(
    "/analyze/{ticker}",
    response_model=AnalysisResponse,
    tags=["Analysis"],
    summary="Analyze market sentiment for a stock ticker",
    responses={
        400: {
            "description": "Invalid ticker symbol",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "INVALID_TICKER",
                            "message": "Ticker contains invalid characters: @",
                            "details": None,
                        },
                    }
                }
            },
        },
        500: {
            "description": "Analysis pipeline failed",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "ANALYSIS_FAILED",
                            "message": "Analysis failed: connection timeout",
                            "details": None,
                        },
                    }
                }
            },
        },
    },
    openapi_extra={
        "responses": {
            "200": {
                "content": {
                    "application/json": {
                        "example": {
                            "ticker": "TSLA",
                            "verdict": "BUY",
                            "confidence_score": 61.4,
                            "model_used": "vader",
                            "verdict_reasons": [
                                "72% of articles are bullish",
                                "Average sentiment is moderately positive (+0.18)",
                                "Strong consensus across news sources",
                            ],
                            "cached": False,
                            "cache_meta": {"age_s": 0.0, "expires_in_s": 300.0},
                            "timing": {
                                "fetch_s": 2.1,
                                "dedup_ms": 3.2,
                                "scoring_ms": 8.1,
                                "aggregation_ms": 1.4,
                                "total_s": 2.14,
                            },
                        }
                    }
                }
            }
        }
    },
)
async def analyze_stock(
    ticker: str = Path(
        ...,
        min_length=1,
        max_length=15,
        description="Stock ticker symbol (e.g. TSLA, RELIANCE.NS)",
        examples=_TICKER_EXAMPLE,
    ),
):
    ticker = ticker.upper().strip()

    invalid_chars = set(ticker) - set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-")
    if invalid_chars:
        raise HTTPException(
            status_code=400,
            detail={
                "code":    "INVALID_TICKER",
                "message": f"Ticker contains invalid characters: {', '.join(sorted(invalid_chars))}",
                "details": None,
            },
        )

    logger.info("Analysis requested: %s", ticker)
    try:
        result = await analyze_ticker(ticker)
        return result
    except Exception as exc:
        logger.exception("Analysis failed for %s", ticker)
        raise HTTPException(
            status_code=500,
            detail={
                "code":    "ANALYSIS_FAILED",
                "message": f"Analysis failed: {exc}",
                "details": None,
            },
        ) from exc


@router.get(
    "/history/{ticker}",
    tags=["History"],
    summary="Return the last N analysis runs for a ticker",
    openapi_extra={
        "responses": {
            "200": {
                "content": {
                    "application/json": {
                        "example": {
                            "ticker": "TSLA",
                            "history": [
                                {
                                    "timestamp": "2026-06-21T14:00:00+00:00",
                                    "verdict": "BUY",
                                    "confidence_score": 61.4,
                                    "avg_sentiment": 0.182,
                                }
                            ],
                        }
                    }
                }
            }
        }
    },
)
async def get_history(
    ticker: str = Path(..., min_length=1, max_length=15),
    limit: int = Query(8, ge=1, le=50, description="Max number of history entries to return"),
):
    ticker = ticker.upper().strip()
    return {"ticker": ticker, "history": db.get_history(ticker, limit=limit)}


@router.get(
    "/analytics/{ticker}",
    response_model=HistoryAnalytics,
    tags=["History"],
    summary="Rolling analytics over historical runs (up to 30 runs)",
    responses={404: {"description": "No history found for ticker"}},
    openapi_extra={
        "responses": {
            "200": {
                "content": {
                    "application/json": {
                        "example": {
                            "total_runs": 12,
                            "rolling_7d_avg_sentiment": 0.142,
                            "rolling_30d_avg_sentiment": 0.098,
                            "avg_confidence": 54.3,
                            "best_run": {
                                "timestamp": "2026-06-20T10:00:00+00:00",
                                "sentiment": 0.312,
                                "verdict": "STRONG BUY",
                            },
                            "worst_run": {
                                "timestamp": "2026-06-15T08:00:00+00:00",
                                "sentiment": -0.071,
                                "verdict": "SELL",
                            },
                            "verdict_distribution": {"BUY": 7, "HOLD": 3, "SELL": 2},
                            "moving_avg_series": [0.09, 0.11, 0.13, 0.14],
                        }
                    }
                }
            }
        }
    },
)
async def get_analytics(
    ticker: str = Path(..., min_length=1, max_length=15),
):
    ticker = ticker.upper().strip()
    data = db.get_analytics(ticker)
    if not data:
        raise HTTPException(
            status_code=404,
            detail={
                "code":    "NO_HISTORY",
                "message": f"No analysis history found for {ticker}",
                "details": None,
            },
        )
    return data


@router.delete(
    "/cache",
    tags=["Admin"],
    summary="Clear the in-memory sentiment cache",
    openapi_extra={
        "responses": {
            "200": {
                "content": {
                    "application/json": {"example": {"message": "Cache cleared"}}
                }
            }
        }
    },
)
async def clear_cache():
    _cache.clear()
    return {"message": "Cache cleared"}


@router.get(
    "/scheduler/status",
    tags=["Admin"],
    summary="Background scheduler state including per-ticker last refresh",
    openapi_extra={
        "responses": {
            "200": {
                "content": {
                    "application/json": {
                        "example": {
                            "active": True,
                            "tickers": ["TSLA", "AAPL", "NVDA"],
                            "count": 3,
                            "last_refresh": {
                                "TSLA": "2026-06-21T13:00:00+00:00",
                                "AAPL": "2026-06-21T13:00:30+00:00",
                            },
                        }
                    }
                }
            }
        }
    },
)
async def get_scheduler_status():
    return scheduler.status()
