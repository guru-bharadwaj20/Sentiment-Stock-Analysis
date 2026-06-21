import { TrendingUp, TrendingDown, MinusCircle, CheckCircle, Building2, Signal, DollarSign } from 'lucide-react';

const STYLES = {
  'STRONG BUY':  { ring: 'border-green-400', bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-500'  },
  'BUY':         { ring: 'border-green-300', bg: 'bg-green-50',  text: 'text-green-600',  bar: 'bg-green-400'  },
  'HOLD':        { ring: 'border-gray-300',  bg: 'bg-gray-50',   text: 'text-gray-700',   bar: 'bg-gray-400'   },
  'SELL':        { ring: 'border-red-300',   bg: 'bg-red-50',    text: 'text-red-600',    bar: 'bg-red-400'    },
  'STRONG SELL': { ring: 'border-red-500',   bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500'    },
};

function VerdictIcon({ verdict }) {
  if (verdict?.includes('BUY'))  return <TrendingUp  className="w-6 h-6" />;
  if (verdict?.includes('SELL')) return <TrendingDown className="w-6 h-6" />;
  return <MinusCircle className="w-6 h-6" />;
}

export default function VerdictCard({ data }) {
  const { verdict, confidence_score, verdict_reasons = [], stats, stock_info, ticker } = data;
  const s = STYLES[verdict] ?? STYLES.HOLD;

  const total     = (stats?.bullish ?? 0) + (stats?.bearish ?? 0) + (stats?.neutral ?? 0);
  const sigStrength = confidence_score > 60 ? 'Strong' : confidence_score > 30 ? 'Moderate' : 'Weak';
  const dataQuality = confidence_score > 70 ? 'High'   : confidence_score > 40 ? 'Moderate' : 'Low';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Verdict */}
      <div className={`lg:col-span-2 p-6 rounded-xl border-2 ${s.ring} ${s.bg} shadow-sm`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center gap-2 ${s.text}`}>
            <VerdictIcon verdict={verdict} />
            <h3 className="text-2xl font-bold tracking-tight">{verdict}</h3>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold tabular-nums ${s.text}`}>
              {confidence_score?.toFixed(1)}%
            </div>
            <div className={`text-xs ${s.text} opacity-70`}>Confidence</div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-2 bg-black/10 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
            style={{ width: `${confidence_score ?? 0}%` }}
          />
        </div>

        {/* Reasons */}
        {verdict_reasons.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {verdict_reasons.slice(0, 4).map((r, i) => (
              <li key={i} className={`flex items-start gap-2 text-xs ${s.text}`}>
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}

        <div className={`grid grid-cols-3 gap-4 pt-4 border-t border-black/10`}>
          {[['Signal', sigStrength], ['Data Quality', dataQuality], ['Articles', total]].map(([label, val]) => (
            <div key={label}>
              <div className={`text-xs opacity-60 mb-0.5 ${s.text}`}>{label}</div>
              <div className={`font-semibold text-sm ${s.text}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock info */}
      <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock Information</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-400">Company</div>
              <div className="font-semibold text-gray-900 text-sm leading-snug">{stock_info?.name || ticker}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Signal className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-400">Sector</div>
              <div className="font-medium text-gray-800 text-sm">{stock_info?.sector || 'N/A'}</div>
            </div>
          </div>
          {(stock_info?.current_price ?? 0) > 0 && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Price</div>
                <div className="font-bold text-gray-900 text-sm">${stock_info.current_price.toFixed(2)}</div>
              </div>
            </div>
          )}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-400 mb-1.5">Breakdown</div>
            <div className="flex gap-3 text-xs font-medium">
              <span className="text-green-600">{stats?.bullish ?? 0} bullish</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{stats?.neutral ?? 0} neutral</span>
              <span className="text-gray-400">·</span>
              <span className="text-red-600">{stats?.bearish ?? 0} bearish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
