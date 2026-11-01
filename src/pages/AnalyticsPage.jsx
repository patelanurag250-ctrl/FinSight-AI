import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Building,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AnalyticsPage() {
  const { formatCurrency, currencySymbol } = useAuth();

  const [loading, setLoading] = useState(true);
  const [deepDive, setDeepDive] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [dashboardCharts, setDashboardCharts] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [deepRes, foreRes, anomRes, dashRes] = await Promise.all([
          api.getDeepDiveAnalytics(),
          api.getForecast(),
          api.getAnomalies(),
          api.getDashboardAnalytics('3months'),
        ]);
        setDeepDive(deepRes);
        setForecast(foreRes);
        setAnomalies(anomRes.anomalies || []);
        setDashboardCharts(dashRes.charts);
      } catch (err) {
        console.error('Analytics loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const dayOfWeekData = deepDive?.dayOfWeekData || [];
  const topMerchants = deepDive?.topMerchants || [];
  const accountDistribution = deepDive?.accountDistribution || [];
  const monthlyHistory = dashboardCharts?.monthlyHistory || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
          Financial Intelligence & ML Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Mathematical spending patterns, statistical anomalies, and machine learning forecast projections.
        </p>
      </div>

      {/* Machine Learning Forecast Card */}
      {forecast && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-[#172033] to-[#172033] border border-violet-500/30 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Next Month ML Spending Forecast</h3>
                  <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2 py-0.5 rounded-full font-bold">
                    OLS Time-Series Model
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Trained on {forecast.historicalMonths} months of your transaction trajectory. Trend: <strong className="text-slate-200 capitalize">{forecast.historicalTrend}</strong>.
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Projected Outflow</p>
              <p className="text-2xl font-extrabold text-violet-300 mt-0.5">
                {formatCurrency(forecast.predictedTotal)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0B1020]/70 border border-[#293548] text-xs">
            <div>
              <span className="text-slate-400">95% Confidence Lower Bound:</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                {formatCurrency(forecast.confidenceRange?.lower || 0)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Expected Mean Forecast:</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {formatCurrency(forecast.predictedTotal)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">95% Confidence Upper Bound:</span>
              <p className="text-sm font-bold text-rose-400 mt-0.5">
                {formatCurrency(forecast.confidenceRange?.upper || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Day of Week Pattern & Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Chart */}
        <div className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Spending by Day of Week</h3>
            <p className="text-[11px] text-slate-400">Identifies weekly consumer peaks (e.g., weekend dining vs weekdays)</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1020', borderColor: '#293548', borderRadius: 12, fontSize: 12 }}
                  formatter={(val) => [formatCurrency(val), 'Total Spent']}
                />
                <Bar dataKey="total" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Merchants List */}
        <div className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Top Merchants & Payees</h3>
            <p className="text-[11px] text-slate-400">Where your discretionary and recurring capital flows most</p>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {topMerchants.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">No merchant records logged yet.</div>
            ) : (
              topMerchants.map((m, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#0B1020]/60 border border-[#293548] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-[11px]">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white dark:text-white light:text-slate-900">{m.merchant}</p>
                      <p className="text-[10px] text-slate-400">{m.visit_count} transaction{m.visit_count === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-200">{formatCurrency(m.total_spent)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Monthly Savings Line Chart & Anomaly Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Monthly Savings Trend */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Net Monthly Savings Curve</h3>
            <p className="text-[11px] text-slate-400">Visualizing positive capital retention over past 6 months</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1020', borderColor: '#293548', borderRadius: 12, fontSize: 12 }}
                  formatter={(val) => [formatCurrency(val), 'Net Savings']}
                />
                <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flagged Anomalies Box */}
        <div className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Anomaly Audit Log</h3>
            </div>
            <p className="text-[11px] text-slate-400">Transactions deviating from statistical baseline</p>
          </div>

          <div className="space-y-2.5 my-3 overflow-y-auto max-h-56 pr-1">
            {anomalies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-70" />
                No statistical outliers detected. All expenses match baseline.
              </div>
            ) : (
              anomalies.map((anom) => (
                <div key={anom.id} className="p-3 rounded-2xl bg-[#0B1020] border border-amber-500/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{anom.title}</span>
                    <span className="font-bold text-rose-400">{formatCurrency(anom.amount)}</span>
                  </div>
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    {anom.anomaly_reason || 'Deviation > 2.5 standard deviations from category median.'}
                  </p>
                  <span className="text-[10px] text-slate-500 block">{anom.date} • {anom.category_name}</span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-[#293548] text-[11px] text-slate-400 text-center">
            Statistical Z-Score & IQR Outlier Engine
          </div>
        </div>
      </div>
    </div>
  );
}
