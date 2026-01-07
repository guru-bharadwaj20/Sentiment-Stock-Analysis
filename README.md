# Multi-Source Stock Sentiment Analyzer

A production-ready full-stack application that analyzes stock sentiment from **multiple free data sources** using AI-powered sentiment analysis.

## 🚀 Key Features

**NO API KEYS REQUIRED!** This app uses completely free, public data sources:

- ✅ **Yahoo Finance** - Real-time news and stock data
- ✅ **Google News RSS** - Latest stock-related news articles  
- ✅ **Finnhub** - Financial news aggregator (demo API)
- ✅ **Marketaux** - Market news API (demo tier)
- ✅ **VADER Sentiment** - Advanced sentiment analysis engine

### Why This Approach is Better

❌ **OLD**: Reddit API (requires authentication, rate limits, approval process)  
✅ **NEW**: Multiple free news sources (no auth needed, works immediately!)

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **VADER Sentiment** - Sentiment analysis engine
- **yfinance** - Yahoo Finance data
- **BeautifulSoup4** - Web scraping
- **feedparser** - RSS feed parsing
- **Pydantic v2** - Data validation

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icons

## Features

- ✨ **Multi-source news aggregation** from Yahoo, Google, Finnhub, Marketaux
- 📊 **Real-time sentiment analysis** using VADER
- 🎯 **Weighted scoring** based on article recency
- 📈 **Interactive dashboard** with charts and statistics
- 🔍 **Source attribution** for every news article
- 💰 **Stock information** (price, sector, company name)
- 🎨 **Dark mode UI** with gradient backgrounds
- ⚡ **Zero configuration** - works out of the box!

## Project Structure

```
Sentiment_Stock_Analysis/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── service.py           # Reddit & sentiment logic
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main component
    │   ├── components/
    │   │   └── Dashboard.jsx # Results display
    │   ├── index.css        # Tailwind imports
    │   └── main.jsx         # Entry point
    ├── package.json         # Node dependencies
    └── tailwind.config.js   # Tailwind configuration
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the backend server:
```bash
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

**That's it! No API keys or configuration needed!**

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

1. Ensure both backend and frontend servers are running
2. Open browser at `http://localhost:5173`
3. Enter a stock ticker (e.g., RELIANCE, TCS, INFY)
4. Click "Analyze" and wait for results
5. View sentiment verdict, confidence score, and top comments

## API Endpoints

### GET `/analyze/{ticker}`

Analyzes sentiment for a given stock ticker.

**Response:**
```json
{
  "ticker": "RELIANCE",
  "verdict": "BUY",
  "confidence_score": 65.5,
  "stats": {
    "bullish": 25,
    "bearish": 10,
    "neutral": 15
  },
  "top_comments": [
    {
      "text": "Great earnings report!",
      "score": 0.856,
      "sentiment": "bullish"
    }
  ]
}
```

## Sentiment Algorithm

### Data Sources (All Free!)

1. **Yahoo Finance**: Latest news and stock data via yfinance
2. **Google News RSS**: Stock-related news from Google News
3. **Finnhub API**: Financial news (demo tier, no key needed)
4. **Marketaux API**: Market news aggregator (demo tier)

### Processing Pipeline

1. **News Collection**: Fetch articles from all 4 sources simultaneously
2. **Text Cleaning**: Remove URLs, special characters, normalize text
3. **VADER Analysis**: Calculate compound sentiment score (-1 to +1)
4. **Recency Weighting**: `WeightedScore = compound × log(recency_factor)`
5. **Aggregation**: Average all weighted scores
6. **Verdict Generation**:
   - `> 0.2`: STRONG BUY
   - `> 0.05`: BUY
   - `< -0.05`: SELL
   - `< -0.2`: STRONG SELL
   - Otherwise: HOLD

### Data Quality

- Minimum 5-10 news articles per stock
- Articles from last 7 days
- Source attribution for transparency
- Duplicate removal across sources

## Development

### Backend Testing
```bash
curl http://localhost:8000/analyze/RELIANCE
```

### Frontend Build
```bash
cd frontend
npm run build
```

## License

MIT
