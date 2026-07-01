import { memo, useMemo } from 'react';
import { Activity, Zap, TrendingUp, Target, ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react';
import { CARD, SEMANTIC } from '../../constants/ui';

const pct = (v, d = 2) => `${v > 0 ? '+' : ''}${((v ?? 0) * 100).toFixed(d)}%`;

const Card = memo(function Card({ label, value, sub, Icon, colorClass }) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${colorClass}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</div>}
    </div>
  );
});

const SentimentBar = memo(function SentimentBar({ count, total, color, label, Icon }) {
  const p = total > 0 ? +((count / total) * 100).toFixed(1) : 0;
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-3xl font-bold tabular-nums" style={{ color }}>{count}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p}% of total</div>
      <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${p}%`, backgroundColor: color, transition: 'width 0.7s ease-out' }}
        />
      </div>
    </div>
  );
});

function MetricCards({ advanced_stats, stats }) {
  const a = advanced_stats ?? {};
  const total = useMemo(
    () => (stats?.bullish ?? 0) + (stats?.bearish ?? 0) + (stats?.neutral ?? 0),
    [stats]
  );

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          label="Avg Sentiment" Icon={Activity}
          value={pct(a.avg_sentiment)}
          sub="Mean VADER score"
          colorClass={a.avg_sentiment > 0 ? SEMANTIC.positive.text : a.avg_sentiment < 0 ? SEMANTIC.negative.text : SEMANTIC.neutral.text}
        />
        <Card
          label="Volatility" Icon={Zap}
          value={pct(a.volatility)}
          sub="Sentiment variance"
          colorClass={(a.volatility ?? 0) > 0.3 ? SEMANTIC.negative.text : (a.volatility ?? 0) > 0.15 ? SEMANTIC.warning.text : SEMANTIC.positive.text}
        />
        <Card
          label="Momentum" Icon={TrendingUp}
          value={pct(a.momentum)}
          sub="Recent vs older"
          colorClass={(a.momentum ?? 0) > 0 ? SEMANTIC.positive.text : (a.momentum ?? 0) < 0 ? SEMANTIC.negative.text : SEMANTIC.neutral.text}
        />
        <Card
          label="Consensus" Icon={Target}
          value={`${((a.consensus_strength ?? 0) * 100).toFixed(1)}%`}
          sub="Agreement level"
          colorClass={SEMANTIC.info.text}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SentimentBar count={stats?.bullish ?? 0} total={total} color={SEMANTIC.positive.hex} label="Bullish" Icon={ThumbsUp}    />
        <SentimentBar count={stats?.neutral ?? 0} total={total} color={SEMANTIC.neutral.hex} label="Neutral" Icon={MinusCircle} />
        <SentimentBar count={stats?.bearish ?? 0} total={total} color={SEMANTIC.negative.hex} label="Bearish" Icon={ThumbsDown}  />
      </div>
    </>
  );
}

export default memo(MetricCards);
