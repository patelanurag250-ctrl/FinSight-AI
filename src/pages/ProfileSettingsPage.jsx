import React, { useState } from 'react';
import {
  User,
  Shield,
  CreditCard,
  DollarSign,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Lock,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../services/api.js';

export default function ProfileSettingsPage() {
  const { user, currency, currencySymbol, updateUserProfile, demoLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR');
  const [incomeTarget, setIncomeTarget] = useState(user?.monthly_income_target || 75000);
  const [savingsTarget, setSavingsTarget] = useState(user?.monthly_savings_target || 20000);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password reset inside settings
  const [newPassword, setNewPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        currency: selectedCurrency,
        monthly_income_target: parseFloat(incomeTarget) || 75000,
        monthly_savings_target: parseFloat(savingsTarget) || 20000,
      });

      const sym = selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : '₹';
      updateUserProfile({
        full_name: fullName.trim(),
        currency: selectedCurrency,
        currency_symbol: sym,
        monthly_income_target: parseFloat(incomeTarget),
        monthly_savings_target: parseFloat(savingsTarget),
      });

      setSuccessMsg('Profile and preferences updated successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setPwdSaving(true);
    setPwdMsg('');
    try {
      await api.resetPassword({ email: user.email, new_password: newPassword });
      setNewPassword('');
      setPwdMsg('Password updated successfully!');
    } catch (err) {
      alert('Failed to update password.');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('This will load fresh fintech demo accounts, transactions, and anomaly records. Proceed?')) return;
    try {
      await demoLogin();
      window.location.reload();
    } catch (err) {
      alert('Failed to reset demo workspace.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
          Account Settings & Preferences
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure default base currency, monthly targets, themes, and credentials.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Profile & Financial Preferences Form */}
      <div className="p-6 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">General Profile</h3>
            <p className="text-xs text-slate-400">Personal details and default currency</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020]/50 border border-[#293548] text-slate-500 text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Base Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="GBP">£ GBP (British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Inflow Target</label>
              <input
                type="number"
                value={incomeTarget}
                onChange={(e) => setIncomeTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Savings Goal</label>
              <input
                type="number"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#293548]/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Appearance Mode:</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl bg-[#0B1020] border border-[#293548] text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security: Password Update */}
      <div className="p-6 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Security & Authentication</h3>
            <p className="text-xs text-slate-400">Update your account password</p>
          </div>
        </div>

        {pwdMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {pwdMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="flex-1 w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={pwdSaving || !newPassword}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold bg-[#1E293B] hover:bg-[#293548] text-sky-400 border border-sky-500/30 disabled:opacity-50 cursor-pointer"
          >
            {pwdSaving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Demo Workspace Maintenance */}
      <div className="p-6 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">Demo Data & Sample Workspace</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Reset or reload realistic fintech dummy accounts, transactions, and ML anomaly test records.
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Demo Records</span>
        </button>
      </div>
    </div>
  );
}
