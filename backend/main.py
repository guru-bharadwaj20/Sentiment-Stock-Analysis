from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from service import analyze_ticker

app = FastAPI(title="Stock Sentiment Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_DATA = {
    "TSLA": {
        "verdict": "STRONG BUY",
        "confidence_score": 78.5,
        "stats": {"bullish": 42, "bearish": 8, "neutral": 15},
        "top_comments": [
            {"text": "Tesla's production numbers are through the roof! Q4 delivery beat expectations significantly.", "score": 0.891, "sentiment": "bullish"},
            {"text": "FSD Beta is getting really impressive. Tried it yesterday and was blown away by the improvements.", "score": 0.847, "sentiment": "bullish"},
            {"text": "Energy division revenue up 120% YoY. This is becoming a major profit center.", "score": 0.823, "sentiment": "bullish"},
            {"text": "Competition is heating up but Tesla still has the tech advantage and scale.", "score": 0.756, "sentiment": "bullish"},
            {"text": "Cybertruck orders exceeding expectations. Pre-orders at all-time high.", "score": 0.734, "sentiment": "bullish"},
            {"text": "Stock might be overvalued short term, taking some profits here.", "score": -0.456, "sentiment": "bearish"},
            {"text": "Great company but valuation seems stretched at current levels.", "score": -0.378, "sentiment": "bearish"},
            {"text": "Holding long term. Musk's vision continues to deliver results.", "score": 0.689, "sentiment": "bullish"}
        ]
    },
    "GME": {
        "verdict": "BUY",
        "confidence_score": 62.3,
        "stats": {"bullish": 35, "bearish": 12, "neutral": 18},
        "top_comments": [
            {"text": "Ryan Cohen's strategy is paying off. E-commerce growth is solid.", "score": 0.812, "sentiment": "bullish"},
            {"text": "Fundamentals improving quarter over quarter. Real turnaround story.", "score": 0.776, "sentiment": "bullish"},
            {"text": "Diamond hands! This company is transforming into something special.", "score": 0.745, "sentiment": "bullish"},
            {"text": "New partnership announcements looking promising for future revenue.", "score": 0.698, "sentiment": "bullish"},
            {"text": "Still overvalued compared to earnings. Waiting for better entry point.", "score": -0.512, "sentiment": "bearish"},
            {"text": "Retail stores closing but online sales compensating well.", "score": 0.234, "sentiment": "neutral"}
        ]
    },
    "AAPL": {
        "verdict": "BUY",
        "confidence_score": 71.2,
        "stats": {"bullish": 38, "bearish": 10, "neutral": 20},
        "top_comments": [
            {"text": "iPhone 16 sales exceeding projections. Services revenue hitting new records.", "score": 0.865, "sentiment": "bullish"},
            {"text": "Apple Vision Pro adoption better than expected. This could be huge.", "score": 0.834, "sentiment": "bullish"},
            {"text": "Dividend increase and buyback program shows strong cash position.", "score": 0.798, "sentiment": "bullish"},
            {"text": "Warren Buffett continues to hold massive position. That says something.", "score": 0.756, "sentiment": "bullish"},
            {"text": "China sales declining slightly but overall global growth solid.", "score": 0.145, "sentiment": "neutral"},
            {"text": "Stock feels expensive at these levels but quality always costs premium.", "score": 0.023, "sentiment": "neutral"}
        ]
    },
    "NVDA": {
        "verdict": "STRONG BUY",
        "confidence_score": 85.7,
        "stats": {"bullish": 48, "bearish": 5, "neutral": 12},
        "top_comments": [
            {"text": "AI chip demand is absolutely insane. They can't manufacture fast enough.", "score": 0.923, "sentiment": "bullish"},
            {"text": "Data center revenue grew 300% YoY. This is unprecedented growth.", "score": 0.901, "sentiment": "bullish"},
            {"text": "Every major tech company scrambling to get their GPUs. Total dominance.", "score": 0.887, "sentiment": "bullish"},
            {"text": "New Blackwell architecture pre-orders already sold out for next year.", "score": 0.856, "sentiment": "bullish"},
            {"text": "Partnership with OpenAI, Microsoft, Google - basically powering entire AI revolution.", "score": 0.834, "sentiment": "bullish"},
            {"text": "Gaming segment still strong despite focus shifting to enterprise.", "score": 0.789, "sentiment": "bullish"},
            {"text": "Stock split making it more accessible to retail investors. Smart move.", "score": 0.745, "sentiment": "bullish"}
        ]
    }
}

@app.get("/")
async def root():
    return {"message": "Stock Sentiment Analyzer API is running"}

@app.get("/demo/{ticker}")
async def demo_analyze(ticker: str):
    ticker = ticker.upper().strip()
    
    if ticker in DEMO_DATA:
        return {
            "ticker": ticker,
            **DEMO_DATA[ticker]
        }
    else:
        return {
            "ticker": ticker,
            "verdict": "HOLD",
            "confidence_score": 45.0,
            "stats": {"bullish": 15, "bearish": 12, "neutral": 18},
            "top_comments": [
                {"text": "This is demo data. Configure Reddit API for real analysis.", "score": 0.0, "sentiment": "neutral"},
                {"text": "Waiting for market to show clearer direction before taking position.", "score": 0.123, "sentiment": "neutral"},
                {"text": "Fundamentals look okay but nothing exciting at current valuation.", "score": 0.045, "sentiment": "neutral"}
            ]
        }

@app.get("/analyze/{ticker}")
async def analyze_stock(ticker: str):
    try:
        ticker = ticker.upper().strip()
        
        if not ticker or len(ticker) > 10:
            raise HTTPException(status_code=400, detail="Invalid ticker symbol")
        
        result = analyze_ticker(ticker)
        
        return {
            "ticker": ticker,
            "verdict": result['verdict'],
            "confidence_score": result['confidence_score'],
            "stats": result['stats'],
            "top_comments": result['top_comments']
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")