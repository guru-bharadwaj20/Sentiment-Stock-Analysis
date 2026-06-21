import { Signal, Newspaper, Target, Calendar, AlertTriangle, Zap } from 'lucide-react';
import VerdictCard from './VerdictCard';
import MetricCards from './MetricCards';
import Headlines from './Headlines';
import AnalyticsCards from './AnalyticsCards';
import SourceContribution from './SourceContribution';
import { RadarPanel, TimePanel, PiePanel, SourcePanel, TrendPanel, HistoryPanel } from './Charts';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard({ data }) {
  const { stats, top_comments, advanced_stats, history, meta, timing, cached,
          source_contributions, source_health } = data;
  const totalArticles = (stats?.bullish ?? 0) + (stats?.bearish ?? 0) + (stats?.neutral ?? 0);
  const dateStr = new Date().toISOString().split('T')[0];

  const handleExport = (format) => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${data.ticker}_sentiment_${dateStr}.json`);
    } else if (format === 'csv') {
      const rows = [
        ['Text', 'Score', 'Sentiment', 'Source', 'SourceWeight', 'TimeAgo'],
        ...(top_comments ?? []).map((c) => [
          `"${(c.text ?? '').replace(/"/g, '""')}"`,
          c.score.toFixed(4),
          c.sentiment,
          c.source,
          c.source_weight,
          c.time_ago,
        ]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, `${data.ticker}_headlines_${dateStr}.csv`);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Verdict + stock info */}
      <VerdictCard data={data} />

      {/* Analytics meta-cards */}
      <AnalyticsCards meta={meta} timing={timing} cached={cached} onExport={handleExport} />

      {/* 4 metric cards + bull/neutral/bear bars */}
      <MetricCards advanced_stats={advanced_stats} stats={stats} />

      {/* Radar + time-based */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RadarPanel advanced_stats={advanced_stats} totalArticles={totalArticles} />
        <TimePanel  advanced_stats={advanced_stats} />
      </div>

      {/* Pie + source breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PiePanel    stats={stats} />
        <SourcePanel top_comments={top_comments} />
      </div>

      {/* Per-source contribution analysis */}
      <SourceContribution
        source_contributions={source_contributions}
        source_health={source_health}
      />

      {/* Sentiment trend line */}
      <TrendPanel top_comments={top_comments} />

      {/* Headlines */}
      <Headlines top_comments={top_comments} />

      {/* Analysis history */}
      <HistoryPanel history={history} />

      {/* Methodology + disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Analysis Methodology</h3>
          </div>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            {[
              [Signal,    'VADER NLP with financial domain lexicon (40+ custom terms)'],
              [Newspaper, '7 concurrent sources: Google, Yahoo, Bing, Finnhub, Marketaux, Seeking Alpha, Alpha Vantage'],
              [Target,    'Source-reliability weighting (Finnhub 1.0 → Bing/Marketaux 0.75)'],
              [Zap,       'Confidence: signal magnitude (35%) + consensus (25%) + volume (15%) + reliability (10%) + recency (10%) + stability (5%)'],
            ].map(([Icon, text], i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 mt-0.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">Disclaimer</h3>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
            This analysis is for <strong>informational purposes only</strong> and does not constitute
            financial or investment advice. Sentiment scores are derived from automated NLP on
            news headlines and may not reflect actual market conditions. Always conduct your own
            research and consult a licensed financial professional before investing.
          </p>
        </div>
      </div>
    </div>
  );
}
