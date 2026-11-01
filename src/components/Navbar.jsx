import React, { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, Sparkles, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../services/api.js';

export default function Navbar({ setMobileOpen, pageTitle, onQuickAddTransaction }) {
  const { user, currency, currencySymbol } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const data = await api.getNotifications();
        if (isMounted) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        // Silently ignore if not logged in
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {}
  };

  return (
    <header className="h-16 px-4 lg:px-8 border-b border-[#293548] dark:border-[#293548] light:border-slate-200 bg-[#0B1020]/90 dark:bg-[#0B1020]/90 light:bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-[#172033] dark:hover:bg-[#172033] light:hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            {pageTitle || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right: Actions, AI Status, Theme Toggle, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Currency Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#172033] dark:bg-[#172033] light:bg-slate-100 border border-[#293548] dark:border-[#293548] light:border-slate-300 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 font-mono">
          <span className="text-emerald-400 font-bold">{currencySymbol}</span>
          <span>{currency}</span>
        </div>

        {/* AI Assistant Quick Link */}
        <Link
          to="/ai-assistant"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask FinSight AI</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-[#172033] dark:hover:bg-[#172033] light:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-[#172033] dark:hover:bg-[#172033] light:hover:bg-slate-100 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B1020]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#293548] dark:border-[#293548] light:border-slate-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white dark:text-white light:text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-emerald-500 text-black px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#293548]/50 dark:divide-[#293548]/50 light:divide-slate-100 max-h-72 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No notifications yet.</div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${n.severity === 'danger' ? 'text-rose-400' : n.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300 dark:text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-[#293548] dark:border-[#293548] light:border-slate-200 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
                >
                  <span>View all notifications</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
