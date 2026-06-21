# Multi-Source Stock Sentiment Analyzer

A full-stack application that delivers real-time stock sentiment analysis by aggregating financial news from seven independent sources and scoring them with VADER NLP, time-decay weighting, and a multi-factor confidence model.

## Overview

The system fetches news concurrently (7 workers), cleans and scores each article with VADER, applies a logarithmic recency weight, then aggregates the result into a single verdict and a rich set of advanced metrics — all returned to a React dashboard in 5–10 seconds.

**Key capabilities:**
- Seven concurrent news sources — no paid API keys required
- VADER sentiment scoring with recency-weighted aggregation
- Multi-factor confidence score (magnitude + consensus + volume + recency)
- Advanced metrics: volatility, momentum, 24h/7d time segments, consensus strength
- Interactive radar, pie, bar, and trend-line charts
- 40+ pre-configured stocks across six global markets
- Mobile-friendly UI with inline stock picker

---

## Tech Stack

### Backend (Python)
| Library | Purpose |
|---------|---------|
| **FastAPI** 0.109 | Async REST API framework |
| **Uvicorn** 0.27 | ASGI server |
| **vaderSentiment** 3.3.2 | NLP sentiment scoring |
| **BeautifulSoup4** 4.12 | HTML parsing / web scraping |
| **feedparser** 6.0 | RSS / Atom feed parsing |
| **requests** 2.31 | Synchronous HTTP client |
| **pydantic** 2.5 | Data validation (FastAPI dependency) |

### Frontend (JavaScript / React)
| Library | Purpose |
|---------|---------|
| **React** 18.3 | Component-based UI |
| **Vite** 7.x | Build tool & dev server |
| **Tailwind CSS** 3.4 | Utility-first styling |
| **Recharts** 2.10 | Radar, pie, bar, line charts |
| **Axios** 1.6 | HTTP client |
| **Lucide React** 0.309 | SVG icon set |

---

## Project Structure

```
Sentiment_Stock_Analysis/
├── backend/
│   ├── main.py          # FastAPI app, CORS, /analyze/{ticker} endpoint
│   ├── service.py       # News fetchers, VADER pipeline, metrics calculation
│   └── requirements.txt # Python dependencies (7 packages)
│
└── frontend/
    ├── src/
    │   ├── App.jsx               # Market selector, search bar, sidebar, layout
    │   ├── main.jsx              # React DOM mount
    │   ├── index.css             # Tailwind directives + custom animations
    │   └── components/
    │       └── Dashboard.jsx     # All charts, verdict card, headlines
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies (~30 MB, no PyTorch required)
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
# → http://localhost:8000
# → API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Both servers must run concurrently. No environment variables or API keys are required for default operation.

### Optional: CORS for multiple origins

```bash
# backend/.env  (or set as env var before running uvicorn)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Usage

1. Open `http://localhost:5173`
2. Select a market (Global, US, India, UK, China, Japan) from the sidebar
3. Click any stock to analyze immediately, **or** type a custom ticker and press **Analyze**
4. Results appear in 5–10 seconds

### Dashboard Sections

| Section | Description |
|---------|-------------|
| **Metric cards** | Avg sentiment, volatility, momentum, consensus |
| **Verdict card** | STRONG BUY / BUY / HOLD / SELL / STRONG SELL with confidence bar |
| **Stock info** | Company name, sector, live price |
| **Radar chart** | 5-dimensional market strength (sentiment, consensus, recency, volume, stability) |
| **Time-based** | 24h vs 7d sentiment averages |
| **Sentiment counts** | Bullish / neutral / bearish article counts with progress bars |
| **Pie chart** | Sentiment distribution |
| **Source breakdown** | Stacked bar chart per news source |
| **Trend line** | Sentiment score across top articles |
| **Headlines** | Article text, source badge, score, recency badge |

---

## API Reference

### `GET /`
Health check — returns API version.

### `GET /analyze/{ticker}`
Full sentiment analysis for a ticker.

**Path parameter:** `ticker` — stock symbol (e.g. `TSLA`, `RELIANCE.NS`)

**Response:**
```json
{
  "ticker": "TSLA",
  "verdict": "BUY",
  "confidence_score": 61.4,
  "stats": { "bullish": 22, "bearish": 6, "neutral": 10 },
  "top_comments": [
    {
      "text": "Tesla reports record deliveries...",
      "score": 0.832,
      "sentiment": "bullish",
      "source": "Google News",
      "time_ago": "3h ago",
      "hours_old": 3.2
    }
  ],
  "stock_info": {
    "name": "Tesla, Inc.",
    "sector": "Consumer Cyclical",
    "current_price": 248.5
  },
  "advanced_stats": {
    "avg_sentiment": 0.2341,
    "volatility": 0.1823,
    "momentum": 0.0954,
    "sentiment_24h": 0.2780,
    "sentiment_7d": 0.2010,
    "articles_24h": 14,
    "articles_7d": 38,
    "bullish_ratio": 0.579,
    "bearish_ratio": 0.158,
    "consensus_strength": 0.579
  }
}
```

**Verdict thresholds (weighted sentiment average):**

| Range | Verdict |
|-------|---------|
| > 0.20 | STRONG BUY |
| 0.05 – 0.20 | BUY |
| −0.05 – 0.05 | HOLD |
| −0.20 – −0.05 | SELL |
| < −0.20 | STRONG SELL |

---

## Sentiment Analysis Methodology

### Pipeline

```
7 news sources (parallel)
        │
        ▼
  Clean text (strip URLs, special chars)
        │
        ▼
  VADER compound score  [-1.0, +1.0]
        │
        ▼
  Recency weight = log(max(1, 7 - days_old) + 1)
  weighted_score = compound × recency_weight
        │
        ▼
  Aggregate → verdict + advanced metrics
```

### Confidence Score

Combines four factors (weights in parentheses):

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Signal magnitude | 35% | `min(abs(avg_sentiment) × 2, 1.0)` |
| Consensus | 35% | `max(bullish%, bearish%)` |
| Volume | 20% | `min(article_count / 30, 1.0)` |
| Recency | 10% | `min(articles_24h / articles_7d × 2, 1.0)` |

Result scaled to 0–100%.

### News Sources

| Source | Method |
|--------|--------|
| Google News | RSS feed |
| Bing News | RSS feed |
| Yahoo Finance | Web scrape (BeautifulSoup) |
| Finnhub | REST API (demo tier) |
| Marketaux | REST API (free tier) |
| Seeking Alpha | RSS feed |
| Alpha Vantage | REST API (demo tier) |

Each source has a 5-second timeout; failures are logged and skipped gracefully.

---

## Development

```bash
# Backend tests
curl http://localhost:8000/
curl http://localhost:8000/analyze/TSLA
curl http://localhost:8000/analyze/RELIANCE.NS

# Frontend
cd frontend
npm run dev      # dev server with HMR
npm run build    # production bundle → dist/
npm run preview  # preview production build
npm run lint     # ESLint
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend won't start | Activate venv; run `pip install -r requirements.txt` |
| CORS error in browser | Confirm both servers are on ports 8000 and 5173 |
| "Insufficient data" verdict | Ticker may have limited news; try a major ticker first |
| Stale news / 0 articles | Some demo API tiers rate-limit; retry after a minute |

---

## Deployment

**Backend (production):**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd frontend && npm run build
# Deploy dist/ to Vercel, Netlify, or any static host
```

Set `CORS_ORIGINS` to the deployed frontend URL before starting the backend.

---

## License

MIT — see [LICENSE](LICENSE).

## Author

**Guru R Bharadwaj**
- GitHub: [@guru-bharadwaj20](https://github.com/guru-bharadwaj20)
- LinkedIn: [guru-r-bharadwaj](https://www.linkedin.com/in/guru-r-bharadwaj/)
