import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CsvImportModal({ isOpen, onClose, onSuccess, accounts = [] }) {
  const { currencySymbol } = useAuth();

  const [file, setFile] = useState(null);
  const [csvContent, setCsvContent] = useState('');
  const [parsing, setParsing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      setCsvContent(text);
      setParsing(true);
      try {
        const preview = await api.previewCsv(text);
        setPreviewData(preview);
      } catch (err) {
        setError(err.message || 'Failed to parse CSV file.');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(selected);
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.allRows) return;
    setImporting(true);
    setError('');
    try {
      const res = await api.confirmCsv({
        rows: previewData.allRows,
        account_id: selectedAccountId || accounts[0]?.id,
        skipDuplicates,
      });
      setSuccessResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to complete import.');
    } finally {
      setImporting(false);
    }
  };

  const handleSampleDownload = () => {
    const sample = `Date,Title,Type,Amount,Category,Merchant\n2026-11-01,Whole Foods Market,expense,4500,Groceries,Whole Foods\n2026-11-02,Starbucks Coffee,expense,450,Food & Dining,Starbucks\n2026-11-03,Client Consultancy,income,25000,Freelancing,Starlight Labs\n2026-11-04,Uber Ride,expense,320,Transportation,Uber`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finsight_sample_import.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#293548] dark:border-[#293548] light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">Import Transactions CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {successResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">Import Complete!</h3>
                <p className="text-xs text-slate-400 mt-1">{successResult.message}</p>
              </div>
              <div className="inline-flex gap-4 p-3 rounded-xl bg-[#0B1020] border border-[#293548] text-xs">
                <div>
                  <span className="text-slate-400">Imported: </span>
                  <strong className="text-emerald-400 font-bold">{successResult.importedCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Duplicates Skipped: </span>
                  <strong className="text-amber-400 font-bold">{successResult.skippedCount}</strong>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File Dropzone */}
              {!previewData && (
                <div className="border-2 border-dashed border-[#293548] hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-colors">
                  <FileText className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-white dark:text-white light:text-slate-900">
                    Upload Bank or Expense CSV
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Supports HDFC, ICICI, SBI, Axis, Chase, Splitwise, or any standard spreadsheet export.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <label className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] cursor-pointer shadow-md shadow-emerald-500/20">
                      <span>Choose CSV File</span>
                      <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleSampleDownload}
                      className="text-xs text-sky-400 hover:underline cursor-pointer"
                    >
                      Download Sample CSV
                    </button>
                  </div>
                </div>
              )}

              {parsing && (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Parsing records and predicting categories using ML...</span>
                </div>
              )}

              {/* Preview Section */}
              {previewData && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#293548] text-center">
                      <p className="text-[10px] text-slate-400">Total Rows</p>
                      <p className="text-sm font-bold text-white">{previewData.totalRows}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#293548] text-center">
                      <p className="text-[10px] text-slate-400">Valid Records</p>
                      <p className="text-sm font-bold text-emerald-400">{previewData.validRows}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#293548] text-center">
                      <p className="text-[10px] text-slate-400">Duplicates Detected</p>
                      <p className="text-sm font-bold text-amber-400">{previewData.duplicateCount}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#293548] text-center">
                      <p className="text-[10px] text-slate-400">Invalid Rows</p>
                      <p className="text-sm font-bold text-rose-400">{previewData.invalidRows}</p>
                    </div>
                  </div>

                  {/* Account Destination & Duplicate Filter Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Target Account</label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#293548] text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="skipDup"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="rounded border-[#293548] text-emerald-500 focus:ring-emerald-500"
                      />
                      <label htmlFor="skipDup" className="text-xs text-slate-300">
                        Skip {previewData.duplicateCount} duplicate transactions
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-2">Record Preview (First 15 items)</p>
                    <div className="border border-[#293548] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0B1020] text-slate-400 border-b border-[#293548]">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Title</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3">ML Category</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#293548]/40">
                          {previewData.preview.map((r, i) => (
                            <tr key={i} className={r.isDuplicate ? 'opacity-50 bg-amber-500/5' : ''}>
                              <td className="py-2 px-3 text-slate-400">{r.date}</td>
                              <td className="py-2 px-3 font-medium text-white">{r.title}</td>
                              <td className={`py-2 px-3 font-semibold ${r.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {r.type === 'income' ? '+' : '-'}{currencySymbol}{r.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3">
                                <span className="bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded text-[10px]">
                                  {r.category} ({r.categoryConfidence}%)
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {r.isDuplicate ? (
                                  <span className="text-[10px] text-amber-400 font-medium">Duplicate</span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 font-medium">Ready</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#293548]">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewData(null);
                        setFile(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Choose Different File
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={importing}
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0B1020] shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Confirm & Import</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
