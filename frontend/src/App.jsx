import { useState } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import { Search, Loader2, TrendingUp, BarChart3, Newspaper, Heart, Github, Linkedin, Globe, Star, Activity } from 'lucide-react';

const STOCK_DATA = {
  'Global': [
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Electric Vehicles' },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Software' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Internet' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce' },
    { symbol: 'META', name: 'Meta Platforms', sector: 'Social Media' },
    { symbol: 'AMD', name: 'AMD Inc.', sector: 'Semiconductors' },
  ],
  'United States': [
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Electric Vehicles' },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Software' },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Banking' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Payments' },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Retail' },
    { symbol: 'DIS', name: 'Walt Disney', sector: 'Entertainment' },
  ],
  'India': [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Conglomerate' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy', sector: 'IT Services' },
    { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automotive' },
    { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'IT Services' },
    { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
  ],
  'United Kingdom': [
    { symbol: 'HSBA.L', name: 'HSBC Holdings', sector: 'Banking' },
    { symbol: 'AZN', name: 'AstraZeneca', sector: 'Pharmaceuticals' },
    { symbol: 'BP', name: 'BP plc', sector: 'Energy' },
    { symbol: 'SHEL', name: 'Shell plc', sector: 'Energy' },
    { symbol: 'ULVR.L', name: 'Unilever', sector: 'Consumer Goods' },
    { symbol: 'GSK', name: 'GSK plc', sector: 'Pharmaceuticals' },
    { symbol: 'RIO', name: 'Rio Tinto', sector: 'Mining' },
    { symbol: 'BARC.L', name: 'Barclays', sector: 'Banking' },
  ],
  'China': [
    { symbol: 'BABA', name: 'Alibaba Group', sector: 'E-commerce' },
    { symbol: 'BIDU', name: 'Baidu Inc.', sector: 'Internet' },
    { symbol: 'JD', name: 'JD.com Inc.', sector: 'E-commerce' },
    { symbol: 'NIO', name: 'NIO Inc.', sector: 'Electric Vehicles' },
    { symbol: 'PDD', name: 'Pinduoduo', sector: 'E-commerce' },
    { symbol: 'TCEHY', name: 'Tencent Holdings', sector: 'Internet' },
    { symbol: 'LI', name: 'Li Auto', sector: 'Electric Vehicles' },
    { symbol: 'XPEV', name: 'XPeng Inc.', sector: 'Electric Vehicles' },
  ],
  'Japan': [
    { symbol: 'SONY', name: 'Sony Group', sector: 'Electronics' },
    { symbol: 'TM', name: 'Toyota Motor', sector: 'Automotive' },
    { symbol: 'NTDOY', name: 'Nintendo', sector: 'Gaming' },
    { symbol: 'HMC', name: 'Honda Motor', sector: 'Automotive' },
    { symbol: 'MUFG', name: 'Mitsubishi UFJ', sector: 'Banking' },
    { symbol: 'SMFG', name: 'Sumitomo Mitsui', sector: 'Banking' },
  ],
};

function App() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Global');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await axios.get(`http://localhost:8000/analyze/${ticker.toUpperCase()}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze ticker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockClick = (symbol) => {
    setTicker(symbol);
    setError('');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-900 rounded">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Stock Sentiment</h1>
                <p className="text-xs text-gray-500">Multi-Source Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Newspaper className="w-4 h-4" />
                <span>7 Sources</span>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <div className="flex-1">
              <header className="mb-12">
                <div className="max-w-3xl">
                  <h2 className="text-4xl font-bold text-gray-900 mb-3">Market Sentiment Analysis</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Aggregate sentiment data from Google News, Yahoo Finance, Bing News, and 4 additional financial data sources. 
                    Powered by VADER sentiment analysis engine.
                  </p>
                </div>
              </header>

              <div className="max-w-3xl mb-12">
                <form onSubmit={handleAnalyze} className="relative">
                  <div className="flex items-center bg-white rounded-lg shadow-sm overflow-hidden border-2 border-gray-300 focus-within:border-gray-900 transition-colors">
                    <Search className="w-5 h-5 text-gray-400 ml-5" />
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="Enter ticker symbol (TSLA, AAPL, MSFT)"
                      className="flex-1 px-4 py-4 bg-transparent text-gray-900 outline-none placeholder-gray-400"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Analyzing</span>
                        </span>
                      ) : (
                        'Analyze'
                      )}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-16 h-16 text-gray-900 animate-spin mb-4" />
                  <p className="text-gray-900 text-lg font-medium">Analyzing Market Sentiment</p>
                  <p className="text-gray-500 text-sm mt-2">Fetching data from 7 news sources</p>
                </div>
              )}

              {data && !loading && (
                <Dashboard data={data} ticker={ticker} />
              )}

              {!data && !loading && !error && (
                <div className="text-center py-20">
                  <div className="inline-block p-6 bg-gray-100 rounded-lg mb-4">
                    <Search className="w-16 h-16 text-gray-400 mx-auto" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ready to Analyze</h2>
                  <p className="text-gray-600">Enter a stock ticker or select from popular stocks</p>
                </div>
              )}
            </div>

            <aside className="hidden lg:block w-80">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <Globe className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base font-semibold text-gray-900">Select Market</h3>
                  </div>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded border border-gray-300 focus:border-gray-900 outline-none transition-colors text-sm"
                  >
                    {Object.keys(STOCK_DATA).map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 max-h-[600px] overflow-y-auto">
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base font-semibold text-gray-900">Popular Stocks</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">High news coverage & data availability</p>
                  <div className="space-y-2">
                    {STOCK_DATA[selectedCountry].map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleStockClick(stock.symbol)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-900 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {stock.symbol}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                            {stock.sector}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{stock.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-600 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-600 fill-red-600" />
              <span>by</span>
              <span className="font-semibold text-gray-900">Guru R Bharadwaj</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://github.com/guru-bharadwaj20" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/guru-r-bharadwaj/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 Stock Sentiment Analysis
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
