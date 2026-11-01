import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  PlusCircle,
  Building,
  Smartphone,
  Banknote,
  TrendingUp,
  Trash2,
  Edit2,
  Loader2,
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccountsPage() {
  const { formatCurrency, currencySymbol } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('savings');
  const [openingBalance, setOpeningBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#10B981');
  const [description, setDescription] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.getAccounts();
      setAccounts(res.accounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createAccount({
        name: name.trim(),
        type,
        opening_balance: parseFloat(openingBalance) || 0,
        account_number: accountNumber.trim(),
        color,
        description: description.trim(),
      });
      setName('');
      setOpeningBalance('');
      setAccountNumber('');
      setDescription('');
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteAccount(id);
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Cannot delete account with existing transactions.');
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'credit_card': return CreditCard;
      case 'checking': return Building;
      case 'digital_wallet': return Smartphone;
      case 'cash': return Banknote;
      case 'investment': return TrendingUp;
      default: return Wallet;
    }
  };

  const totalAssets = accounts
    .filter(a => a.type !== 'credit_card')
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const totalLiabilities = accounts
    .filter(a => a.type === 'credit_card')
    .reduce((sum, a) => sum + Math.abs(a.current_balance || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Accounts & Portfolios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your liquid assets, checking accounts, credit cards, and digital wallets.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Liquid Assets</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalAssets)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Savings, checking, cash & wallets</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Credit & Liabilities</p>
          <p className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(totalLiabilities)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Outstanding credit card balances</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Liquid Capital</p>
          <p className="text-xl font-bold text-sky-400 mt-1">{formatCurrency(totalAssets - totalLiabilities)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Net worth across connected accounts</p>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No accounts found. Create your first account to get started.
          </div>
        ) : (
          accounts.map((acc) => {
            const Icon = getAccountIcon(acc.type);
            return (
              <div
                key={acc.id}
                className="p-5 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-500/50 transition-all relative overflow-hidden"
              >
                {/* Top strip accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: acc.color || '#10B981' }}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: `${acc.color}25`, color: acc.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                          {acc.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 capitalize">
                          {acc.type.replace('_', ' ')} {acc.account_number ? `• ${acc.account_number}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(acc.id, acc.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {acc.description && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                      {acc.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#293548]/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Available Balance</span>
                    <span className="text-lg font-bold text-white dark:text-white light:text-slate-900">
                      {formatCurrency(acc.current_balance)}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] border border-[#293548] text-slate-300">
                    {acc.currency}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#172033] border border-[#293548] w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#293548]">
              <h3 className="text-base font-bold text-white">Create New Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Salary, ICICI Daily, Amex Gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="checking">Checking Account</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="digital_wallet">Digital Wallet</option>
                    <option value="cash">Cash / Petty</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Opening Balance ({currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Last 4 Digits / ID</label>
                  <input
                    type="text"
                    placeholder="•••• 4821"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Color Theme</label>
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
                  placeholder="Notes about this account..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                />
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
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
