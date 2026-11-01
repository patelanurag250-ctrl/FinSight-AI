import React, { useState, useEffect } from 'react';
import {
  Clock,
  PlusCircle,
  Repeat,
  CheckCircle2,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function RecurringPage() {
  const { formatCurrency, currencySymbol } = useAuth();

  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState('');

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const [rRes, aRes, cRes] = await Promise.all([
        api.getRecurring(),
        api.getAccounts(),
        api.getCategories()
      ]);
      setItems(rRes.recurring || []);
      setAccounts(aRes.accounts || []);
      if (aRes.accounts?.length > 0 && !accountId) setAccountId(aRes.accounts[0].id);

      const expCats = (cRes.categories || []).filter(c => c.type === 'expense');
      setCategories(expCats);
      if (expCats.length > 0 && !categoryId) setCategoryId(expCats[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !amount || !accountId || !categoryId) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createRecurring({
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        account_id: accountId,
        category_id: categoryId,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
      });
      setTitle('');
      setAmount('');
      setIsAddOpen(false);
      fetchRecurring();
    } catch (err) {
      setError(err.message || 'Failed to create recurring rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await api.updateRecurring(item.id, { is_active: item.is_active ? 0 : 1 });
      fetchRecurring();
    } catch (err) {
      alert('Failed to toggle status.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this recurring rule?')) return;
    try {
      await api.deleteRecurring(id);
      fetchRecurring();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const handleProcessDue = async () => {
    setProcessing(true);
    setProcessMsg('');
    try {
      const res = await api.processRecurring();
      setProcessMsg(res.message);
      fetchRecurring();
    } catch (err) {
      setProcessMsg('Processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  const totalMonthlyCommitment = items
    .filter(i => i.is_active === 1 && i.type === 'expense' && i.frequency === 'monthly')
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Recurring Bills & Subscriptions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automate routine rent, utilities, subscriptions, and payroll credits with idempotency protection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessDue}
            disabled={processing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-sky-400 border border-sky-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Process Due Today</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Recurring Rule</span>
          </button>
        </div>
      </div>

      {processMsg && (
        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-center justify-between">
          <span>{processMsg}</span>
          <button onClick={() => setProcessMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Summary Banner */}
      <div className="p-4 rounded-3xl bg-[#172033] border border-[#293548] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Recurring Outflow</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalMonthlyCommitment)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{items.filter(i => i.is_active === 1).length} active recurring rules running</span>
        </div>
      </div>

      {/* List */}
      <div className="rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020]/70 text-slate-400 border-b border-[#293548]">
              <tr>
                <th className="py-3 px-4 font-semibold">Title</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Frequency</th>
                <th className="py-3 px-4 font-semibold">Next Due</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293548]/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading recurring schedules...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No recurring transactions set up yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1E293B]/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white dark:text-white light:text-slate-900">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{item.account_name}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-300">{item.category_name}</span>
                    </td>

                    <td className="py-3 px-4 capitalize text-slate-400 font-medium">
                      {item.frequency}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-sky-400">
                      {item.next_due_date}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          item.is_active === 1
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.is_active === 1 ? 'Active' : 'Paused'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Recurring Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#172033] border border-[#293548] w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#293548]">
              <h3 className="text-base font-bold text-white">Create Recurring Rule</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Rent, Netflix Family, Gym Membership"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">First Due Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
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
                  <span>Schedule Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
