import React, { useState, useEffect } from 'react';
import {
  Target,
  PlusCircle,
  PiggyBank,
  Calendar,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SavingsGoalsPage() {
  const { formatCurrency, currencySymbol } = useAuth();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency');
  const [color, setColor] = useState('#10B981');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Contribution Modal
  const [contribGoal, setContribGoal] = useState(null);
  const [contribAmt, setContribAmt] = useState('');
  const [contribNotes, setContribNotes] = useState('');
  const [contribLoading, setContribLoading] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.getSavingsGoals();
      setGoals(res.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createSavingsGoal({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: targetDate,
        category,
        color,
        description: description.trim(),
      });
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDescription('');
      setIsAddOpen(false);
      fetchGoals();
    } catch (err) {
      setError(err.message || 'Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contribGoal || !contribAmt) return;
    setContribLoading(true);
    try {
      await api.contributeToGoal(contribGoal.id, {
        amount: parseFloat(contribAmt),
        notes: contribNotes.trim(),
      });
      setContribGoal(null);
      setContribAmt('');
      setContribNotes('');
      fetchGoals();
    } catch (err) {
      alert(err.message || 'Contribution failed.');
    } finally {
      setContribLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm('Remove this savings goal?')) return;
    try {
      await api.deleteSavingsGoal(id);
      fetchGoals();
    } catch (err) {
      alert(err.message || 'Failed to delete goal.');
    }
  };

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Savings Goals & Milestones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track capital allocation toward emergency funds, travel, and major acquisitions.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Progress Bar */}
      <div className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Savings Progress</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white dark:text-white light:text-slate-900">{formatCurrency(totalSaved)}</span>
              <span className="text-xs text-slate-400">of {formatCurrency(totalTarget)} target</span>
            </div>
          </div>
          <span className="text-lg font-bold text-emerald-400">
            {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% achieved
          </span>
        </div>

        <div className="w-full bg-[#0B1020] h-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-500"
            style={{ width: `${totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading savings goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No active savings goals. Click "+ New Savings Goal" to define your targets!
          </div>
        ) : (
          goals.map((g) => (
            <div
              key={g.id}
              className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color || '#10B981' }} />
                    <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">{g.name}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {g.description && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{g.description}</p>
                )}

                {/* Progress Metric */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Saved: <strong className="text-white">{formatCurrency(g.current_amount)}</strong></span>
                    <span className="text-slate-400">Target: <strong className="text-white">{formatCurrency(g.target_amount)}</strong></span>
                  </div>

                  <div className="w-full bg-[#0B1020] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        backgroundColor: g.color || '#10B981',
                        width: `${g.progressPct}%`
                      }}
                    />
                  </div>
                </div>

                {/* Calculation Info */}
                <div className="p-3 rounded-2xl bg-[#0B1020]/60 border border-[#293548] text-xs space-y-1 mb-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Deadline:</span>
                    <strong className="text-slate-200">{g.target_date}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Monthly Needed:</span>
                    <strong className="text-emerald-400">{formatCurrency(g.monthlyNeeded)}/mo</strong>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setContribGoal(g)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#1E293B] hover:bg-[#293548] text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contribution</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#172033] border border-[#293548] w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#293548]">
              <h3 className="text-base font-bold text-white">Create Savings Goal</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Goal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 6-Month Emergency Fund, Japan Trip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 250000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Starting Saved ({currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Date *</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Theme Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-8 rounded-xl bg-[#0B1020] border border-[#293548] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Why this goal matters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#293548]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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
                  <span>Save Goal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {contribGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#172033] border border-[#293548] w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#293548]">
              <h3 className="text-base font-bold text-white">Contribute to {contribGoal.name}</h3>
              <button onClick={() => setContribGoal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contribution Amount ({currencySymbol}) *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5000"
                  value={contribAmt}
                  onChange={(e) => setContribAmt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. November salary savings"
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#293548]">
                <button
                  type="button"
                  onClick={() => setContribGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contribLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {contribLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Contribution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
