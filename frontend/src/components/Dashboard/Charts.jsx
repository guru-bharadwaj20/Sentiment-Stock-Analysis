import {
  ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip as RcTooltip,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { Clock } from 'lucide-react';

const pct1 = (v) => `${v > 0 ? '+' : ''}${((v ?? 0) * 100).toFixed(1)}%`;

const CARD = 'p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm';
const TITLE = 'text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4';

/* ─ Radar ──────────────────────────────────────────────────── */

function RadarPanel({ advanced_stats, totalArticles }) {
  const a = advanced_stats ?? {};
  const data = [
    { metric: 'Sentiment',  value: +(((a.avg_sentiment ?? 0) + 1) / 2 * 100).toFixed(1) },
    { metric: 'Consensus',  value: +((a.consensus_strength ?? 0) * 100).toFixed(1) },
    { metric: 'Recency',    value: +Math.min(((a.articles_24h ?? 0) / Math.max(a.articles_7d ?? 1, 1)) * 100, 100).toFixed(1) },
    { metric: 'Volume',     value: +Math.min((totalArticles / 40) * 100, 100).toFixed(1) },
    { metric: 'Stability',  value: +Math.max(0, (1 - (a.volatility ?? 0)) * 100).toFixed(1) },
  ];

  return (
    <div className={CARD}>
      <h3 className={TITLE}>Market Strength Radar</h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
            <Radar name="Score" dataKey="value" stroke="#111827" fill="#111827" fillOpacity={0.15} strokeWidth={2} />
            <RcTooltip formatter={(v) => [`${v.toFixed(1)}`, 'Score']} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─ Time-based ─────────────────────────────────────────────── */

function TimePanel({ advanced_stats }) {
  const a = advanced_stats ?? {};
  return (
    <div className={CARD}>
      <h3 className={TITLE}>Time-Based Sentiment</h3>
      <div className="space-y-3">
        {[
          { label: 'Last 24 Hours', count: a.articles_24h ?? 0, value: a.sentiment_24h ?? 0 },
          { label: 'Last 7 Days',   count: a.articles_7d  ?? 0, value: a.sentiment_7d  ?? 0 },
        ].map(({ label, count, value }) => (
          <div key={label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{count} articles</div>
            </div>
            <div className={`text-xl font-bold tabular-nums ${value > 0 ? 'text-green-600 dark:text-green-400' : value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {pct1(value)}
            </div>
          </div>
        ))}

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Coverage Freshness</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {(a.articles_24h ?? 0) > 0 ? 'Active' : 'Limited'} recent coverage ·{' '}
            {Math.round(((a.articles_24h ?? 0) / Math.max(a.articles_7d ?? 1, 1)) * 100)}% from last 24 h
            {a.avg_article_age_hours != null && ` · avg age ${a.avg_article_age_hours.toFixed(1)} h`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─ Pie ────────────────────────────────────────────────────── */

function PiePanel({ stats }) {
  const pieData = [
    { name: 'Bullish', value: stats?.bullish ?? 0, color: '#16a34a' },
    { name: 'Neutral', value: stats?.neutral ?? 0, color: '#9ca3af' },
    { name: 'Bearish', value: stats?.bearish ?? 0, color: '#dc2626' },
  ].filter((d) => d.value > 0);

  return (
    <div className={CARD}>
      <h3 className={TITLE}>Sentiment Distribution</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
              {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
            </Pie>
            <RcTooltip formatter={(v, n) => [v, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-5 mt-2">
        {pieData.map((e) => (
          <div key={e.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{e.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─ Source bar ──────────────────────────────────────────────── */

function SourcePanel({ top_comments }) {
  const map = (top_comments ?? []).reduce((acc, c) => {
    if (!acc[c.source]) acc[c.source] = { bullish: 0, neutral: 0, bearish: 0 };
    if (c.score > 0.05) acc[c.source].bullish++;
    else if (c.score < -0.05) acc[c.source].bearish++;
    else acc[c.source].neutral++;
    return acc;
  }, {});

  const data = Object.entries(map).map(([name, v]) => ({ name, ...v }));

  return (
    <div className={CARD}>
      <h3 className={TITLE}>Source Breakdown</h3>
      {data.length > 0 ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ bottom: 28 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-35} textAnchor="end" height={55} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <RcTooltip />
              <Bar dataKey="bullish" stackId="a" fill="#16a34a" />
              <Bar dataKey="neutral" stackId="a" fill="#9ca3af" />
              <Bar dataKey="bearish" stackId="a" fill="#dc2626" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-52 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No source data</div>
      )}
    </div>
  );
}

/* ─ Sentiment trend line ────────────────────────────────────── */

function TrendPanel({ top_comments }) {
  const data = (top_comments ?? []).slice(0, 12).map((c, i) => ({
    index:     i + 1,
    sentiment: +(c.score * 100).toFixed(2),
    title:     c.text?.slice(0, 40) ?? '',
  }));

  const CustomTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[200px]">
        <p className="font-medium text-gray-700 dark:text-gray-300 truncate mb-0.5">{d.payload.title}…</p>
        <p style={{ color: d.value >= 0 ? '#16a34a' : '#dc2626' }}>
          Score: {d.value > 0 ? '+' : ''}{d.value?.toFixed(1)}
        </p>
      </div>
    );
  };

  return (
    <div className={CARD}>
      <h3 className={TITLE}>Sentiment Trend (Top Articles)</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="index" tick={{ fontSize: 11, fill: '#9ca3af' }} label={{ value: 'Article #', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`} />
            <RcTooltip content={<CustomTip />} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 3" />
            <Line type="monotone" dataKey="sentiment" stroke="#111827" strokeWidth={2} dot={{ fill: '#111827', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─ History ─────────────────────────────────────────────────── */

const VERDICT_COLOR = {
  'STRONG BUY':  '#16a34a',
  'BUY':         '#4ade80',
  'HOLD':        '#9ca3af',
  'SELL':        '#f87171',
  'STRONG SELL': '#dc2626',
  'INSUFFICIENT DATA': '#d1d5db',
};

function HistoryPanel({ history }) {
  if (!history?.length) return null;

  const chartData = [...history].reverse().map((h) => ({
    ts:         new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    confidence: h.confidence_score,
    sentiment:  Math.round(h.avg_sentiment * 100),
    verdict:    h.verdict,
  }));

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const color = VERDICT_COLOR[payload.verdict] ?? '#9ca3af';
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={1.5} />;
  };

  return (
    <div className={CARD}>
      <h3 className={TITLE}>Analysis History</h3>

      {chartData.length >= 2 && (
        <div className="h-36 mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="ts" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <RcTooltip
                formatter={(v, n) => [
                  n === 'confidence' ? `${v}%` : `${v > 0 ? '+' : ''}${v}%`,
                  n === 'confidence' ? 'Confidence' : 'Sentiment',
                ]}
              />
              <Line
                type="monotone" dataKey="confidence" stroke="#111827" strokeWidth={2}
                dot={<CustomDot />} activeDot={{ r: 6 }}
              />
              <Line
                type="monotone" dataKey="sentiment" stroke="#6b7280" strokeWidth={1.5}
                strokeDasharray="4 2" dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        {history.map((h, i) => {
          const date  = new Date(h.timestamp);
          const label = date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          return (
            <div key={i} className="flex items-center gap-3 text-xs flex-wrap">
              <span className="text-gray-400 dark:text-gray-500 w-32 shrink-0">{label}</span>
              <span
                className="px-2 py-0.5 rounded font-semibold text-white text-xs shrink-0"
                style={{ backgroundColor: VERDICT_COLOR[h.verdict] ?? '#9ca3af' }}
              >
                {h.verdict}
              </span>
              <span className="text-gray-500 dark:text-gray-400">{h.confidence_score?.toFixed(1)}% conf</span>
              <span className={`${h.avg_sentiment > 0 ? 'text-green-600 dark:text-green-400' : h.avg_sentiment < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                {h.avg_sentiment > 0 ? '+' : ''}{(h.avg_sentiment * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { RadarPanel, TimePanel, PiePanel, SourcePanel, TrendPanel, HistoryPanel };
