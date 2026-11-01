import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  BarChart3,
  Sparkles,
  Target,
  Clock,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ mobileOpen, setMobileOpen, unreadNotifications = 0, onQuickAddTransaction }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Accounts', path: '/accounts', icon: Wallet },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'AI', badgeColor: 'bg-violet-500/20 text-violet-400 border border-violet-500/30' },
    { name: 'Savings Goals', path: '/savings-goals', icon: Target },
    { name: 'Recurring', path: '/recurring', icon: Clock },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadNotifications > 0 ? unreadNotifications : null, badgeColor: 'bg-emerald-500 text-black font-bold' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111827] dark:bg-[#111827] light:bg-white border-r border-[#293548] dark:border-[#293548] light:border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#293548] dark:border-[#293548] light:border-slate-200">
            <NavLink to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="w-5 h-5 text-[#0B1020] fill-[#0B1020]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white dark:text-white light:text-slate-900">FinSight</span>
                <span className="text-emerald-400 font-bold ml-1 text-sm bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">AI</span>
              </div>
            </NavLink>
          </div>

          {/* Quick Add Button */}
          <div className="p-4">
            <button
              onClick={() => {
                if (onQuickAddTransaction) onQuickAddTransaction();
                if (setMobileOpen) setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#0B1020] shadow-md shadow-emerald-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add Transaction</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 dark:text-emerald-400 light:text-emerald-600 border border-emerald-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-[#172033] dark:hover:bg-[#172033] light:hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile & Sign Out */}
        <div className="p-4 border-t border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#172033] dark:bg-[#172033] light:bg-slate-100 border border-[#293548]/80 dark:border-[#293548]/80 light:border-slate-200">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white dark:text-white light:text-slate-900 truncate">
                  {user?.full_name || 'FinSight User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
