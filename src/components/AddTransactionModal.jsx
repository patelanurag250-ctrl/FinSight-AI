import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const { currencySymbol } = useAuth();

  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [predictedCat, setPredictedCat] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [anomalyWarning, setAnomalyWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const loadPrereqs = async () => {
      try {
        const [accRes, catRes] = await Promise.all([api.getAccounts(), api.getCategories()]);
        setAccounts(accRes.accounts || []);
        if (accRes.accounts?.length > 0 && !accountId) {
          setAccountId(accRes.accounts[0].id);
        }
        setCategories(catRes.categories || []);
        if (catRes.categories?.length > 0 && !categoryId) {
          const defaultCat = catRes.categories.find(c => c.type === type) || catRes.categories[0];
          setCategoryId(defaultCat.id);
        }
      } catch (err) {
        console.error('Failed to load accounts/categories:', err);
      }
    };
    loadPrereqs();
  }, [isOpen]);

  // Debounced ML Category Prediction
  useEffect(() => {
    if (!title || title.trim().length < 2) {
      setPredictedCat(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const pred = await api.predictCategory({ title, merchant, description });
        if (pred && pred.categoryId) {
          setPredictedCat(pred);
          // If category not manually selected, auto-select predicted
          if (!categoryId || categoryId === 'cat_other_exp') {
            setCategoryId(pred.categoryId);
          }
        }
      } catch (err) {
      } finally {
        setIsPredicting(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [title, merchant]);

  // Check for large anomaly on amount change
  useEffect(() => {
    const num = parseFloat(amount);
    if (!isNaN(num) && num > 50000 && type === 'expense') {
      setAnomalyWarning(`Unusually high expense (${currencySymbol}${num.toLocaleString('en-IN')}). Our ML model will flag this for review.`);
    } else {
      setAnomalyWarning(null);
    }
  }, [amount, type, currencySymbol]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !amount || !accountId) {
      setError('Please provide title, amount, and account.');
      return;
    }

    const parsedAmount = Math.abs(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const tagList = tags
        ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

      await api.createTransaction({
        account_id: accountId,
        category_id: categoryId || 'cat_other_exp',
        type,
        amount: parsedAmount,
        date,
        title: title.trim(),
        description: description.trim(),
        merchant: merchant.trim(),
        payment_method: paymentMethod,
        tags: tagList,
      });

      // Reset
      setTitle('');
      setAmount('');
      setMerchant('');
      setDescription('');
      setTags('');
      setPredictedCat(null);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#293548] dark:border-[#293548] light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">Add New Transaction</h2>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              ML Auto-Classify
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-[#1E293B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-100 rounded-xl border border-[#293548] dark:border-[#293548] light:border-slate-200">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const expCat = categories.find(c => c.type === 'expense');
                if (expCat) setCategoryId(expCat.id);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const incCat = categories.find(c => c.type === 'income');
                if (incCat) setCategoryId(incCat.id);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* Amount & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Amount ({currencySymbol}) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Title with ML indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-400">Transaction Title / Payee *</label>
              {isPredicting && (
                <span className="text-[10px] text-violet-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  ML Categorizing...
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. Starbucks, Uber Ride, इंडिगो Tickets, Indiranagar Rent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* ML Predicted Category Pill */}
          {predictedCat && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="text-slate-300">
                  ML Prediction: <strong className="text-violet-300">{predictedCat.categoryName}</strong> ({Math.round(predictedCat.confidence * 100)}% confidence)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCategoryId(predictedCat.categoryId)}
                className="px-2 py-0.5 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                Accept
              </button>
            </div>
          )}

          {/* Anomaly Warning */}
          {anomalyWarning && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{anomalyWarning}</span>
            </div>
          )}

          {/* Category & Account Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                required
              >
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Account *</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                required
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({currencySymbol}{a.current_balance?.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Merchant & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Merchant / Store (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Amazon, Blinkit, Swiggy"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="NetBanking">Net Banking</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. personal, vacation, tax_deductible"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Description (Optional)</label>
            <textarea
              rows="2"
              placeholder="Add extra context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548] dark:border-[#293548] light:border-slate-200 text-white dark:text-white light:text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#293548] dark:border-[#293548] light:border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#1E293B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
