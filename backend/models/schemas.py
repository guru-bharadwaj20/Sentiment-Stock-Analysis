"""Pydantic response models — single source of truth for the API contract."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class ArticleResult(BaseModel):
    text: str = Field(..., description="Headline text (up to 200 chars)")
    score: float = Field(..., ge=-1.0, le=1.0, description="VADER compound score")
    sentiment: str = Field(..., description="bullish | bearish | neutral")
    source: str
    source_weight: float = Field(..., description="Reliability weight 0–1")
    time_ago: str = Field(..., description="Human-readable recency (e.g. '3h ago')")
    hours_old: float
    url: Optional[str] = Field(None, description="Original article URL if available")


class Stats(BaseModel):
    bullish: int
    bearish: int
    neutral: int


class StockInfo(BaseModel):
    name: str
    sector: str
    current_price: float


class AdvancedStats(BaseModel):
    avg_sentiment: float = Field(..., description="Mean VADER compound score")
    weighted_sentiment: float = Field(..., description="Source-reliability-weighted mean")
    volatility: float = Field(..., description="Std-dev of compound scores")
    momentum: float = Field(..., description="Latest 3 avg − earliest 3 avg")
    sentiment_24h: float
    sentiment_7d: float
    articles_24h: int
    articles_7d: int
    bullish_ratio: float
    bearish_ratio: float
    neutral_ratio: float
    consensus_strength: float = Field(..., description="max(bullish_ratio, bearish_ratio)")
    avg_article_age_hours: float
    total_articles: int
    deduplicated_count: int


class TrendData(BaseModel):
    direction: str = Field(..., description="improving | deteriorating | stable | new")
    sentiment_delta: float
    confidence_delta: float
    prev_verdict: Optional[str]
    verdict_changed: bool


class SourceContribution(BaseModel):
    articles: int
    avg_sentiment: float
    contribution_pct: float


class SourceHealth(BaseModel):
    name: str
    status: str = Field(..., description="ok | error")
    duration_ms: int
    articles: int
    error: Optional[str] = None


class AnalysisMeta(BaseModel):
    articles_raw: int
    duplicates_removed: int
    sources_succeeded: int
    sources_total: int
    cached: bool


class TimingInfo(BaseModel):
    fetch_s: float
    dedup_ms: float
    scoring_ms: float
    aggregation_ms: float
    total_s: float


class HistoryEntry(BaseModel):
    timestamp: str
    verdict: str
    confidence_score: float
    avg_sentiment: float


class AnalysisResponse(BaseModel):
    ticker: str
    verdict: str
    confidence_score: float = Field(..., ge=0.0, le=100.0)
    verdict_reasons: list[str]
    stats: Stats
    top_comments: list[ArticleResult]
    stock_info: Optional[StockInfo] = None
    advanced_stats: Optional[AdvancedStats] = None
    trend: Optional[TrendData] = None
    source_contributions: dict[str, SourceContribution] = {}
    source_health: list[SourceHealth] = []
    meta: Optional[AnalysisMeta] = None
    timing: Optional[TimingInfo] = None
    history: list[HistoryEntry] = []
    cached: bool = False


class HealthResponse(BaseModel):
    status: str
    version: str
    cache_entries: int
