import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { fetchRegistrations, deleteRegistration, exportRegistrationsCSV } from "./adminApi";
import {
  Search, Download, Trash2, Eye,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, X,
} from "lucide-react";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminRegistrations() {
  const [data,       setData]       = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [delId,      setDelId]      = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [exporting,  setExporting]  = useState(false);

  const load = useCallback(async (pg = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchRegistrations({ page: pg, search });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(1); setPage(1); }, [search]);
  useEffect(() => { load(page); }, [page]);

  async function handleDelete() {
    if (!delId) return;
    setDelLoading(true);
    try {
      await deleteRegistration(delId);
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
    try { await exportRegistrationsCSV(); }
    catch (e) { alert(e.message); }
    finally { setExporting(false); }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Event Registrations</h1>
            <p className="text-white/40 text-sm mt-1">{data.total} total registrations</p>
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

        {/* Search */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by name, email, phone, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white text-sm
                         placeholder-white/25 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-3.5 h-3.5" />
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
                  <th className="px-5 py-3.5 text-left font-medium">ID</th>
                  <th className="px-5 py-3.5 text-left font-medium">Event</th>
                  <th className="px-5 py-3.5 text-left font-medium">Name</th>
                  <th className="px-5 py-3.5 text-left font-medium">Email</th>
                  <th className="px-5 py-3.5 text-left font-medium">Mobile</th>
                  <th className="px-5 py-3.5 text-left font-medium">Dept / Year</th>
                  <th className="px-5 py-3.5 text-left font-medium">Registered</th>
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
                      No registrations found.
                    </td>
                  </tr>
                ) : (
                  data.items.map(r => (
                    <tr key={r.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-4 text-white/40 font-mono text-xs">#{r.id}</td>
                      <td className="px-5 py-4 text-white/60 max-w-[140px] truncate">{r.event_title}</td>
                      <td className="px-5 py-4 text-white font-medium">{r.full_name}</td>
                      <td className="px-5 py-4 text-white/60 max-w-[160px] truncate">{r.email}</td>
                      <td className="px-5 py-4 text-white/60">{r.mobile || "—"}</td>
                      <td className="px-5 py-4 text-white/60">
                        <span className="block">{r.department || "—"}</span>
                        <span className="text-white/30 text-xs">{r.year || ""}</span>
                      </td>
                      <td className="px-5 py-4 text-white/50 whitespace-nowrap">{fmt(r.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/registrations/${r.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                          <button
                            onClick={() => setDelId(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
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

      {/* Delete Modal */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Delete Registration?</h3>
              <p className="text-white/50 text-sm mt-2">
                Registration <span className="text-white font-mono">#{delId}</span> will be permanently deleted.
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
    </AdminLayout>
  );
}
