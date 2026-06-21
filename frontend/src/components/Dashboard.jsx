import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  TrendingUp, TrendingDown, MinusCircle,
  ThumbsUp, ThumbsDown, Signal, Newspaper,
  Target, Calendar, AlertTriangle, Clock,
  Activity, Zap, Building2, DollarSign,
} from 'lucide-react';

/* ─── helpers ────────────────────────────────────────────────── */

const verdictMeta = {
  'STRONG BUY':  { ring: 'border-green-400',  bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800' },
  'BUY':         { ring: 'border-green-300',  bg: 'bg-green-50',  text: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  'HOLD':        { ring: 'border-gray-300',   bg: 'bg-gray-50',   text: 'text-gray-700',   badge: 'bg-gray-100  text-gray-700'  },
  'SELL':        { ring: 'border-red-300',    bg: 'bg-red-50',    text: 'text-red-600',    badge: 'bg-red-100   text-red-700'   },
  'STRONG SELL': { ring: 'border-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100   text-red-800'   },
};

const getVerdictStyle = (v) => verdictMeta[v] ?? verdictMeta['HOLD'];

const VerdictIcon = ({ verdict }) => {
  if (verdict?.includes('BUY'))  return <TrendingUp  className="w-6 h-6" />;
  if (verdict?.includes('SELL')) return <TrendingDown className="w-6 h-6" />;
  return <MinusCircle className="w-6 h-6" />;
};

const sentimentColor = (score) =>
  score > 0.05 ? '#16a34a' : score < -0.05 ? '#dc2626' : '#6b7280';

const pct = (v, decimals = 2) =>
  `${v > 0 ? '+' : ''}${(v * 100).toFixed(decimals)}%`;

const MetricCard = ({ label, value, sub, icon: Icon, colorClass }) => (
  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      {Icon && <Icon className="w-4 h-4 text-gray-300" />}
    </div>
    <div className={`text-2xl font-bold tabular-nums ${colorClass}`}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

const SentimentBar = ({ percent, color }) => (
  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-0.5 max-w-[180px] truncate">
        {d.payload?.title || `Article #${d.payload?.index}`}
      </p>
      <p style={{ color: sentimentColor(d.value / 100) }}>
        Score: {d.value?.toFixed(1)}
      </p>
    </div>
  );
};

/* ─── Dashboard ──────────────────────────────────────────────── */

const Dashboard = ({ data, ticker }) => {
  const {
    verdict,
    confidence_score,
    stats,
    top_comments = [],
    stock_info,
    advanced_stats,
  } = data;

  const totalArticles = (stats.bullish ?? 0) + (stats.bearish ?? 0) + (stats.neutral ?? 0);
  const bullishPct  = totalArticles > 0 ? +((stats.bullish / totalArticles) * 100).toFixed(1) : 0;
  const bearishPct  = totalArticles > 0 ? +((stats.bearish / totalArticles) * 100).toFixed(1) : 0;
  const neutralPct  = totalArticles > 0 ? +((stats.neutral / totalArticles) * 100).toFixed(1) : 0;

  const style = getVerdictStyle(verdict);

  /* confidence is already 0-100 from backend */
  const confidenceLevel = confidence_score > 70 ? 'High' : confidence_score > 40 ? 'Moderate' : 'Low';
  const signalStrength  = confidence_score > 60 ? 'Strong' : confidence_score > 30 ? 'Moderate' : 'Weak';

  /* chart data */
  const pieData = [
    { name: 'Bullish', value: stats.bullish, color: '#16a34a' },
    { name: 'Neutral', value: stats.neutral, color: '#9ca3af' },
    { name: 'Bearish', value: stats.bearish, color: '#dc2626' },
  ].filter(d => d.value > 0);

  const sourcesMap = top_comments.reduce((acc, c) => {
    if (!acc[c.source]) acc[c.source] = { bullish: 0, neutral: 0, bearish: 0 };
    if (c.score > 0.05) acc[c.source].bullish++;
    else if (c.score < -0.05) acc[c.source].bearish++;
    else acc[c.source].neutral++;
    return acc;
  }, {});

  const sourceBreakdown = Object.entries(sourcesMap).map(([name, v]) => ({ name, ...v }));

  const sentimentTrend = top_comments.slice(0, 12).map((c, i) => ({
    index: i + 1,
    sentiment: +(c.score * 100).toFixed(2),
    title: c.text.slice(0, 40),
  }));

  const radarData = advanced_stats ? [
    { metric: 'Sentiment',  value: +((( advanced_stats.avg_sentiment + 1) / 2) * 100).toFixed(1) },
    { metric: 'Consensus',  value: +(advanced_stats.consensus_strength * 100).toFixed(1) },
    { metric: 'Recency',    value: +Math.min((advanced_stats.articles_24h / Math.max(advanced_stats.articles_7d, 1)) * 100, 100).toFixed(1) },
    { metric: 'Volume',     value: +Math.min((totalArticles / 40) * 100, 100).toFixed(1) },
    { metric: 'Stability',  value: +Math.max(0, (1 - (advanced_stats.volatility ?? 0)) * 100).toFixed(1) },
  ] : [];

  const timeColor = (h) => {
    if (h < 6)  return 'text-green-700 bg-green-50 border border-green-200';
    if (h < 24) return 'text-blue-700  bg-blue-50  border border-blue-200';
    if (h < 72) return 'text-amber-700 bg-amber-50 border border-amber-200';
    return 'text-gray-600 bg-gray-100 border border-gray-200';
  };

  return (
    <div className="space-y-5">

      {/* ── Metric cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Avg Sentiment"
          icon={Activity}
          value={pct(advanced_stats?.avg_sentiment ?? 0)}
          sub="Overall market tone"
          colorClass={
            (advanced_stats?.avg_sentiment ?? 0) > 0 ? 'text-green-600'
            : (advanced_stats?.avg_sentiment ?? 0) < 0 ? 'text-red-600'
            : 'text-gray-600'
          }
        />
        <MetricCard
          label="Volatility"
          icon={Zap}
          value={pct(advanced_stats?.volatility ?? 0)}
          sub="Sentiment variance"
          colorClass={
            (advanced_stats?.volatility ?? 0) > 0.3 ? 'text-red-600'
            : (advanced_stats?.volatility ?? 0) > 0.15 ? 'text-amber-600'
            : 'text-green-600'
          }
        />
        <MetricCard
          label="Momentum"
          icon={TrendingUp}
          value={pct(advanced_stats?.momentum ?? 0)}
          sub="Recent vs older sentiment"
          colorClass={
            (advanced_stats?.momentum ?? 0) > 0 ? 'text-green-600'
            : (advanced_stats?.momentum ?? 0) < 0 ? 'text-red-600'
            : 'text-gray-600'
          }
        />
        <MetricCard
          label="Consensus"
          icon={Target}
          value={`${((advanced_stats?.consensus_strength ?? 0) * 100).toFixed(1)}%`}
          sub="Agreement level"
          colorClass="text-blue-600"
        />
      </div>

      {/* ── Verdict + Stock Info ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Verdict card */}
        <div className={`lg:col-span-2 p-6 rounded-xl border-2 ${style.ring} ${style.bg} shadow-sm`}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className={`flex items-center gap-2 mb-1 ${style.text}`}>
                <VerdictIcon verdict={verdict} />
                <h3 className="text-2xl font-bold tracking-tight">{verdict}</h3>
              </div>
              <p className={`text-sm ${style.text} opacity-75`}>
                Market sentiment recommendation for <strong>{ticker}</strong>
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold tabular-nums ${style.text}`}>
                {confidence_score?.toFixed(1)}%
              </div>
              <div className={`text-xs ${style.text} opacity-70`}>Confidence</div>
            </div>
          </div>

          {/* Progress bar for confidence */}
          <div className="mb-5">
            <div className="h-2 bg-black/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  verdict?.includes('BUY') ? 'bg-green-500' : verdict?.includes('SELL') ? 'bg-red-500' : 'bg-gray-500'
                }`}
                style={{ width: `${confidence_score ?? 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-black/10">
            <div>
              <div className={`text-xs opacity-60 mb-0.5 ${style.text}`}>Signal</div>
              <div className={`font-semibold text-sm ${style.text}`}>{signalStrength}</div>
            </div>
            <div>
              <div className={`text-xs opacity-60 mb-0.5 ${style.text}`}>Data Quality</div>
              <div className={`font-semibold text-sm ${style.text}`}>{confidenceLevel}</div>
            </div>
            <div>
              <div className={`text-xs opacity-60 mb-0.5 ${style.text}`}>Articles</div>
              <div className={`font-semibold text-sm ${style.text}`}>{totalArticles}</div>
            </div>
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
                <div className="font-semibold text-gray-900 text-sm leading-tight">
                  {stock_info?.name || ticker}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Signal className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Sector</div>
                <div className="font-medium text-gray-800 text-sm">{stock_info?.sector || 'N/A'}</div>
              </div>
            </div>
            {stock_info?.current_price > 0 && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Price</div>
                  <div className="font-bold text-gray-900 text-sm">
                    ${stock_info.current_price.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-400 mb-1">Articles analyzed</div>
              <div className="flex gap-2 text-xs font-medium">
                <span className="text-green-600">{stats.bullish} bullish</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">{stats.neutral} neutral</span>
                <span className="text-gray-300">·</span>
                <span className="text-red-600">{stats.bearish} bearish</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Radar + Time-Based ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Market Strength Radar</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                <Radar name="Score" dataKey="value" stroke="#111827" fill="#111827" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip formatter={(v) => [`${v.toFixed(1)}`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Time-Based Sentiment</h3>
          <div className="space-y-3">
            {[
              { label: 'Last 24 Hours', count: advanced_stats?.articles_24h ?? 0, value: advanced_stats?.sentiment_24h ?? 0 },
              { label: 'Last 7 Days',   count: advanced_stats?.articles_7d  ?? 0, value: advanced_stats?.sentiment_7d  ?? 0 },
            ].map(({ label, count, value }) => (
              <div key={label} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-700">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{count} articles</div>
                </div>
                <div className={`text-xl font-bold tabular-nums ${
                  value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {pct(value, 1)}
                </div>
              </div>
            ))}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-blue-800">News Coverage</span>
              </div>
              <p className="text-xs text-blue-600">
                {(advanced_stats?.articles_24h ?? 0) > 0 ? 'Active' : 'Limited'} recent coverage ·{' '}
                {Math.round(((advanced_stats?.articles_24h ?? 0) / Math.max(advanced_stats?.articles_7d ?? 1, 1)) * 100)}% from last 24h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sentiment counts ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Bullish', count: stats.bullish, pct: bullishPct, icon: ThumbsUp,   color: '#16a34a', textClass: 'text-green-600' },
          { label: 'Neutral', count: stats.neutral, pct: neutralPct, icon: MinusCircle, color: '#9ca3af', textClass: 'text-gray-500'  },
          { label: 'Bearish', count: stats.bearish, pct: bearishPct, icon: ThumbsDown,  color: '#dc2626', textClass: 'text-red-600'   },
        ].map(({ label, count, pct: p, icon: Icon, color, textClass }) => (
          <div key={label} className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">{label}</span>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className={`text-3xl font-bold tabular-nums ${textClass}`}>{count}</div>
            <div className="text-xs text-gray-400 mt-0.5">{p}% of total</div>
            <SentimentBar percent={p} color={color} />
          </div>
        ))}
      </div>

      {/* ── Charts row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Sentiment Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-2">
            {pieData.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                <span className="text-xs text-gray-600">{e.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source breakdown */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Source Breakdown</h3>
          {sourceBreakdown.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceBreakdown} margin={{ bottom: 30 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-35} textAnchor="end" height={60} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="bullish" stackId="a" fill="#16a34a" radius={[0,0,0,0]} />
                  <Bar dataKey="neutral" stackId="a" fill="#9ca3af" />
                  <Bar dataKey="bearish" stackId="a" fill="#dc2626" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-gray-400">No source data</div>
          )}
        </div>
      </div>

      {/* ── Trend line ───────────────────────────────────────── */}
      <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Sentiment Trend (Top Articles)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sentimentTrend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="index" tick={{ fontSize: 11, fill: '#9ca3af' }} label={{ value: 'Article #', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 3" />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke="#111827"
                strokeWidth={2}
                dot={{ fill: '#111827', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Headlines ────────────────────────────────────────── */}
      <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Latest Headlines</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">{top_comments.length} articles</span>
        </div>

        <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          {top_comments.map((comment, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors"
            >
              <p className="text-sm text-gray-800 font-medium leading-snug mb-2">{comment.text}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-medium">
                  {comment.source}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{
                    backgroundColor: sentimentColor(comment.score) + '18',
                    color: sentimentColor(comment.score),
                  }}
                >
                  {comment.score > 0 ? '+' : ''}{(comment.score * 100).toFixed(1)}%
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${timeColor(comment.hours_old)}`}>
                  <Clock className="w-3 h-3 inline mr-0.5 -mt-px" />
                  {comment.time_ago}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Methodology + Disclaimer ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Analysis Methodology</h3>
          </div>
          <ul className="space-y-2 text-xs text-gray-600">
            {[
              [Signal,    'VADER compound scoring (-1.0 → +1.0)'],
              [Newspaper, '7 concurrent news sources (Google, Yahoo, Bing, Finnhub, Marketaux, Seeking Alpha, Alpha Vantage)'],
              [Target,    'Logarithmic recency-weighted scoring'],
              [Zap,       'Multi-factor confidence: magnitude + consensus + volume + recency'],
            ].map(([Icon, text], i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">Disclaimer</h3>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            This analysis is for <strong>informational purposes only</strong> and does not constitute financial advice.
            Sentiment scores are derived from automated NLP on news headlines and may not reflect true market conditions.
            Always conduct your own research and consult a licensed financial professional before investing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
