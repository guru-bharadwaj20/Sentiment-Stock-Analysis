"""Application entry point.

Start the server:
    uvicorn main:app --reload          (development)
    uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4  (production)
"""
from __future__ import annotations
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from config import CORS_ORIGINS
from db.history import init as init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Sentiment Analyzer",
    description=(
        "Real-time market sentiment analysis aggregating 7 concurrent news sources. "
        "VADER NLP with financial domain lexicon, source-reliability weighting, "
        "deduplication, TTL caching, and SQLite persistence."
    ),
    version="2.0.0",
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

app.include_router(router)


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    logger.info("DB initialized. CORS origins: %s", CORS_ORIGINS)
