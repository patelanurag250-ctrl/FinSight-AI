import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#172033] border border-[#293548] rounded-3xl p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-[#0B1020] fill-[#0B1020]" />
          </div>
          <span className="text-xl font-extrabold text-white">FinSight <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">AI</span></span>
        </Link>

        {submitted ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Reset Link Dispatched</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              If an account is associated with <strong>{email}</strong>, a secure reset token has been dispatched. Check your inbox and spam folder.
            </p>
            <div className="pt-4">
              <Link to="/login" className="text-xs text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-white">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">Enter your registered email to receive recovery instructions</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Send Reset Link</span>
              </button>
            </form>

            <div className="mt-6">
              <Link to="/login" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Back to Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
