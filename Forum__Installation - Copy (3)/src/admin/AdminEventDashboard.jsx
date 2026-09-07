import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import {
  fetchAdminEvent, fetchEventStats, fetchEventRegistrations,
  toggleEventRegistration, deleteRegistration, approveRegistration,
  rejectRegistration, exportRegistrationsExcel, deleteEvent
} from "./adminApi";
import { BUG_HUNT_REGISTRATIONS } from "../data/bugHuntRegistrations";
import {
  Users, CheckCircle, XCircle, Clock, Lock, Unlock, Download,
  Trash2, ArrowLeft, Edit, Search, Eye, Send, AlertCircle, Loader2
} from "lucide-react";

const statusBadge = (s) => {
  const map = { approved: "bg-green-500/20 text-green-400", rejected: "bg-red-500/20 text-red-400", pending: "bg-yellow-500/20 text-yellow-400" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${map[s] || map.pending}`}>{s || "pending"}</span>;
};

export default function AdminEventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [regs, setRegs] = useState(String(id) === "1" ? BUG_HUNT_REGISTRATIONS : []);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [screenshotModal, setScreenshotModal] = useState(null);

  useEffect(() => { if (id) loadAll(); }, [id]);

  async function loadAll() {
    setLoading(true);
    setRegsLoading(true);
    try {
      let [evData, statsData] = await Promise.all([
        fetchAdminEvent(id).catch(() => null),
        fetchEventStats(id).catch(() => null),
      ]);
      if (!evData && String(id) === "1") {
        evData = {
          id: 1,
          title: "Bug Hunt: Debug the Web",
          max_participants: 30,
          max_teams: 30,
          registered_count: 30,
          registered_teams_count: 30,
          is_registration_open: false,
          registration_status: "closed",
          event_status: "completed",
        };
      }
      setEvent(evData);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
    try {
      const data = await fetchEventRegistrations(id, { search, status: statusFilter, limit: 1000 });
      let items = Array.isArray(data) ? data : (data.items || []);
      if (String(id) === "1") {
        if (items.length === 0) {
          items = BUG_HUNT_REGISTRATIONS;
        } else {
          const existingIds = new Set(items.map(r => r.registration_id));
          for (const fallback of BUG_HUNT_REGISTRATIONS) {
            if (!existingIds.has(fallback.registration_id)) {
              items.push(fallback);
            }
          }
        }
      }
      setRegs(items);
    } finally {
      setRegsLoading(false);
    }
  }

  async function handleToggle() {
    if (!event) return;
    const isOpen = event.is_registration_open ?? event.registration_status === "open";
    if (!window.confirm(`${isOpen ? "Close" : "Open"} registration for this event?`)) return;
    await toggleEventRegistration(id, !isOpen);
    loadAll();
  }

  async function handleApprove(regId) {
    if (!window.confirm("Approve this registration?")) return;
    await approveRegistration(regId);
    loadAll();
  }

  async function handleDelete(regId) {
    if (!window.confirm("Delete this registration permanently?")) return;
    await deleteRegistration(regId, id);
    loadAll();
  }

  async function submitRejection() {
    if (!rejectionModal) return;
    await rejectRegistration(rejectionModal, rejectionReason);
    setRejectionModal(null);
    setRejectionReason("");
    loadAll();
  }

  async function handleDeleteEvent() {
    if (!window.confirm(`Delete event "${event?.title}"? This will also delete all registrations.`)) return;
    await deleteEvent(id);
    navigate("/admin/events");
  }

  const filteredRegs = regs.filter(r =>
    (!search || r.team_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.leader_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.leader_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.registration_id?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || r.payment_status === statusFilter)
  );

  const isOpen = event?.is_registration_open ?? event?.registration_status === "open";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/events" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              {loading ? <div className="h-6 w-48 bg-white/10 rounded animate-pulse" /> : (
                <h1 className="text-xl font-bold text-white">{event?.title || "Event Dashboard"}</h1>
              )}
              <p className="text-white/40 text-sm mt-0.5">Registration Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => exportRegistrationsExcel(id)} className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-sm font-medium rounded-xl transition-colors">
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <Link to={`/admin/events`} state={{ editId: id }} className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm font-medium rounded-xl transition-colors">
              <Edit className="w-4 h-4" /> Edit Event
            </Link>
            <button onClick={handleToggle} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${isOpen ? "bg-red-600/20 hover:bg-red-600/40 text-red-400" : "bg-green-600/20 hover:bg-green-600/40 text-green-400"}`}>
              {isOpen ? <><Lock className="w-4 h-4" /> Close Reg</> : <><Unlock className="w-4 h-4" /> Open Reg</>}
            </button>
            <button onClick={handleDeleteEvent} className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats?.total_registrations ?? regs.length, color: "bg-blue-600", icon: Users },
            { label: "Approved", value: stats?.approved ?? regs.filter(r => r.payment_status === "approved").length, color: "bg-green-600", icon: CheckCircle },
            { label: "Pending", value: stats?.pending ?? regs.filter(r => !r.payment_status || r.payment_status === "pending").length, color: "bg-yellow-600", icon: Clock },
            { label: "Remaining Seats", value: stats?.remaining_seats ?? Math.max(0, (event?.max_participants ?? 30) - regs.length), color: "bg-indigo-600", icon: Users },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-[#0d1426] border border-white/10 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{loading ? "…" : (value ?? 0)}</p>
              <p className="text-white/40 text-xs mt-0.5 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>



        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text" placeholder="Search by team, name, email, reg ID..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="" className="bg-[#0d1426]">All Status</option>
            <option value="pending" className="bg-[#0d1426]">Pending</option>
            <option value="approved" className="bg-[#0d1426]">Approved</option>
            <option value="rejected" className="bg-[#0d1426]">Rejected</option>
          </select>
        </div>

        {/* Registrations Table */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Reg ID</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-left">Leader</th>
                  <th className="px-4 py-3 text-left">Member 2</th>
                  <th className="px-4 py-3 text-left">Txn ID</th>
                  <th className="px-4 py-3 text-left">Screenshot</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {regsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-3 bg-white/10 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredRegs.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-white/30">No registrations found.</td></tr>
                ) : filteredRegs.map(reg => (
                  <tr key={reg.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-white/60">{reg.registration_id}</td>
                    <td className="px-4 py-3 font-medium text-white max-w-[140px] truncate">{reg.team_name}</td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs font-medium">{reg.leader_name}</p>
                      <p className="text-white/40 text-xs">{reg.leader_email}</p>
                      <p className="text-white/30 text-xs">{reg.leader_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/70 text-xs">{reg.member2_name || "—"}</p>
                      <p className="text-white/40 text-xs">{reg.member2_email || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-white/50 max-w-[100px] truncate">{reg.transaction_id || "—"}</td>
                    <td className="px-4 py-3">
                      {reg.payment_screenshot ? (
                        <button onClick={() => setScreenshotModal(reg.payment_screenshot)} className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5 hover:border-blue-500/50 transition-colors">
                          <img src={reg.payment_screenshot} alt="Payment" className="w-full h-full object-cover" />
                        </button>
                      ) : <span className="text-white/30 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(reg.payment_status)}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{reg.created_at ? new Date(reg.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {reg.payment_status !== "approved" && (
                          <button onClick={() => handleApprove(reg.id)} title="Approve" className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {reg.payment_status !== "rejected" && (
                          <button onClick={() => setRejectionModal(reg.id)} title="Reject" className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(reg.id)} title="Delete" className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setScreenshotModal(null)}>
          <img src={screenshotModal} alt="Payment Screenshot" className="max-w-lg max-h-[80vh] rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0d1426] rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Reject Registration</h3>
            <p className="text-white/50 text-sm mb-4">Provide a reason (will be sent to the team).</p>
            <textarea
              value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-red-500 resize-none h-24 mb-4"
              placeholder="e.g. Transaction ID mismatch..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectionModal(null); setRejectionReason(""); }} className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
              <button onClick={submitRejection} disabled={!rejectionReason.trim()} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
