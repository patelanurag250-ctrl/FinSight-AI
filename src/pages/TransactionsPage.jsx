import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Download,
  Upload,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Tag,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AddTransactionModal from '../components/AddTransactionModal.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

export default function TransactionsPage() {
  const { formatCurrency, currencySymbol } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('DESC');

  // Metadata
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Modals & Action States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load Categories & Accounts once
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cRes, aRes] = await Promise.all([api.getCategories(), api.getAccounts()]);
        setCategories(cRes.categories || []);
        setAccounts(aRes.accounts || []);
      } catch (err) {}
    };
    loadMeta();
  }, []);

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        sort_by: sortBy,
        sort_dir: sortDir,
      };
      if (search.trim()) params.search = search.trim();
      if (categoryId) params.category_id = categoryId;
      if (accountId) params.account_id = accountId;
      if (type) params.type = type;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.getTransactions(params);
      setTransactions(res.transactions || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, accountId, type, startDate, endDate, sortBy, sortDir]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.deleteTransaction(id);
      setDeleteConfirmId(null);
      fetchTransactions(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = `/api/transactions/export-csv`;
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setAccountId('');
    setType('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortDir('DESC');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {pagination.total} transactions logged across all your accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-slate-300 border border-[#293548] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-slate-300 border border-[#293548] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Income & Expense</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Incomes Only</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              onClick={() => setSortDir(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              title={`Switch to ${sortDir === 'ASC' ? 'Descending' : 'Ascending'}`}
              className="p-2 rounded-xl bg-[#0B1020] border border-[#293548] text-slate-400 hover:text-white cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Filter Row & Clear Button */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg bg-[#0B1020] border border-[#293548] text-white text-[11px]"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg bg-[#0B1020] border border-[#293548] text-white text-[11px]"
            />
          </div>

          {(search || categoryId || accountId || type || startDate || endDate) && (
            <button
              onClick={resetFilters}
              className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020]/70 text-slate-400 border-b border-[#293548]">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Transaction & Merchant</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Account</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293548]/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No transactions match your current search criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {tx.date}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white dark:text-white light:text-slate-900">
                          {tx.title}
                        </span>
                        {tx.anomaly_flag === 1 && (
                          <span
                            title={tx.anomaly_reason || 'Unusual Spending Detected'}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold cursor-help"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Unusual
                          </span>
                        )}
                      </div>
                      {tx.merchant && (
                        <p className="text-[10px] text-slate-400">{tx.merchant}</p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        style={{ backgroundColor: `${tx.category_color}18`, color: tx.category_color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category_color }} />
                        {tx.category_name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <span className="text-[11px]">{tx.account_name}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      <span className="text-[10px] bg-[#0B1020] px-2 py-0.5 rounded border border-[#293548]">
                        {tx.payment_method || 'UPI'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDeleteConfirmId(tx.id)}
                        title="Delete Transaction"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#293548] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> ({pagination.total} items)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTransactions(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg bg-[#0B1020] border border-[#293548] disabled:opacity-40 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchTransactions(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg bg-[#0B1020] border border-[#293548] disabled:opacity-40 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#172033] border border-[#293548] p-6 rounded-3xl max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Delete Transaction?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this record? Associated account balances will be automatically recalculated.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddTransactionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => fetchTransactions(pagination.page)}
      />

      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => fetchTransactions(1)}
        accounts={accounts}
      />
    </div>
  );
}
