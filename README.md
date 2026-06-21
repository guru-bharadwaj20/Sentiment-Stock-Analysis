# Stock Sentiment Analyzer

> Real-time market sentiment analysis aggregating 7 concurrent news sources with VADER NLP, source-reliability weighting, deduplication, TTL caching, and SQLite persistence.

---

## Overview

The system fetches news in parallel from 7 independent sources, deduplicates repeated stories, scores each article with a financial-domain-enhanced VADER model, and aggregates the results into a single verdict with detailed reasoning — all within 5–10 seconds.

**What makes it technically interesting:**

| Feature | Implementation |
|---------|---------------|
| Concurrent I/O | `httpx.AsyncClient` + `asyncio.gather` across 7 sources |
| Deduplication | Normalized-title MD5 hashing to eliminate wire-duplicated stories |
| Source weighting | Per-source reliability multiplier applied before aggregation |
| Financial NLP | VADER lexicon extended with 40+ financial domain terms |
| Confidence model | 6-factor weighted formula (magnitude, consensus, volume, reliability, recency, stability) |
| Caching | In-process TTL cache (5 min) — repeated queries never hit the network |
| Persistence | SQLite history — verdict trend visible across analysis runs |
| Type safety | Full Pydantic response models on the API; structured logging throughout |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  React 18 Frontend  (Vite · Tailwind CSS · Recharts)             │
│                                                                  │
│  useAnalysis hook  →  api.js  →  POST /analyze/{ticker}          │
└──────────────────────┬───────────────────────────────────────────┘
                       │ JSON
┌──────────────────────▼───────────────────────────────────────────┐
│  FastAPI  (uvicorn)                                              │
│                                                                  │
│  /analyze/{ticker}                                               │
│      │                                                           │
│      ├─ TTL cache hit? → return immediately                      │
│      │                                                           │
│      └─ asyncio.gather ─────────────────────────────────────┐   │
│              │                                              │   │
│    ┌─────────▼─────────────────────────────────────────┐   │   │
│    │  7 httpx.AsyncClient fetchers (concurrent)        │   │   │
│    │  Google RSS · Bing RSS · Yahoo scrape             │   │   │
│    │  Finnhub API · Marketaux API                      │   │   │
│    │  Seeking Alpha RSS · Alpha Vantage API            │   │   │
│    └─────────┬─────────────────────────────────────────┘   │   │
│              │ raw articles                                │   │
│              ▼                                              │   │
│    deduplicate (MD5 title hash)                             │   │
│              │                                              │   │
│              ▼                                              │   │
│    VADER score × recency_weight × source_weight             │   │
│              │                                              │   │
│              ▼                                              │   │
│    aggregate → verdict + confidence + reasons               │   │
│              │                                              │   │
│    SQLite (sentiment_history.db) ◄──────────────────────────┘   │
│    TTL cache ← set                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| | |
|--|--|
| **FastAPI 0.109** | Async REST framework |
| **Uvicorn** | ASGI server |
| **httpx 0.26** | Async HTTP client — replaces requests + ThreadPoolExecutor |
| **vaderSentiment 3.3** | NLP engine, extended with 40+ financial lexicon entries |
| **BeautifulSoup4** | Yahoo Finance HTML parsing |
| **feedparser 6.0** | RSS/Atom parsing (Google, Bing, Seeking Alpha) |
| **pydantic 2.5** | Request validation + response models |
| **sqlite3** | stdlib — no ORM overhead |

### Frontend

| | |
|--|--|
| **React 18** | UI framework |
| **Vite 7** | Build tool |
| **Tailwind CSS 3** | Styling |
| **Recharts 2** | Radar, pie, bar, and line charts |
| **Axios** | HTTP client |
| **Lucide React** | Icons |

---

## Project Structure

```
Sentiment_Stock_Analysis/
│
├── backend/
│   ├── main.py               # FastAPI app + CORS + startup
│   ├── config.py             # All constants and source weights
│   ├── requirements.txt
│   │
│   ├── api/
│   │   └── routes.py         # /analyze, /history, /cache
│   │
│   ├── models/
│   │   └── schemas.py        # Pydantic response models
│   │
│   ├── fetchers/
│   │   └── sources.py        # 7 async httpx fetchers + fetch_all()
│   │
│   ├── services/
│   │   ├── analyzer.py       # Orchestration: fetch → dedup → score → cache → persist
│   │   ├── sentiment.py      # VADER scoring, financial lexicon, recency weighting
│   │   ├── cache.py          # TTL in-memory cache
│   │   └── dedup.py          # Normalized-title deduplication
│   │
│   └── db/
│       └── history.py        # SQLite persistence
│
└── frontend/
    └── src/
        ├── App.jsx                       # Composition root
        ├── main.jsx
        ├── index.css
        │
        ├── constants/
        │   └── stocks.js                 # 40+ stocks across 6 markets
        │
        ├── services/
        │   └── api.js                    # Axios wrappers
        │
        ├── hooks/
        │   └── useAnalysis.js            # Analysis state + progress phases
        │
        └── components/
            ├── SearchBar.jsx
            ├── Sidebar.jsx               # Desktop + mobile variants
            ├── LoadingSkeleton.jsx       # Animated placeholder dashboard
            └── Dashboard/
                ├── index.jsx             # Composition
                ├── VerdictCard.jsx       # Verdict + confidence + reasons + stock info
                ├── MetricCards.jsx       # 4 KPI cards + bull/neutral/bear bars
                ├── Charts.jsx            # Radar, time-based, pie, source, trend, history
                └── Headlines.jsx         # Clickable headlines with source/recency badges
```

---

## Installation

### Prerequisites

- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # macOS / Linux
venv\Scripts\activate          # Windows

# Install dependencies (~30 MB, no PyTorch)
pip install -r requirements.txt

# Start
uvicorn main:app --reload
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

Both servers must run simultaneously. No API keys required.

### Environment variables (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins |
| `CACHE_TTL` | `300` | Cache TTL in seconds |
| `DB_PATH` | `sentiment_history.db` | SQLite file path |
| `FETCH_TIMEOUT_CONNECT` | `4` | httpx connect timeout (s) |
| `FETCH_TIMEOUT_READ` | `7` | httpx read timeout (s) |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL for the frontend |

---

## API Reference

### `GET /`
Health check.

```json
{ "status": "ok", "version": "2.0.0", "cache_entries": 3 }
```

### `GET /analyze/{ticker}`

Full sentiment analysis. Cached for 5 minutes per ticker.

**Path param:** `ticker` — 1–15 chars, letters/digits/`.`/`-` only.

**Response:**
```json
{
  "ticker": "TSLA",
  "verdict": "BUY",
  "confidence_score": 64.3,
  "verdict_reasons": [
    "71% of articles are bullish",
    "Average sentiment is moderately positive (+0.18)",
    "Positive momentum — recent articles more bullish than older ones",
    "Active recent coverage (12 articles in last 24 h)"
  ],
  "stats": { "bullish": 22, "bearish": 6, "neutral": 3 },
  "top_comments": [{
    "text": "Tesla Q2 deliveries beat expectations by 8%",
    "score": 0.847,
    "sentiment": "bullish",
    "source": "Finnhub",
    "source_weight": 1.0,
    "time_ago": "2h ago",
    "hours_old": 2.1,
    "url": "https://..."
  }],
  "stock_info": { "name": "Tesla, Inc.", "sector": "Consumer Cyclical", "current_price": 248.5 },
  "advanced_stats": {
    "avg_sentiment": 0.2341,
    "weighted_sentiment": 0.3812,
    "volatility": 0.1613,
    "momentum": 0.0954,
    "sentiment_24h": 0.2780,
    "sentiment_7d": 0.2010,
    "articles_24h": 12,
    "articles_7d": 31,
    "bullish_ratio": 0.710,
    "bearish_ratio": 0.194,
    "neutral_ratio": 0.097,
    "consensus_strength": 0.710,
    "avg_article_age_hours": 18.4,
    "total_articles": 31,
    "deduplicated_count": 31
  },
  "history": [
    { "timestamp": "2026-06-21T08:12:00+00:00", "verdict": "BUY", "confidence_score": 61.2, "avg_sentiment": 0.21 }
  ],
  "cached": false
}
```

### `GET /history/{ticker}?limit=8`
Returns previous analysis runs for a ticker from SQLite.

### `DELETE /cache`
Clears the in-memory TTL cache.

---

## Sentiment Analysis Methodology

### Pipeline

```
7 sources (asyncio.gather)
    │
    ▼ raw articles (titles + summaries + timestamps)
deduplicate (MD5 of normalized title)
    │
    ▼ unique articles
for each article:
    clean_text() → strip URLs, HTML, normalize unicode
    VADER compound score  c ∈ [-1.0, 1.0]  (financial lexicon applied)
    if |c| < 0.02: discard
    recency_mult = log(max(1, 7 - days_old) + 1)   # 0.69 – 2.08
    source_weight = SOURCE_WEIGHTS[source]           # 0.75 – 1.00
    weighted = c × recency_mult × source_weight
    │
    ▼ scored articles
aggregate metrics
    │
    ▼
verdict  (based on mean weighted score)
confidence (6-factor formula)
reasons  (rule-based text generation)
    │
SQLite persist  →  cache set  →  return
```

### Verdict thresholds (mean weighted score)

| Range | Verdict |
|-------|---------|
| > 0.20 | STRONG BUY |
| 0.05 – 0.20 | BUY |
| −0.05 – 0.05 | HOLD |
| −0.20 – −0.05 | SELL |
| < −0.20 | STRONG SELL |

### Source reliability weights

| Source | Weight | Rationale |
|--------|--------|-----------|
| Finnhub | 1.00 | Financial-specific news API |
| Alpha Vantage | 0.95 | Financial news with metadata |
| Yahoo Finance | 0.90 | High-quality financial publisher |
| Seeking Alpha | 0.85 | Analyst commentary, slightly opinion-heavy |
| Google News | 0.80 | General aggregator with broad financial coverage |
| Bing News | 0.75 | General aggregator |
| Marketaux | 0.75 | Newer aggregator, less established |

### Confidence formula

```
confidence = (
    min(|avg_sentiment| × 2, 1.0)     × 0.35   # signal magnitude
  + max(bullish%, bearish%)             × 0.25   # consensus
  + min(total_articles / 30, 1.0)      × 0.15   # volume
  + avg_source_weight                   × 0.10   # source quality
  + min(articles_24h / articles_7d × 2, 1.0) × 0.10  # recency
  + max(0, 1 - volatility × 2)         × 0.05   # stability
) × 100
```

### Financial lexicon additions to VADER

40+ terms added with custom polarity values:

- **Bullish:** *beat, outperform, upgrade, buyback, rally, surge, breakout, growth, profit, exceed, optimistic, partnership, ipo …*
- **Bearish:** *miss, downgrade, lawsuit, fraud, bankruptcy, recall, plunge, layoffs, investigation, loss, warning, sanction, default …*

---

## Features

### Backend
- Fully async (FastAPI + httpx + asyncio) — no blocking I/O
- 7 concurrent news sources with independent timeouts
- Title-hash deduplication across sources
- Source-reliability weighted sentiment aggregation
- Financial-domain VADER lexicon (40+ custom terms)
- 6-factor confidence score with documented formula
- Verdict + human-readable reasoning bullets
- TTL in-memory cache (5 min, configurable)
- SQLite analysis history per ticker
- Pydantic v2 response models
- Structured logging throughout
- Graceful degradation — source failures never stop the pipeline

### Frontend
- Animated skeleton loader mirroring the dashboard layout
- Live progress phase messages during analysis
- Click-to-analyze stock sidebar (desktop + mobile)
- Verdict card with confidence progress bar + reasoning bullets
- Clickable headlines linking to original articles
- Source reliability stars on each headline
- Radar, pie, bar, trend-line charts (Recharts)
- Previous runs history panel
- Responsive — full sidebar on desktop, collapsible panel on mobile
- Accessible: ARIA labels, keyboard navigation, focus states

---

## Development

```bash
# Backend
cd backend
uvicorn main:app --reload          # http://localhost:8000/docs for Swagger

# Frontend
cd frontend
npm run dev       # HMR dev server
npm run build     # Production bundle → dist/
npm run preview   # Preview production build
npm run lint      # ESLint
```

---

## Deployment

**Backend**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
# Set CORS_ORIGINS to your deployed frontend URL
```

**Frontend**
```bash
cd frontend
VITE_API_URL=https://your-api.example.com npm run build
# Deploy dist/ to Vercel, Netlify, Cloudflare Pages, or any static host
```

---

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Async HTTP | httpx + asyncio.gather | True async I/O; shared connection pool; cleaner than ThreadPoolExecutor + requests |
| Sentiment model | VADER + financial lexicon | FinBERT is 100–500× slower without a GPU; VADER at ~1 ms/article is sufficient for this workload |
| Storage | SQLite (stdlib) | No ORM overhead; single-file deployment; sufficient for historical trend display |
| Cache | In-process TTL dict | Redis would be overkill; in-process cache is zero-latency and trivially correct at 1-worker scale |
| Dedup | MD5 of normalized title | Fuzzy matching is slower and unnecessary; exact-title collisions catch 95%+ of wire-duplicate stories |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend won't start | Activate venv; `pip install -r requirements.txt` |
| CORS error | Both servers on 8000 and 5173; check `CORS_ORIGINS` env var |
| `INSUFFICIENT DATA` verdict | Ticker has limited coverage; try TSLA or AAPL first |
| Slow responses | Some demo API tiers rate-limit; first request after cache expiry takes 5–10 s |
| SQLite locked | Only one uvicorn worker should write; use `--workers 1` in dev |

---

## License

MIT — see [LICENSE](LICENSE).

## Author

**Guru R Bharadwaj**  
[GitHub @guru-bharadwaj20](https://github.com/guru-bharadwaj20) · [LinkedIn](https://www.linkedin.com/in/guru-r-bharadwaj/)
