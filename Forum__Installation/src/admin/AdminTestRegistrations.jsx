import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { fetchTestRegistrations, deleteTestRegistration, exportTestRegistrationsCSV } from "./adminApi";
import { Search, Download, Trash2, Loader2, AlertCircle, RefreshCw, FlaskConical, FileText } from "lucide-react";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

const API_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

export default function AdminTestRegistrations() {
  const [data,    setData]    = useState({ results: [], total: 0 });
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [deleting, setDeleting] = useState(null);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetchTestRegistrations({ page, limit: LIMIT, search });
      setData(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete registration for "${name}"?`)) return;
    setDeleting(id);
    try {
      await deleteTestRegistration(id);
      load();
    } catch (e) { alert("Delete failed: " + e.message); }
    finally { setDeleting(null); }
  };

  const handleExport = async () => {
    try { await exportTestRegistrationsCSV(); }
    catch (e) { alert("Export failed: " + e.message); }
  };

  const totalPages = Math.ceil(data.total / LIMIT);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-purple-400" /> Test Event Registrations
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Total: <span className="text-white font-semibold">{data.total}</span> registrations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm rounded-xl transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-sm font-medium rounded-xl transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, email, mobile or college…"
            className="w-full bg-[#0d1426] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
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
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Participant Info</th>
                  <th className="px-4 py-3 text-left">College Info</th>
                  <th className="px-4 py-3 text-left">Document</th>
                  <th className="px-4 py-3 text-left">Registered At</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-3 bg-white/10 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-white/30">
                      No test registrations found.
                    </td>
                  </tr>
                ) : (
                  data.results.map(r => (
                    <tr key={r.id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-4 py-3 text-white/40 font-mono text-xs">#{r.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-white font-semibold">{r.full_name}</p>
                        <p className="text-white/40 text-xs">{r.email}</p>
                        <p className="text-white/40 text-xs">{r.mobile}</p>
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        <p className="max-w-[200px] truncate">{r.college_name}</p>
                        <p className="text-white/40 text-xs">{r.department} • {r.year}</p>
                      </td>
                      <td className="px-4 py-3">
                        {r.document_url ? (
                          <a href={`${API_URL}/${r.document_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded-lg transition-colors w-fit">
                            <FileText className="w-3 h-3" /> View File
                          </a>
                        ) : (
                          <span className="text-white/30 text-xs">No file</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{fmt(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(r.id, r.full_name)}
                          disabled={deleting === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-sm text-white/50">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
