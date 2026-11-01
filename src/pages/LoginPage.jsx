import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to launch demo workspace.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-md bg-[#172033] border border-[#293548] rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-6 h-6 text-[#0B1020] fill-[#0B1020]" />
            </div>
            <span className="text-xl font-extrabold text-white">FinSight <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">AI</span></span>
          </Link>
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to your private financial workspace</p>
        </div>

        {/* Demo Shortcut */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-violet-500/20 hover:from-emerald-500/30 hover:to-violet-500/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            {demoLoading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            <span>1-Click Instant Demo Login (Pre-loaded data)</span>
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-[#293548]" />
          <span className="px-3 text-[11px] text-slate-400 font-medium">Or continue with credentials</span>
          <div className="flex-grow border-t border-[#293548]" />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-sky-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:underline font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
