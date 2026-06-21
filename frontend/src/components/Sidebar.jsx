import { Globe, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { MARKETS, STOCK_DATA } from '../constants/stocks';

export function Sidebar({ activeTicker, loading, onSelect }) {
  const [market, setMarket] = useState('Global');
  const stocks = STOCK_DATA[market] ?? [];

  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-20 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Market</h3>
          </div>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-gray-900 dark:focus:border-gray-400 outline-none transition-colors text-sm"
            aria-label="Select market"
          >
            {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Popular Stocks</h3>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Click to analyze instantly</p>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-0.5">
            {stocks.map((s) => {
              const active = activeTicker === s.symbol;
              return (
                <button
                  key={s.symbol}
                  onClick={() => onSelect(s.symbol)}
                  disabled={loading}
                  aria-pressed={active}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all disabled:opacity-40 ${
                    active
                      ? 'bg-gray-900 dark:bg-gray-600 border-gray-900 dark:border-gray-600 text-white'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm ${active ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {s.symbol}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {s.sector}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${active ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {s.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileStockPicker({ activeTicker, loading, onSelect }) {
  const [open, setOpen]     = useState(false);
  const [market, setMarket] = useState('Global');
  const stocks = STOCK_DATA[market] ?? [];

  return (
    <div className="lg:hidden mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Popular Stocks — {market}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </button>

        {open && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-4 pt-3 pb-4">
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    market === m
                      ? 'bg-gray-900 dark:bg-gray-600 text-white border-gray-900 dark:border-gray-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {stocks.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => { onSelect(s.symbol); setOpen(false); }}
                  disabled={loading}
                  className={`text-left p-3 rounded-lg border transition-all disabled:opacity-40 ${
                    activeTicker === s.symbol
                      ? 'bg-gray-900 dark:bg-gray-600 border-gray-900 dark:border-gray-600 text-white'
                      : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className={`font-bold text-sm ${activeTicker === s.symbol ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                    {s.symbol}
                  </div>
                  <div className={`text-xs truncate ${activeTicker === s.symbol ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {s.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
