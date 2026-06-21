import { useState, useCallback } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import {
  Search, Loader2, TrendingUp, BarChart3, Newspaper,
  Heart, Github, Linkedin, Globe, Star, Activity, ChevronDown, ChevronUp
} from 'lucide-react';

const STOCK_DATA = {
  'Global': [
    { symbol: 'TSLA',  name: 'Tesla Inc.',        sector: 'EV' },
    { symbol: 'AAPL',  name: 'Apple Inc.',         sector: 'Technology' },
    { symbol: 'NVDA',  name: 'NVIDIA Corp.',        sector: 'Semiconductors' },
    { symbol: 'MSFT',  name: 'Microsoft Corp.',     sector: 'Software' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.',       sector: 'Internet' },
    { symbol: 'AMZN',  name: 'Amazon.com Inc.',     sector: 'E-commerce' },
    { symbol: 'META',  name: 'Meta Platforms',      sector: 'Social Media' },
    { symbol: 'AMD',   name: 'AMD Inc.',            sector: 'Semiconductors' },
  ],
  'United States': [
    { symbol: 'TSLA', name: 'Tesla Inc.',        sector: 'EV' },
    { symbol: 'AAPL', name: 'Apple Inc.',         sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.',        sector: 'Semiconductors' },
    { symbol: 'MSFT', name: 'Microsoft Corp.',     sector: 'Software' },
    { symbol: 'JPM',  name: 'JPMorgan Chase',      sector: 'Banking' },
    { symbol: 'V',    name: 'Visa Inc.',           sector: 'Payments' },
    { symbol: 'WMT',  name: 'Walmart Inc.',        sector: 'Retail' },
    { symbol: 'DIS',  name: 'Walt Disney',         sector: 'Entertainment' },
  ],
  'India': [
    { symbol: 'RELIANCE.NS',  name: 'Reliance Industries', sector: 'Conglomerate' },
    { symbol: 'TCS.NS',       name: 'Tata Consultancy',    sector: 'IT Services' },
    { symbol: 'INFY',         name: 'Infosys Ltd.',         sector: 'IT Services' },
    { symbol: 'HDFCBANK.NS',  name: 'HDFC Bank',            sector: 'Banking' },
    { symbol: 'TATAMOTORS.NS',name: 'Tata Motors',          sector: 'Automotive' },
    { symbol: 'WIPRO',        name: 'Wipro Ltd.',           sector: 'IT Services' },
    { symbol: 'ITC.NS',       name: 'ITC Limited',          sector: 'FMCG' },
    { symbol: 'BHARTIARTL.NS',name: 'Bharti Airtel',        sector: 'Telecom' },
  ],
  'United Kingdom': [
    { symbol: 'HSBA.L', name: 'HSBC Holdings',   sector: 'Banking' },
    { symbol: 'AZN',    name: 'AstraZeneca',      sector: 'Pharma' },
    { symbol: 'BP',     name: 'BP plc',           sector: 'Energy' },
    { symbol: 'SHEL',   name: 'Shell plc',        sector: 'Energy' },
    { symbol: 'ULVR.L', name: 'Unilever',         sector: 'Consumer' },
    { symbol: 'GSK',    name: 'GSK plc',          sector: 'Pharma' },
    { symbol: 'RIO',    name: 'Rio Tinto',        sector: 'Mining' },
    { symbol: 'BARC.L', name: 'Barclays',         sector: 'Banking' },
  ],
  'China': [
    { symbol: 'BABA',  name: 'Alibaba Group',    sector: 'E-commerce' },
    { symbol: 'BIDU',  name: 'Baidu Inc.',        sector: 'Internet' },
    { symbol: 'JD',    name: 'JD.com Inc.',       sector: 'E-commerce' },
    { symbol: 'NIO',   name: 'NIO Inc.',          sector: 'EV' },
    { symbol: 'PDD',   name: 'Pinduoduo',         sector: 'E-commerce' },
    { symbol: 'TCEHY', name: 'Tencent Holdings',  sector: 'Internet' },
    { symbol: 'LI',    name: 'Li Auto',           sector: 'EV' },
    { symbol: 'XPEV',  name: 'XPeng Inc.',        sector: 'EV' },
  ],
  'Japan': [
    { symbol: 'SONY',  name: 'Sony Group',        sector: 'Electronics' },
    { symbol: 'TM',    name: 'Toyota Motor',      sector: 'Automotive' },
    { symbol: 'NTDOY', name: 'Nintendo',          sector: 'Gaming' },
    { symbol: 'HMC',   name: 'Honda Motor',       sector: 'Automotive' },
    { symbol: 'MUFG',  name: 'Mitsubishi UFJ',    sector: 'Banking' },
    { symbol: 'SMFG',  name: 'Sumitomo Mitsui',   sector: 'Banking' },
  ],
};

function App() {
  const [ticker, setTicker]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [data, setData]                   = useState(null);
  const [error, setError]                 = useState('');
  const [selectedMarket, setSelectedMarket] = useState('Global');
  const [mobileStocksOpen, setMobileStocksOpen] = useState(false);

  const runAnalysis = useCallback(async (symbol) => {
    const sym = (symbol || ticker).trim().toUpperCase();
    if (!sym) {
      setError('Please enter a ticker symbol');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await axios.get(`http://localhost:8000/analyze/${sym}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    runAnalysis();
  };

  const handleStockClick = (symbol) => {
    setTicker(symbol);
    setError('');
    setMobileStocksOpen(false);
    runAnalysis(symbol);
  };

  const currentStocks = STOCK_DATA[selectedMarket] ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">Stock Sentiment</h1>
                <p className="text-xs text-gray-500">Multi-Source Analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Newspaper className="w-3.5 h-3.5" />
                <span>7 Sources</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Real-time VADER NLP</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>40+ Stocks</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-8">

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Hero */}
              <header className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                  Market Sentiment Analysis
                </h2>
                <p className="text-gray-500 text-sm sm:text-base max-w-2xl">
                  Aggregate and analyze financial news from 7 independent sources in real-time.
                  Powered by VADER NLP with time-decay weighted scoring.
                </p>
              </header>

              {/* Search bar */}
              <div className="mb-6">
                <form onSubmit={handleFormSubmit}>
                  <div className="flex items-center bg-white rounded-xl shadow-sm border-2 border-gray-200 focus-within:border-gray-900 transition-colors overflow-hidden">
                    <Search className="w-4 h-4 text-gray-400 ml-4 shrink-0" />
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="Enter ticker symbol — TSLA, AAPL, RELIANCE.NS …"
                      className="flex-1 px-3 py-3.5 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400"
                      disabled={loading}
                      maxLength={15}
                    />
                    <button
                      type="submit"
                      disabled={loading || !ticker.trim()}
                      className="px-6 py-3.5 bg-gray-900 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing…</span>
                        </span>
                      ) : 'Analyze'}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Mobile stock picker (hidden on lg+) */}
              <div className="lg:hidden mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setMobileStocksOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gray-500" />
                      Popular Stocks — {selectedMarket}
                    </span>
                    {mobileStocksOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {mobileStocksOpen && (
                    <div className="border-t border-gray-100 px-4 pt-3 pb-4">
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {Object.keys(STOCK_DATA).map((market) => (
                          <button
                            key={market}
                            onClick={() => setSelectedMarket(market)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              selectedMarket === market
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                            }`}
                          >
                            {market}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {currentStocks.map((stock) => (
                          <button
                            key={stock.symbol}
                            onClick={() => handleStockClick(stock.symbol)}
                            className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-400 transition-all"
                          >
                            <div className="font-bold text-gray-900 text-sm">{stock.symbol}</div>
                            <div className="text-xs text-gray-500 truncate">{stock.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
                  <div className="relative mb-6">
                    <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
                  </div>
                  <p className="text-gray-900 text-base font-semibold mb-1">Analyzing Market Sentiment</p>
                  <p className="text-gray-400 text-sm">Fetching from 7 news sources concurrently…</p>
                </div>
              )}

              {/* Dashboard */}
              {data && !loading && (
                <div className="animate-fadeIn">
                  <Dashboard data={data} ticker={data.ticker || ticker} />
                </div>
              )}

              {/* Empty state */}
              {!data && !loading && !error && (
                <div className="text-center py-24 animate-fadeIn">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-5">
                    <Search className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Analyze</h3>
                  <p className="text-gray-400 text-sm">
                    Enter a ticker above or pick a stock from the panel
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar (desktop only) */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20 space-y-4">
                {/* Market selector */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Market</h3>
                  </div>
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-gray-900 outline-none transition-colors text-sm"
                  >
                    {Object.keys(STOCK_DATA).map((market) => (
                      <option key={market} value={market}>{market}</option>
                    ))}
                  </select>
                </div>

                {/* Stock list */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Popular Stocks</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Click to analyze instantly</p>

                  <div className="space-y-1.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                    {currentStocks.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleStockClick(stock.symbol)}
                        disabled={loading}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all group disabled:opacity-40 ${
                          ticker === stock.symbol
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-sm ${ticker === stock.symbol ? 'text-white' : 'text-gray-900'}`}>
                            {stock.symbol}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            ticker === stock.symbol
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {stock.sector}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${ticker === stock.symbol ? 'text-gray-300' : 'text-gray-500'}`}>
                          {stock.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>by</span>
              <span className="font-semibold text-gray-900">Guru R Bharadwaj</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/guru-bharadwaj20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-900 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/guru-r-bharadwaj/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-900 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-400">© 2026 Stock Sentiment Analysis · MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
