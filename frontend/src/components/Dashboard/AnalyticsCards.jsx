import { FileText, Copy, Wifi, Database, Timer, Download, Printer, Gauge } from 'lucide-react';
import { CARD, SEMANTIC } from '../../constants/ui';

function KpiCard(props) {
  const { Icon, label, value, sub, tone } = props;
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${tone?.text ?? 'text-gray-400 dark:text-gray-500'}`} />
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${tone?.text ?? 'text-gray-800 dark:text-gray-200'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

export default function AnalyticsCards({ confidence_score, meta, timing, cached, cache_meta }) {
  const m  = meta       ?? {};
  const t  = timing     ?? {};
  const cm = cache_meta ?? {};

  const cacheSubline = (() => {
    if (cached && cm.expires_in_s != null) {
      return `expires in ${cm.expires_in_s?.toFixed(0) ?? '?'}s`;
    }
    return cached ? 'served instantly' : 'fresh fetch';
  })();

  const sourcesOk = (m.sources_succeeded ?? 0) >= (m.sources_total ?? 7);
  const confidenceTone =
    confidence_score >= 60 ? SEMANTIC.positive : confidence_score >= 30 ? SEMANTIC.warning : SEMANTIC.negative;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard
        Icon={Gauge}
        label="Confidence"
        value={confidence_score != null ? `${confidence_score.toFixed(0)}%` : '—'}
        sub="verdict confidence"
        tone={confidenceTone}
      />
      <KpiCard
        Icon={FileText}
        label="Scanned"
        value={m.articles_raw ?? '—'}
        sub="raw articles"
      />
      <KpiCard
        Icon={Wifi}
        label="Sources"
        value={`${m.sources_succeeded ?? 0}/${m.sources_total ?? 7}`}
        sub="responded"
        tone={sourcesOk ? SEMANTIC.positive : SEMANTIC.warning}
      />
      <KpiCard
        Icon={Copy}
        label="Duplicates"
        value={m.duplicates_removed ?? 0}
        sub="removed"
        tone={(m.duplicates_removed ?? 0) > 0 ? SEMANTIC.warning : undefined}
      />
      <KpiCard
        Icon={Database}
        label="Cache"
        value={cached ? 'HIT' : 'MISS'}
        sub={cacheSubline}
        tone={cached ? SEMANTIC.positive : SEMANTIC.info}
      />
      <KpiCard
        Icon={Timer}
        label="Analysis Time"
        value={t.total_s != null ? `${t.total_s}s` : cached ? '<1ms' : '—'}
        sub={t.fetch_s != null ? `fetch ${t.fetch_s}s` : 'cached result'}
      />
    </div>
  );
}

export function ExportToolbar({ onExport }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onExport?.('json')}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors"
      >
        <Download className="w-3 h-3" /> JSON
      </button>
      <button
        onClick={() => onExport?.('csv')}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Download className="w-3 h-3" /> CSV
      </button>
      <button
        onClick={() => onExport?.('pdf')}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Printer className="w-3 h-3" /> PDF
      </button>
    </div>
  );
}
