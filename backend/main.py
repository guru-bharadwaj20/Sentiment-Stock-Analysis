"""Application entry point.

Start the server:
    uvicorn main:app --reload          (development)
    uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4  (production)
"""
from __future__ import annotations
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import router
from config import CORS_ORIGINS
from db.history import init as init_db
import scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Sentiment Analyzer",
    description=(
        "Real-time market sentiment analysis aggregating 7 concurrent news sources. "
        "VADER NLP (or FinBERT via SENTIMENT_MODEL=finbert) with financial domain lexicon, "
        "0.4/0.6 headline/description weighting, source-reliability scoring, "
        "fuzzy deduplication, TTL caching, SQLite persistence, and background scheduler."
    ),
    version="3.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Standardized error format ──────────────────────────────────

_STATUS_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    422: "VALIDATION_ERROR",
    500: "INTERNAL_ERROR",
}


@app.exception_handler(HTTPException)
async def _http_exc_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        code    = detail.get("code",    _STATUS_CODES.get(exc.status_code, "ERROR"))
        message = detail.get("message", str(exc.detail))
        details = detail.get("details")
    else:
        code    = _STATUS_CODES.get(exc.status_code, "ERROR")
        message = str(detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {"code": code, "message": message, "details": details},
        },
    )


@app.exception_handler(RequestValidationError)
async def _validation_exc_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code":    "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": exc.errors(),
            },
        },
    )


# ── Routes + lifecycle ─────────────────────────────────────────

app.include_router(router)


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    scheduler.start()
    logger.info("DB initialized. CORS origins: %s", CORS_ORIGINS)
