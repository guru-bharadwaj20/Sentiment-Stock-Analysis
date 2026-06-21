import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from service import analyze_ticker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Sentiment Analyzer API",
    description="Real-time stock sentiment analysis from 7 concurrent news sources",
    version="1.0.0",
)

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Stock Sentiment Analyzer API is running", "version": "1.0.0"}


@app.get("/analyze/{ticker}")
async def analyze_stock(ticker: str):
    ticker = ticker.upper().strip()

    if not ticker or len(ticker) > 15:
        raise HTTPException(status_code=400, detail="Invalid ticker symbol")

    try:
        logger.info("Analysis requested for %s", ticker)
        result = analyze_ticker(ticker)
        return {"ticker": ticker, **result}
    except Exception as e:
        logger.error("Analysis failed for %s: %s", ticker, e)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
