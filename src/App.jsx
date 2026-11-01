import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import AddTransactionModal from './components/AddTransactionModal.jsx';
import { Loader2 } from 'lucide-react';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import AccountsPage from './pages/AccountsPage.jsx';
import BudgetsPage from './pages/BudgetsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AIAssistantPage from './pages/AIAssistantPage.jsx';
import SavingsGoalsPage from './pages/SavingsGoalsPage.jsx';
import RecurringPage from './pages/RecurringPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ProfileSettingsPage from './pages/ProfileSettingsPage.jsx';

// Protected Route Wrapper
function ProtectedLayout({ children, pageTitle }) {
  const { user, loading, demoLogin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Support ?autostart=1 to jump directly into the demo workspace
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('autostart') === '1' && !user && !loading) {
      demoLogin().catch(console.error);
    }
  }, [location.search, user, loading, demoLogin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
            <span className="text-[#0B1020] font-black text-xl">F</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Loading FinSight AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 text-[#F8FAFC] dark:text-[#F8FAFC] light:text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onQuickAddTransaction={() => setQuickAddOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          setMobileOpen={setMobileOpen}
          pageTitle={pageTitle}
          onQuickAddTransaction={() => setQuickAddOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Add Transaction Modal accessible across all pages */}
      <AddTransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          // Trigger global re-render event if needed
          window.dispatchEvent(new CustomEvent('finsight_tx_created'));
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Authenticated Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout pageTitle="Dashboard">
                  <DashboardPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedLayout pageTitle="Transactions">
                  <TransactionsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedLayout pageTitle="Accounts & Portfolios">
                  <AccountsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/budgets"
              element={
                <ProtectedLayout pageTitle="Monthly Budgets">
                  <BudgetsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedLayout pageTitle="Spending Analytics & ML">
                  <AnalyticsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedLayout pageTitle="FinSight AI Financial Assistant">
                  <AIAssistantPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/savings-goals"
              element={
                <ProtectedLayout pageTitle="Savings Goals">
                  <SavingsGoalsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/recurring"
              element={
                <ProtectedLayout pageTitle="Recurring Transactions">
                  <RecurringPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedLayout pageTitle="Financial Reports">
                  <ReportsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedLayout pageTitle="Notifications & Alerts">
                  <NotificationsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedLayout pageTitle="Profile & Settings">
                  <ProfileSettingsPage />
                </ProtectedLayout>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
