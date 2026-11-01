import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Lock,
  ChevronDown,
  Layers,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { demoLogin, user } = useAuth();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleInstantDemo = async () => {
    setLoadingDemo(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      setLoadingDemo(false);
    }
  };

  const faqs = [
    {
      q: 'How does the Gemini AI Financial Assistant work?',
      a: 'The assistant uses Google Gemini API to analyze your actual income, expenses, budgets, and savings goals securely from our backend. It answers custom financial questions, identifies high-spending habits, and calculates potential monthly savings without ever exposing your keys or credentials.'
    },
    {
      q: 'What Machine Learning models are running in FinSight AI?',
      a: 'FinSight AI features three core ML systems: (1) NLP Text Classifier with TF-IDF for automated category prediction, (2) Time-series regression with 95% confidence intervals for next-month spending forecasts, and (3) Statistical anomaly detection (Z-score and IQR) to flag unusually large transactions.'
    },
    {
      q: 'Can I import transactions from my bank or credit cards?',
      a: 'Yes. FinSight AI includes a full CSV upload pipeline with preview, column mapping, duplicate transaction filtering, and automatic category suggestions before you commit.'
    },
    {
      q: 'Is multi-user data isolated and secure?',
      a: 'Absolutely. Every user account has an isolated tenant partition with cryptographically hashed passwords (scrypt with salt), JWT token validation, and strict backend foreign key constraints preventing unauthorized resource access.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-[#293548]/70 backdrop-blur-md sticky top-0 z-40 px-6 lg:px-12 flex items-center justify-between bg-[#0B1020]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-[#0B1020] fill-[#0B1020]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">FinSight</span>
            <span className="text-emerald-400 font-bold ml-1.5 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">AI</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#ai-intelligence" className="hover:text-violet-400 transition-colors">AI & ML Engine</a>
          <a href="#security" className="hover:text-sky-400 transition-colors">Security</a>
          <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-slate-200 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={handleInstantDemo}
                disabled={loadingDemo}
                className="hidden sm:flex px-4 py-2 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
              >
                {loadingDemo ? 'Launching Demo...' : '1-Click Demo'}
              </button>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-7xl mx-auto text-center relative overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-violet-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#172033] border border-[#293548] text-xs font-medium text-emerald-400 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>FinSight AI Platform • Next-Generation Personal Finance</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] text-white">
          Your Money, <br />
          <span className="bg-gradient-to-r from-emerald-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            Made Intelligent.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Understand your money. Control your future. Track expenses across accounts, predict next-month spending with machine learning, detect anomalous transactions, and get personalized advice from Gemini AI.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleInstantDemo}
            disabled={loadingDemo}
            className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#0B1020] shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#0B1020] fill-[#0B1020]" />
            <span>{loadingDemo ? 'Preparing Workspace...' : 'Explore Live Demo'}</span>
            <ArrowRight className="w-4 h-4 text-[#0B1020]" />
          </button>
          <Link
            to="/register"
            className="px-6 py-3.5 rounded-2xl text-sm font-semibold bg-[#172033] hover:bg-[#1E293B] text-slate-200 border border-[#293548] transition-all flex items-center gap-2"
          >
            <span>Create Free Account</span>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Scikit-Learn ML Forecasting</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
            <span>Google Gemini Contextual AI</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>Automatic CSV Bank Import</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Account & Currency Support</span>
          </div>
        </div>

        {/* Dashboard Preview Frame */}
        <div className="mt-16 relative rounded-3xl p-3 bg-gradient-to-b from-[#293548] via-[#172033] to-[#0B1020] shadow-2xl border border-[#293548]">
          <div className="rounded-2xl bg-[#0B1020] overflow-hidden border border-[#293548]/70 p-6 sm:p-8 text-left">
            <div className="flex flex-wrap items-center justify-between pb-6 border-b border-[#293548] gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Live Fintech Overview</p>
                <h3 className="text-2xl font-bold text-white mt-1">Total Net Portfolio: ₹1,11,700</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  +18.4% this month
                </span>
                <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30 text-xs font-semibold">
                  AI Grounded
                </span>
              </div>
            </div>

            {/* Preview Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
                <p className="text-xs text-slate-400">Monthly Inflow</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">₹1,13,500</p>
                <p className="text-[11px] text-slate-400 mt-1">TechCorp Salary & Consultation</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
                <p className="text-xs text-slate-400">Monthly Outflow</p>
                <p className="text-xl font-bold text-rose-400 mt-1">₹79,448</p>
                <p className="text-[11px] text-slate-400 mt-1">Rent, EMI, Groceries, Shopping</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#172033] border border-[#293548]">
                <p className="text-xs text-slate-400">Net Savings (30%)</p>
                <p className="text-xl font-bold text-sky-400 mt-1">₹34,052</p>
                <p className="text-[11px] text-emerald-400 mt-1">✓ Exceeds 20% savings target</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#293548]/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Built for Real Financial Freedom</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Everything You Need To Master Your Capital
          </h2>
          <p className="text-slate-400 text-sm mt-4">
            From granular transaction logs to machine learning models that predict next month's spending with mathematical rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#172033] border border-[#293548] hover:border-emerald-500/40 transition-all card-glow-emerald">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated ML Categorization</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Trained NLP classification engine parses transaction text, payees, and merchants to auto-categorize spending with confidence metrics.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#172033] border border-[#293548] hover:border-violet-500/40 transition-all card-glow-violet">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Spending Forecasting</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ordinary Least Squares time-series regression projects upcoming month expenditures with 95% confidence intervals and category proportions.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#172033] border border-[#293548] hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Anomaly Detection</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Statistical IQR and Z-score outlier detection flags unusually large transactions and provides actionable explanations.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#172033] border border-[#293548] hover:border-sky-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Intelligent Budget Guards</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Set monthly category thresholds. Receive real-time alerts at 50%, 75%, 90%, and 100% capacity before you overspend.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#172033] border border-[#293548] hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Account & Currency</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Consolidate Savings, Checking, Credit Cards, Cash, and Wallets. Native support for Indian Rupee (₹), USD, EUR, and GBP.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#172033] border border-[#293548] hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant CSV Bank Ingestion</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Import statements from any bank. Automatically preview rows, flag duplicates, and categorize before committing.
            </p>
          </div>
        </div>
      </section>

      {/* AI Assistant Showcase */}
      <section id="ai-intelligence" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#293548]/60">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-400 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini 2.5 Flash</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              A Financial Advisor That Knows Your Actual Balance.
            </h2>
            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              Unlike generic chatbots, the FinSight AI Assistant is grounded directly in your authentic portfolio state. Ask natural language questions and receive precise, mathematically verified answers.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>"Where did I spend the most this month?"</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>"How much can I realistically save for my Japan trip next month?"</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>"Which subscriptions can I cancel to save ₹3,000?"</span>
              </li>
            </ul>

            <div className="mt-8">
              <button
                onClick={handleInstantDemo}
                className="px-6 py-3 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 flex items-center gap-2 cursor-pointer"
              >
                <span>Try Asking the AI Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#172033] border border-violet-500/30 shadow-2xl relative">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#293548]">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <p className="text-xs font-bold text-white">FinSight Assistant</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Context: Authenticated Portfolio Grounded
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#0B1020] text-slate-300 ml-8 border border-[#293548]">
                Where did I spend the most this month, and can I still hit my ₹35,000 savings goal?
              </div>
              <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-slate-200 mr-4 space-y-2">
                <p className="font-semibold text-violet-300">Analysis for November 2026:</p>
                <p>• Your biggest expenditure is <strong>Rent & Housing (₹26,000)</strong>, followed by a one-time <strong>Reliance Digital electronics purchase (₹34,999)</strong>.</p>
                <p>• With your current inflow of <strong>₹1,13,500</strong> and outflow of <strong>₹79,448</strong>, your net savings stand at <strong>₹34,052</strong> (just ₹948 shy of your ₹35k target).</p>
                <p className="text-emerald-400 font-medium">💡 Recommendation: Delay discretionary dining over the next 4 days to comfortably surpass your goal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Credentials */}
      <section id="security" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#293548]/60">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-[#172033] via-[#111827] to-[#172033] border border-[#293548] text-center max-w-4xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Bank-Grade Privacy & Multi-User Isolation</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            Your financial figures are strictly confidential. We enforce scrypt password hashing with individual salt, HMAC-SHA256 signature tokens, and database foreign key tenant partitioning. No user can ever access another user's accounts, transactions, or AI chats.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#293548]/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Transparent Plans</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Zero Hidden Fees. 100% Value.</h2>
          <p className="text-slate-400 text-sm mt-3">Start free, upgrade anytime as your wealth expands.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="p-8 rounded-3xl bg-[#172033] border border-[#293548]">
            <h3 className="text-lg font-bold text-white">Standard Edition</h3>
            <p className="text-xs text-slate-400 mt-1">Core personal budgeting & accounts</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">₹0</span>
              <span className="text-xs text-slate-400">/ forever free</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited accounts and transactions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Category budget limits & warnings</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> CSV transaction import and export</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Basic spending analytics</li>
            </ul>
            <div className="mt-8">
              <Link
                to="/register"
                className="w-full block text-center py-3 rounded-xl text-xs font-semibold bg-[#1E293B] hover:bg-[#293548] text-white border border-[#293548]"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* Pro Intelligence Plan */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#172033] border-2 border-emerald-500/50 shadow-xl relative">
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-emerald-500 text-[#0B1020] text-[10px] font-extrabold tracking-wider uppercase">
              Most Popular
            </div>
            <h3 className="text-lg font-bold text-white">FinSight AI Pro</h3>
            <p className="text-xs text-slate-400 mt-1">Machine Learning + Gemini Intelligence</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-emerald-400">₹499</span>
              <span className="text-xs text-slate-400">/ month (Free in Beta)</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Everything in Standard Edition</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Gemini Financial Assistant chat</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Next-month spending forecasts with confidence intervals</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time statistical anomaly detection</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automated recurring transaction executor</li>
            </ul>
            <div className="mt-8">
              <button
                onClick={handleInstantDemo}
                className="w-full py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                Launch Pro Demo Workspace
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-6 lg:px-12 max-w-4xl mx-auto border-t border-[#293548]/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border border-[#293548] rounded-2xl bg-[#172033] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span>{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-[#293548]/50 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-[#293548] text-center text-xs text-slate-500 bg-[#0B1020]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-[#0B1020] font-bold text-xs">
            F
          </div>
          <span className="font-bold text-slate-300 text-sm">FinSight AI</span>
        </div>
        <p>© 2026 FinSight AI Inc. Understand Your Money. Control Your Future.</p>
        <p className="mt-1 text-[11px] text-slate-600">Educational personal finance intelligence platform. Not a licensed investment broker.</p>
      </footer>
    </div>
  );
}
