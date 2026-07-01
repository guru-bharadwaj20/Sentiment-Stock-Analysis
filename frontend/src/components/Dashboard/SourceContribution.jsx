import { Server, CheckCircle, XCircle, Clock } from 'lucide-react';
import { CARD, PANEL_TITLE, sentimentTone } from '../../constants/ui';

function HealthIcon({ status }) {
  if (status === 'ok') return <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />;
  return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
}

export default function SourceContribution({ source_contributions, source_health }) {
  const contrib   = source_contributions ?? {};
  const health    = source_health ?? [];
  const healthMap = health.reduce((acc, h) => { acc[h.name] = h; return acc; }, {});

  const sources = Object.entries(contrib).sort(([, a], [, b]) => b.contribution_pct - a.contribution_pct);

  if (!sources.length) return null;

  const failedSources = health.filter((h) => h.status !== 'ok');
  const allOk = failedSources.length === 0;

  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center gap-2 mb-1">
        <Server className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className={PANEL_TITLE}>Source Contribution Analysis</h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {health.filter((h) => h.status === 'ok').length}/{health.length} sources active
        </span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Weighted share, sentiment, health and freshness per news source</p>

      {/* Column headers (desktop only) */}
      <div className="hidden md:flex items-center gap-3 mb-2 text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
        <div className="w-28 shrink-0">Source</div>
        <div className="flex-1">Weight</div>
        <div className="w-10 text-right">Pct</div>
        <div className="w-16 text-right">Sentiment</div>
        <div className="w-16 text-right">Articles</div>
        <div className="w-14 text-right">Avg age</div>
        <div className="w-16 text-right">Latency</div>
      </div>

      <div className="space-y-3">
        {sources.map(([name, c]) => {
          const h = healthMap[name];
          const tone = sentimentTone(c.avg_sentiment);
          const avgAge = c.avg_age_hours ?? 0;
          const ageStr = avgAge < 24
            ? `${avgAge.toFixed(0)}h`
            : `${(avgAge / 24).toFixed(1)}d`;
          return (
            <div key={name} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-2.5 md:p-0 rounded-lg bg-gray-50 dark:bg-gray-900/40 md:bg-transparent dark:md:bg-transparent">
              <div className="flex items-center gap-1.5 w-full md:w-28 shrink-0">
                {h && <HealthIcon status={h.status} />}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
              </div>

              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${c.contribution_pct}%`, backgroundColor: '#374151' }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums">{c.contribution_pct}%</span>
                <span className={`font-semibold w-16 text-right tabular-nums ${tone.text}`}>
                  {c.avg_sentiment > 0 ? '+' : ''}{(c.avg_sentiment * 100).toFixed(1)}%
                </span>
                <span className="text-gray-500 dark:text-gray-400 w-16 text-right tabular-nums">{c.articles} art.</span>
                <span className="text-gray-400 dark:text-gray-500 w-14 text-right tabular-nums">{ageStr}</span>
                {h && (
                  <span className="text-gray-300 dark:text-gray-600 w-16 flex items-center justify-end gap-0.5 tabular-nums">
                    <Clock className="w-3 h-3 shrink-0" />{h.duration_ms}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!allOk && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1.5">
          {failedSources.map((h) => (
            <span
              key={h.name}
              className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded"
            >
              {h.name}: {h.error ?? 'error'} ({h.duration_ms}ms)
            </span>
          ))}
        </div>
      )}

      {allOk && health.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          All {health.length} sources responded successfully.
        </p>
      )}
    </div>
  );
}
