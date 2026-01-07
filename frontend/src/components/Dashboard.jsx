import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, MinusCircle, ThumbsUp, ThumbsDown, Signal, Newspaper, Target, Calendar, AlertTriangle, Clock, Activity, Zap, TrendingDown as TrendDown } from 'lucide-react';

const Dashboard = ({ data, ticker }) => {
  const { verdict, confidence_score, stats, top_comments, stock_info, advanced_stats } = data;

  const totalArticles = stats.bullish + stats.bearish + stats.neutral;
  const bullishPercent = ((stats.bullish / totalArticles) * 100).toFixed(1);
  const bearishPercent = ((stats.bearish / totalArticles) * 100).toFixed(1);
  const neutralPercent = ((stats.neutral / totalArticles) * 100).toFixed(1);

  const pieData = [
    { name: 'Bullish', value: stats.bullish, color: '#16a34a' },
    { name: 'Neutral', value: stats.neutral, color: '#6b7280' },
    { name: 'Bearish', value: stats.bearish, color: '#dc2626' }
  ];

  const sourcesData = top_comments.reduce((acc, comment) => {
    const source = comment.source;
    if (!acc[source]) {
      acc[source] = { bullish: 0, neutral: 0, bearish: 0, total: 0 };
    }
    acc[source].total++;
    if (comment.sentiment > 0.05) acc[source].bullish++;
    else if (comment.sentiment < -0.05) acc[source].bearish++;
    else acc[source].neutral++;
    return acc;
  }, {});

  const sourceBreakdown = Object.entries(sourcesData).map(([name, data]) => ({
    name,
    bullish: data.bullish,
    neutral: data.neutral,
    bearish: data.bearish,
    total: data.total
  }));

  const sentimentTrend = top_comments
    .slice(0, 10)
    .map((comment, idx) => ({
      index: idx + 1,
      sentiment: comment.sentiment * 100,
      title: comment.text.slice(0, 30)
    }));

  const getVerdictColor = (verdict) => {
    if (verdict.includes('STRONG BUY')) return 'text-green-700 bg-green-50 border-green-200';
    if (verdict.includes('BUY')) return 'text-green-600 bg-green-50 border-green-200';
    if (verdict.includes('STRONG SELL')) return 'text-red-700 bg-red-50 border-red-200';
    if (verdict.includes('SELL')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const getVerdictIcon = (verdict) => {
    if (verdict.includes('BUY')) return <TrendingUp className="w-6 h-6" />;
    if (verdict.includes('SELL')) return <TrendingDown className="w-6 h-6" />;
    return <MinusCircle className="w-6 h-6" />;
  };

  const confidenceLevel = confidence_score > 0.7 ? 'High' : confidence_score > 0.4 ? 'Moderate' : 'Low';
  const signalStrength = Math.abs(confidence_score) > 0.15 ? 'Strong' : Math.abs(confidence_score) > 0.05 ? 'Moderate' : 'Weak';

  const getTimeColor = (hoursOld) => {
    if (hoursOld < 6) return 'text-green-600 bg-green-50';
    if (hoursOld < 24) return 'text-blue-600 bg-blue-50';
    if (hoursOld < 72) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  const radarData = advanced_stats ? [
    { metric: 'Sentiment', value: ((advanced_stats.avg_sentiment + 1) / 2) * 100 },
    { metric: 'Consensus', value: advanced_stats.consensus_strength * 100 },
    { metric: 'Recency', value: (advanced_stats.articles_24h / Math.max(advanced_stats.articles_7d, 1)) * 100 },
    { metric: 'Volume', value: Math.min((totalArticles / 50) * 100, 100) },
    { metric: 'Stability', value: Math.max(0, (1 - advanced_stats.volatility) * 100) }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Avg Sentiment</h4>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${advanced_stats?.avg_sentiment > 0 ? 'text-green-600' : advanced_stats?.avg_sentiment < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {advanced_stats?.avg_sentiment > 0 ? '+' : ''}{((advanced_stats?.avg_sentiment || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Overall market tone</div>
        </div>

        <div className="p-5 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Volatility</h4>
            <Zap className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${(advanced_stats?.volatility || 0) > 0.3 ? 'text-red-600' : (advanced_stats?.volatility || 0) > 0.15 ? 'text-amber-600' : 'text-green-600'}`}>
            {((advanced_stats?.volatility || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Sentiment variance</div>
        </div>

        <div className="p-5 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Momentum</h4>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${(advanced_stats?.momentum || 0) > 0 ? 'text-green-600' : (advanced_stats?.momentum || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {advanced_stats?.momentum > 0 ? '+' : ''}{((advanced_stats?.momentum || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Recent vs older sentiment</div>
        </div>

        <div className="p-5 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Consensus</h4>
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {((advanced_stats?.consensus_strength || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Agreement level</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Market Strength Radar</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#1f2937" fill="#1f2937" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Time-Based Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-700">Last 24 Hours</div>
                <div className="text-xs text-gray-500 mt-1">{advanced_stats?.articles_24h || 0} articles</div>
              </div>
              <div className={`text-2xl font-bold ${(advanced_stats?.sentiment_24h || 0) > 0 ? 'text-green-600' : (advanced_stats?.sentiment_24h || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {advanced_stats?.sentiment_24h > 0 ? '+' : ''}{((advanced_stats?.sentiment_24h || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-700">Last 7 Days</div>
                <div className="text-xs text-gray-500 mt-1">{advanced_stats?.articles_7d || 0} articles</div>
              </div>
              <div className={`text-2xl font-bold ${(advanced_stats?.sentiment_7d || 0) > 0 ? 'text-green-600' : (advanced_stats?.sentiment_7d || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {advanced_stats?.sentiment_7d > 0 ? '+' : ''}{((advanced_stats?.sentiment_7d || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <div className="text-sm font-semibold text-blue-900">News Coverage</div>
              </div>
              <div className="text-xs text-blue-700">
                {advanced_stats?.articles_24h > 0 ? 'Active' : 'Limited'} recent coverage with {
                  ((advanced_stats?.articles_24h / Math.max(advanced_stats?.articles_7d, 1)) * 100).toFixed(0)
                }% from last 24h
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-6 rounded-lg border-2 ${getVerdictColor(verdict)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {getVerdictIcon(verdict)}
                <h3 className="text-2xl font-bold">{verdict}</h3>
              </div>
              <p className="text-sm opacity-75">Market Recommendation for {ticker}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{(confidence_score * 100).toFixed(1)}%</div>
              <div className="text-sm opacity-75">Confidence</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs opacity-75 mb-1">Signal Strength</div>
              <div className="font-semibold">{signalStrength}</div>
            </div>
            <div>
              <div className="text-xs opacity-75 mb-1">Data Quality</div>
              <div className="font-semibold">{confidenceLevel}</div>
            </div>
            <div>
              <div className="text-xs opacity-75 mb-1">Articles Analyzed</div>
              <div className="font-semibold">{totalArticles}</div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Stock Information</h3>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Company</div>
              <div className="font-medium text-gray-900">{stock_info?.name || ticker}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Sector</div>
              <div className="font-medium text-gray-900">{stock_info?.sector || 'N/A'}</div>
            </div>
            {stock_info?.current_price > 0 && (
              <div>
                <div className="text-xs text-gray-500">Current Price</div>
                <div className="font-medium text-gray-900">${stock_info.current_price.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">Bullish Sentiment</h4>
            <ThumbsUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.bullish}</div>
          <div className="text-sm text-gray-500">{bullishPercent}% of total</div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full" style={{ width: `${bullishPercent}%` }}></div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">Neutral Sentiment</h4>
            <MinusCircle className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-3xl font-bold text-gray-600 mb-2">{stats.neutral}</div>
          <div className="text-sm text-gray-500">{neutralPercent}% of total</div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-600 rounded-full" style={{ width: `${neutralPercent}%` }}></div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">Bearish Sentiment</h4>
            <ThumbsDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">{stats.bearish}</div>
          <div className="text-sm text-gray-500">{bearishPercent}% of total</div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 rounded-full" style={{ width: `${bearishPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-gray-700">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Source Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceBreakdown}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bullish" stackId="a" fill="#16a34a" />
                <Bar dataKey="neutral" stackId="a" fill="#6b7280" />
                <Bar dataKey="bearish" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Sentiment Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sentimentTrend}>
              <XAxis dataKey="index" label={{ value: 'Article #', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                        <p className="text-sm font-medium">{payload[0].payload.title}...</p>
                        <p className="text-sm text-gray-600">Score: {payload[0].value.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="sentiment" stroke="#1f2937" strokeWidth={2} dot={{ fill: '#1f2937', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Latest Headlines</h3>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{top_comments.length} articles</span>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {top_comments.map((comment, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-2">{comment.text}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-700">
                      {comment.source}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      comment.score > 0.05 ? 'bg-green-100 text-green-700' : 
                      comment.score < -0.05 ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {comment.score > 0 ? '+' : ''}{(comment.score * 100).toFixed(1)}%
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getTimeColor(comment.hours_old)}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {comment.time_ago}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">{comment.text}</p>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-700">
                      {comment.source}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      comment.sentiment > 0.05 ? 'bg-green-100 text-green-700' : 
                      comment.sentiment < -0.05 ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {comment.sentiment > 0 ? '+' : ''}{(comment.sentiment * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Analysis Methodology</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <Signal className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>VADER sentiment analysis on aggregated news</span>
            </li>
            <li className="flex items-start space-x-2">
              <Newspaper className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>Multi-source data from 7 financial news providers</span>
            </li>
            <li className="flex items-start space-x-2">
              <Target className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>Weighted scoring with recency bias</span>
            </li>
            <li className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>Real-time data updated continuously</span>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Disclaimer</span>
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            This analysis is for informational purposes only and should not be considered financial advice. 
            Sentiment scores are derived from automated analysis of news articles and may not reflect actual market conditions. 
            Always conduct your own research and consult with financial professionals before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
