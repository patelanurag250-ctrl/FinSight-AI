import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart as PieIcon,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  Upload,
  PlusCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AddTransactionModal from '../components/AddTransactionModal.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

export default function DashboardPage() {
  const { user, formatCurrency, currencySymbol } = useAuth();

  const [dateRange, setDateRange] = useState('month'); // week, month, 3months, year
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');

  // Modals
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, aiRes, accRes] = await Promise.all([
        api.getDashboardAnalytics(dateRange),
        api.getAiSummary().catch(() => null),
        api.getAccounts().catch(() => ({ accounts: [] })),
      ]);
      setData(dashRes);
      setAiSummary(aiRes);
      setAccounts(accRes.accounts || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load real-time financial metrics.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const cards = data?.summaryCards || {
    totalBalance: 0,
    income: 0,
    expense: 0,
    monthlySavings: 0,
    savingsRate: 0,
    budgetUtilizationPct: 0,
    incomeChangePct: 0,
    expenseChangePct: 0
  };

  const monthlyHistory = data?.charts?.monthlyHistory || [];
  const categoryBreakdown = data?.charts?.categoryBreakdown || [];
  const spendingTrend = data?.charts?.spendingTrend || [];
  const recentTransactions = data?.recentTransactions || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Financial Health Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Welcome back, <strong className="text-slate-200">{user?.full_name}</strong>. Here is your current financial standing.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-[#172033] dark:bg-[#172033] light:bg-slate-100 p-1 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-xs">
            {['week', 'month', '3months', 'year'].map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-emerald-500 text-[#0B1020] font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900'
                }`}
              >
                {r === '3months' ? '3 Months' : r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCsvOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-slate-300 border border-[#293548] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <button
            onClick={() => setAddTxOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboard} className="hover:underline flex items-center gap-1 font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total Balance */}
        <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white dark:text-white light:text-slate-900 mt-2">
            {formatCurrency(cards.totalBalance)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            Across {accounts.length} active account{accounts.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Inflow</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-2">
            {formatCurrency(cards.income)}
          </p>
          <div className="flex items-center gap-1 text-[10px] mt-1 text-emerald-400">
            <ArrowUpRight className="w-3 h-3" />
            <span>{cards.incomeChangePct >= 0 ? `+${cards.incomeChangePct}%` : `${cards.incomeChangePct}%`} vs last month</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Outflow</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400 mt-2">
            {formatCurrency(cards.expense)}
          </p>
          <div className="flex items-center gap-1 text-[10px] mt-1 text-slate-400">
            <span>{cards.expenseChangePct >= 0 ? `+${cards.expenseChangePct}%` : `${cards.expenseChangePct}%`} vs last month</span>
          </div>
        </div>

        {/* Monthly Net Savings */}
        <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Net Savings</span>
            <PiggyBank className="w-4 h-4 text-sky-400" />
          </div>
          <p className={`text-xl font-bold mt-2 ${cards.monthlySavings >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
            {formatCurrency(cards.monthlySavings)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Inflow minus outflow</p>
        </div>

        {/* Savings Rate */}
        <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Savings Rate</span>
            <span className="text-[11px] font-bold text-emerald-400">Target 20%</span>
          </div>
          <p className="text-xl font-bold text-white dark:text-white light:text-slate-900 mt-2">
            {cards.savingsRate}%
          </p>
          <div className="w-full bg-[#0B1020] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${cards.savingsRate >= 20 ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, cards.savingsRate))}%` }}
            />
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Budget Spent</span>
            <PieIcon className="w-4 h-4 text-violet-400" />
          </div>
          <p className={`text-xl font-bold mt-2 ${cards.budgetUtilizationPct > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {cards.budgetUtilizationPct}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {cards.totalBudgetLimit > 0 ? `of ${formatCurrency(cards.totalBudgetLimit)} budget` : 'No budget set'}
          </p>
        </div>
      </div>

      {/* AI Financial Insight Callout */}
      {aiSummary && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-[#172033] to-sky-950/30 border border-violet-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-violet-300">Gemini Intelligence Insight</span>
                {aiSummary.anomalies?.length > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium">
                    {aiSummary.anomalies.length} anomaly detected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {aiSummary.topCategories?.length > 0
                  ? `Your highest expenditure this period is ${aiSummary.topCategories[0].name} (${formatCurrency(aiSummary.topCategories[0].amount)}). Projected spending next month is ${formatCurrency(aiSummary.forecast?.predictedTotal || 0)}.`
                  : 'Add more transactions to unlock automated ML trend forecasting and category recommendations.'}
              </p>
            </div>
          </div>
          <Link
            to="/ai-assistant"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <span>Ask AI Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Income vs Expenses</h3>
              <p className="text-[11px] text-slate-400">Monthly cash flow comparison over last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>Expense</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1020', borderColor: '#293548', borderRadius: 12, fontSize: 12 }}
                  formatter={(val) => [formatCurrency(val), '']}
                />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#F87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Donut Chart */}
        <div className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Expense Breakdown</h3>
            <p className="text-[11px] text-slate-400">Distribution across active categories</p>
          </div>

          <div className="h-52 w-full my-2">
            {categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No expense data recorded this month.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#10B981'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1020', borderColor: '#293548', borderRadius: 12, fontSize: 12 }}
                    formatter={(val) => [formatCurrency(val), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Mini Category Legend */}
          <div className="space-y-1.5 overflow-y-auto max-h-28 pr-1">
            {categoryBreakdown.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-300 truncate max-w-[120px]">{c.name}</span>
                </div>
                <span className="font-semibold text-white">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Spending Trend Area Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Spending Area Chart */}
        <div className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Spending Velocity</h3>
            <p className="text-[11px] text-slate-400">Cumulative day-by-day expense trajectory</p>
          </div>

          <div className="h-56 w-full">
            {spendingTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No spending data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1020', borderColor: '#293548', borderRadius: 12, fontSize: 12 }}
                    formatter={(val) => [formatCurrency(val), 'Cumulative Spent']}
                  />
                  <Area type="monotone" dataKey="cumulative" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Recent Transactions</h3>
              <p className="text-[11px] text-slate-400">Latest activity across accounts</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#293548]/50 overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No transactions yet. Click "+ Add Transaction" above or launch the Demo to see realistic data!
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: `${tx.category_color}25`, color: tx.category_color }}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white dark:text-white light:text-slate-900 truncate">
                          {tx.title}
                        </p>
                        {tx.anomaly_flag === 1 && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                            Unusual
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {tx.category_name} • {tx.account_name} • {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{tx.payment_method}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        onSuccess={fetchDashboard}
      />

      <CsvImportModal
        isOpen={csvOpen}
        onClose={() => setCsvOpen(false)}
        onSuccess={fetchDashboard}
        accounts={accounts}
      />
    </div>
  );
}
