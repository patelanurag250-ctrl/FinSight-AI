import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Loader2,
  Filter
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ReportsPage() {
  const { formatCurrency, currencySymbol, user } = useAuth();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
  const today = now.toISOString().substring(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReportSummary(startDate, endDate);
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    window.location.href = `/api/transactions/export-csv`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:bg-white print:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
            Financial Statement & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate printable statements and downloadable balance sheets for tax, audit, or review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#172033] hover:bg-[#1E293B] text-slate-200 border border-[#293548] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Statement</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="p-4 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Statement Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs font-mono"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs font-mono"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total Transactions in Range: <strong className="text-white">{report?.totalTransactions || 0}</strong>
        </div>
      </div>

      {/* Printable Statement Sheet */}
      <div className="p-8 rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between pb-6 border-b border-[#293548] dark:border-[#293548] light:border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              FinSight AI Statement
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Statement Period: <strong className="text-slate-200">{startDate}</strong> to <strong className="text-slate-200">{endDate}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p className="font-bold text-white dark:text-white light:text-slate-900">{user?.full_name}</p>
            <p>{user?.email}</p>
            <p className="font-mono mt-1 text-[11px]">Currency: {user?.currency || 'INR'} ({currencySymbol})</p>
          </div>
        </div>

        {/* Executive Metrics */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Generating balance statement...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 border border-[#293548]">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Inflow</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">
                  {formatCurrency(report?.totalIncome || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Outflow</span>
                <span className="text-lg font-bold text-rose-400 mt-1 block">
                  {formatCurrency(report?.totalExpense || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net Capital Retained</span>
                <span className="text-lg font-bold text-sky-400 mt-1 block">
                  {formatCurrency(report?.netSavings || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Savings Efficiency</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {report?.savingsRate || 0}%
                </span>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 mb-3">
                Category Expenditure Breakdown
              </h3>
              <div className="border border-[#293548] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B1020] text-slate-400 border-b border-[#293548]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Category</th>
                      <th className="py-2.5 px-4 font-semibold">Transactions</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Total Outflow</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#293548]/40">
                    {report?.categoryBreakdown?.map((c, i) => {
                      const share = report.totalExpense > 0 ? Math.round((c.amount / report.totalExpense) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td className="py-2.5 px-4 font-medium text-white">{c.name}</td>
                          <td className="py-2.5 px-4 text-slate-400">{c.count}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-200">{formatCurrency(c.amount)}</td>
                          <td className="py-2.5 px-4 text-right text-slate-400">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Account Flow Table */}
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 mb-3">
                Account Distribution
              </h3>
              <div className="border border-[#293548] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B1020] text-slate-400 border-b border-[#293548]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Account</th>
                      <th className="py-2.5 px-4 font-semibold">Type</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Outflow Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#293548]/40">
                    {report?.accountBreakdown?.map((a, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-4 font-medium text-white">{a.name}</td>
                        <td className="py-2.5 px-4 capitalize text-slate-400">{a.type}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-200">{formatCurrency(a.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature & Disclaimer Footer */}
            <div className="pt-6 border-t border-[#293548] flex items-center justify-between text-[11px] text-slate-500">
              <p>Generated by FinSight AI • Certified System Ledger</p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
