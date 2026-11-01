import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCheck,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {}
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await api.clearNotifications();
      setNotifications([]);
    } catch (err) {}
  };

  const getIcon = (severity, type) => {
    if (severity === 'danger' || type === 'budget_alert') return AlertTriangle;
    if (severity === 'warning' || type === 'anomaly') return AlertTriangle;
    if (severity === 'success' || type === 'goal_milestone') return CheckCircle2;
    return Bell;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Notification Center & Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            System notices, budget guardrail warnings, unusual transaction flags, and payment reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-slate-200 border border-[#293548] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All Read</span>
          </button>

          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-[#172033] rounded-3xl border border-[#293548]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading notification stream...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-[#172033] rounded-3xl border border-[#293548]">
            <Bell className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-white">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No alerts or unread notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = getIcon(n.severity, n.type);
            const isUnread = n.is_read === 0;

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-[#172033] border-emerald-500/40 shadow-sm'
                    : 'bg-[#111827] border-[#293548] opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.severity === 'danger'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : n.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : n.severity === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white dark:text-white light:text-slate-900">
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {n.link && (
                    <Link
                      to={n.link}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 cursor-pointer"
                      title="Mark read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
