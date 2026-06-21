import { useState } from 'react';
import { TrendingUp, TrendingDown, MinusCircle, CheckCircle, Building2, Signal,
         DollarSign, ArrowUpRight, ArrowDownRight, Minus, Info, Cpu } from 'lucide-react';

const STYLES = {
  'STRONG BUY':  { ring: 'border-green-400', bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-400',  bar: 'bg-green-500'  },
  'BUY':         { ring: 'border-green-300', bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-600 dark:text-green-400',  bar: 'bg-green-400'  },
  'HOLD':        { ring: 'border-gray-300 dark:border-gray-600',  bg: 'bg-gray-50 dark:bg-gray-800',   text: 'text-gray-700 dark:text-gray-300',   bar: 'bg-gray-400'   },
  'SELL':        { ring: 'border-red-300',   bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-600 dark:text-red-400',    bar: 'bg-red-400'    },
  'STRONG SELL': { ring: 'border-red-500',   bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-700 dark:text-red-400',    bar: 'bg-red-500'    },
};

function VerdictIcon({ verdict }) {
  if (verdict?.includes('BUY'))  return <TrendingUp  className="w-6 h-6" />;
  if (verdict?.includes('SELL')) return <TrendingDown className="w-6 h-6" />;
  return <MinusCircle className="w-6 h-6" />;
}

function TrendBadge({ trend }) {
  if (!trend || trend.direction === 'new') return null;

  const cfg = {
    improving:     { Icon: ArrowUpRight,   cls: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800', label: 'Improving' },
    deteriorating: { Icon: ArrowDownRight, cls: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',             label: 'Deteriorating' },
    stable:        { Icon: Minus,          cls: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600',           label: 'Stable' },
  }[trend.direction];

  if (!cfg) return null;
  const { Icon, cls, label } = cfg;
  const delta = trend.sentiment_delta;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
      {delta !== 0 && (
        <span className="opacity-70">
          {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
        </span>
      )}
      {trend.verdict_changed && trend.prev_verdict && (
        <span className="opacity-60 ml-0.5">was {trend.prev_verdict}</span>
      )}
    </span>
  );
}

function ConfidenceTooltip({ textClass }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className={`${textClass} opacity-50 hover:opacity-90 transition-opacity focus:outline-none`}
        aria-label="How confidence is calculated"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute right-0 top-6 z-30 w-56 p-3 bg-gray-900 text-white rounded-xl shadow-2xl">
          <p className="text-xs font-semibold text-gray-100 mb-2">Confidence formula</p>
          <ul className="space-y-1.5">
            {[
              ['Signal magnitude', '35%'],
              ['Consensus strength', '25%'],
              ['Article volume', '15%'],
              ['Source reliability', '10%'],
              ['Recency', '10%'],
              ['Signal stability', '5%'],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{k}</span>
                <span className="font-mono font-bold text-white ml-2">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ModelBadge({ model }) {
  if (!model || model === 'vader') return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
      <Cpu className="w-3 h-3" />
      FinBERT
    </span>
  );
}

export default function VerdictCard({ data }) {
  const { verdict, confidence_score, verdict_reasons = [], stats, stock_info, ticker, trend, model_used } = data;
  const s = STYLES[verdict] ?? STYLES.HOLD;

  const total      = (stats?.bullish ?? 0) + (stats?.bearish ?? 0) + (stats?.neutral ?? 0);
  const sigStrength = confidence_score > 60 ? 'Strong' : confidence_score > 30 ? 'Moderate' : 'Weak';
  const dataQuality = confidence_score > 70 ? 'High'   : confidence_score > 40 ? 'Moderate' : 'Low';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Verdict */}
      <div className={`lg:col-span-2 p-6 rounded-xl border-2 ${s.ring} ${s.bg} shadow-sm`}>
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1.5">
            <div className={`flex items-center gap-2 ${s.text} mb-1`}>
              <VerdictIcon verdict={verdict} />
              <h3 className="text-2xl font-bold tracking-tight">{verdict}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <TrendBadge trend={trend} />
              <ModelBadge model={model_used} />
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`flex items-start justify-end gap-1 ${s.text}`}>
              <span className="text-3xl font-bold tabular-nums">
                {confidence_score?.toFixed(1)}%
              </span>
              <ConfidenceTooltip textClass={s.text} />
            </div>
            <div className={`text-xs ${s.text} opacity-70 mt-0.5`}>Confidence</div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-4">
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

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-black/10 dark:border-white/10">
          {[['Signal', sigStrength], ['Data Quality', dataQuality], ['Articles', total]].map(([label, val]) => (
            <div key={label}>
              <div className={`text-xs opacity-60 mb-0.5 ${s.text}`}>{label}</div>
              <div className={`font-semibold text-sm ${s.text}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock info */}
      <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Stock Information</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Company</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">
                {stock_info?.name || ticker}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Signal className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Sector</div>
              <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                {stock_info?.sector || 'N/A'}
              </div>
            </div>
          </div>
          {(stock_info?.current_price ?? 0) > 0 && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Price</div>
                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  ${stock_info.current_price.toFixed(2)}
                </div>
              </div>
            </div>
          )}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Breakdown</div>
            <div className="flex gap-3 text-xs font-medium">
              <span className="text-green-600 dark:text-green-400">{stats?.bullish ?? 0} bullish</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-gray-500 dark:text-gray-400">{stats?.neutral ?? 0} neutral</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-red-600 dark:text-red-400">{stats?.bearish ?? 0} bearish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
