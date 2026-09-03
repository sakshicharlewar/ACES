import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { fetchSubmissions, deleteSubmission, exportSubmissionsCSV, approveSubmission, rejectSubmission, resendSubmissionNotification } from "./adminApi";
import {
  Search, Filter, Download, Trash2, Eye,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, X, CheckCircle, XCircle, Send
} from "lucide-react";
import { ImagePreviewModal } from "../components/ui/ImagePreviewModal";

const DEPTS = ["", "Computer Engineering", "Information Technology", "Mechanical", "Civil", "Electrical", "Electronics", "Other"];

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminSubmissions() {
  const [data,       setData]       = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [dept,       setDept]       = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [page,       setPage]       = useState(1);
  const [delId,      setDelId]      = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [exporting,  setExporting]  = useState(false);
  const [rejectionModal, setRejectionModal] = useState(null); // { id }
  const [rejectionReason, setRejectionReason] = useState("");

  const load = useCallback(async (pg = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchSubmissions({ page: pg, search, department: dept, date_from: dateFrom, date_to: dateTo });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, dept, dateFrom, dateTo]);

  useEffect(() => { load(1); setPage(1); }, [search, dept, dateFrom, dateTo]);
  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    const onUpdated = () => load(page);
    window.addEventListener("aces_submissions_updated", onUpdated);
    return () => window.removeEventListener("aces_submissions_updated", onUpdated);
  }, [load, page]);

  async function handleDelete() {
    if (!delId) return;
    setDelLoading(true);
    try {
      await deleteSubmission(delId);
      setDelId(null);
      load(page);
    } catch (e) {
      alert(e.message);
    } finally {
      setDelLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try { await exportSubmissionsCSV(); }
    catch (e) { alert(e.message); }
    finally { setExporting(false); }
  }

  async function handleApprove(id) {
    if (!window.confirm("Approve this submission?")) return;
    try {
      await approveSubmission(id);
      load(page);
    } catch (e) {
      alert(e.message);
    }
  }

  async function submitRejection() {
    if (!rejectionModal) return;
    const id = rejectionModal.id;
    try {
      await rejectSubmission(id, rejectionReason);
      setRejectionModal(null);
      setRejectionReason("");
      load(page);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleResend(id, type) {
    if (!window.confirm(`Resend ${type.toUpperCase()} notification?`)) return;
    try {
      await resendSubmissionNotification(id, type);
      alert(`${type.toUpperCase()} resent successfully!`);
      load(page);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Idea Submissions</h1>
            <p className="text-white/40 text-sm mt-1">{data.total} total submissions</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60
                       text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search by name, email, phone, department, idea title…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm
                           placeholder-white/25 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department */}
            <select
              value={dept}
              onChange={e => setDept(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                         focus:outline-none focus:border-blue-500 transition-colors min-w-[180px]"
            >
              {DEPTS.map(d => <option key={d} value={d} className="bg-[#0d1426]">{d || "All Departments"}</option>)}
            </select>
          </div>

          {/* Date range */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Filter className="w-4 h-4 text-white/30 shrink-0" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500 transition-colors" />
            <span className="text-white/30 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500 transition-colors" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-white/40 hover:text-white text-sm">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-5 py-4 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left font-medium">Idea ID</th>
                  <th className="px-5 py-3.5 text-left font-medium">Name</th>
                  <th className="px-5 py-3.5 text-left font-medium">Email</th>
                  <th className="px-5 py-3.5 text-left font-medium">Idea Title</th>
                  <th className="px-5 py-3.5 text-left font-medium">Status</th>
                  <th className="px-5 py-3.5 text-left font-medium">Attachment</th>
                  <th className="px-5 py-3.5 text-left font-medium">Date</th>
                  <th className="px-5 py-3.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 bg-white/10 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-white/30">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  data.items.map(s => (
                    <tr key={s.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-4 text-white/40 font-mono text-xs">{s.idea_id || `#${s.id}`}</td>
                      <td className="px-5 py-4 text-white font-medium max-w-[140px] truncate">{s.full_name}</td>
                      <td className="px-5 py-4 text-white/60 max-w-[160px] truncate">{s.email}</td>
                      <td className="px-5 py-4 text-white max-w-[200px] truncate">{s.idea_title}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          s.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                          s.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {s.status || "Pending"}
                        </span>
                        <div className="flex flex-col gap-1 mt-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded w-max ${s.email_sent ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                            Email: {s.email_sent ? '✅' : '❌'}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded w-max ${s.sms_sent ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                            SMS: {s.sms_sent ? '✅' : '❌'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {s.attachment_url ? (
                          <div 
                            className="relative w-[100px] h-[70px] rounded-lg overflow-hidden border border-white/10 cursor-pointer group bg-black/20 flex items-center justify-center"
                            onClick={() => setPreviewModal(s.attachment_url)}
                          >
                            {(s.attachment_url.startsWith("data:application/pdf") || s.attachment_url.toLowerCase().endsWith(".pdf")) ? (
                              <div className="flex flex-col items-center justify-center text-white/50 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[9px] font-medium uppercase">PDF</span>
                              </div>
                            ) : (
                              <>
                                <img 
                                  src={s.attachment_url} 
                                  alt="Attachment" 
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="text-white w-5 h-5" />
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-white/50 whitespace-nowrap">{fmt(s.submitted_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {s.status !== "Pending" && s.status !== "pending" && (
                            <button
                              onClick={() => handleResend(s.id, "email")}
                              title="Resend Email"
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {s.status !== "Approved" && (
                            <button
                              onClick={() => handleApprove(s.id)}
                              title="Approve Submission"
                              className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {s.status !== "Rejected" && (
                            <button
                              onClick={() => setRejectionModal({ id: s.id })}
                              title="Reject Submission"
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <Link
                            to={`/admin/submissions/${s.id}`}
                            title="View Details"
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          
                          <button
                            onClick={() => setDelId(s.id)}
                            title="Delete Submission"
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-white/40 text-xs">
                Page {data.page} of {data.pages} · {data.total} records
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Delete Submission?</h3>
              <p className="text-white/50 text-sm mt-2">
                Submission <span className="text-white font-mono">#{delId}</span> will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDelId(null)}
                disabled={delLoading}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={delLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {delLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        imageUrl={previewModal}
        altText="Attachment Preview"
      />

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0d1426] rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-2">Reject Submission</h3>
            <p className="text-sm text-white/60 mb-4">Please provide a reason for rejecting this idea. This will be sent to the student.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500 resize-none h-24 mb-4"
              placeholder="e.g. Idea is not feasible, incomplete details, etc."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setRejectionModal(null); setRejectionReason(""); }}
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitRejection}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
