import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Trash2,
  Calendar,
  Loader2,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function BudgetsPage() {
  const { formatCurrency, currencySymbol } = useAuth();

  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [budgetData, setBudgetData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.getBudgets(month),
        api.getCategories()
      ]);
      setBudgetData(bRes);
      const expCats = (cRes.categories || []).filter(c => c.type === 'expense');
      setCategories(expCats);
      if (expCats.length > 0 && !selectedCatId) {
        setSelectedCatId(expCats[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!selectedCatId || !limitAmount) return;
    setSubmitting(true);
    setError('');
    try {
      await api.saveBudget({
        category_id: selectedCatId,
        period_month: month,
        limit_amount: parseFloat(limitAmount),
        alert_threshold_pct: parseFloat(alertThreshold) || 80,
      });
      setLimitAmount('');
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      setError(err.message || 'Failed to save budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget limit?')) return;
    try {
      await api.deleteBudget(id);
      fetchBudgets();
    } catch (err) {
      alert(err.message || 'Failed to delete budget.');
    }
  };

  const budgets = budgetData?.budgets || [];
  const totalBudget = budgetData?.totalBudget || 0;
  const totalSpent = budgetData?.totalSpent || 0;
  const totalRemaining = budgetData?.totalRemaining || 0;
  const overallPercentage = budgetData?.overallPercentage || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Budget Management & Spending Limits
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Keep category expenditures within strict financial guardrails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#172033] border border-[#293548] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Set Category Limit</span>
          </button>
        </div>
      </div>

      {/* Monthly Budget Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Budget</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalBudget)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Across all planned categories</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Spent</p>
          <p className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(totalSpent)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Month-to-date outflows</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Remaining Buffer</p>
          <p className={`text-xl font-bold mt-1 ${totalRemaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalRemaining)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Available to spend safely</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Utilization</p>
          <p className={`text-xl font-bold mt-1 ${overallPercentage > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {overallPercentage}%
          </p>
          <div className="w-full bg-[#0B1020] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${overallPercentage >= 100 ? 'bg-rose-500' : overallPercentage >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budgets List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No budget limits defined for {month}. Click "+ Set Category Limit" above to configure your guardrails.
          </div>
        ) : (
          budgets.map((b) => {
            const isExceeded = b.percentageUsed >= 100;
            const isWarning = b.percentageUsed >= b.alert_threshold_pct && !isExceeded;
            const momDiff = b.spent - b.previousMonthSpent;

            return (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category_color }} />
                      <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                        {b.category_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      {isExceeded ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Exceeded ({b.percentageUsed}%)
                        </span>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Near Limit ({b.percentageUsed}%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          On Track ({b.percentageUsed}%)
                        </span>
                      )}

                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Spending progress bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Spent: <strong className="text-white">{formatCurrency(b.spent)}</strong></span>
                      <span className="text-slate-400">Limit: <strong className="text-white">{formatCurrency(b.limit_amount)}</strong></span>
                    </div>

                    <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, b.percentageUsed))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer comparison */}
                <div className="pt-3 border-t border-[#293548]/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Remaining: <strong className={b.remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(b.remaining)}</strong>
                  </span>

                  <span className={`text-[10px] flex items-center gap-0.5 ${momDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {momDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {momDiff > 0 ? `+${formatCurrency(momDiff)}` : `${formatCurrency(momDiff)}`} vs last mo
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#172033] border border-[#293548] w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#293548]">
              <h3 className="text-base font-bold text-white">Set Category Spending Limit</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expense Category</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Spending Limit ({currencySymbol}) *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 15000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Alert Threshold (%)</label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="50">50% Consumed (Early heads-up)</option>
                  <option value="75">75% Consumed (Recommended)</option>
                  <option value="85">85% Consumed</option>
                  <option value="95">95% Consumed</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#293548]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Set Limit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
