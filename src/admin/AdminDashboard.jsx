import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { fetchStats, fetchAdminEvents, migrateDatabase } from "./adminApi";
import {
  LayoutDashboard, Calendar, Users, CheckCircle, Clock, XCircle,
  TrendingUp, ArrowRight, Loader2, AlertCircle, Database, Star,
  Activity, RefreshCw,
} from "lucide-react";
import { GlobeSection } from "../components/ui/globe";

function StatCard({ label, value, icon: Icon, color, loading, sub }) {
  return (
    <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-0.5 truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-14 bg-white/10 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-white">{value ?? 0}</p>
        )}
        {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => { loadAll(0); }, []);

  const loadAll = async (attempt = 0) => {
    const MAX = 6;
    try {
      const [statsData, eventsData] = await Promise.allSettled([
        fetchStats(),
        fetchAdminEvents(),
      ]);

      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
        setError("");
        setIsWakingUp(false);
      } else if (attempt < MAX - 1) {
        setIsWakingUp(true);
        setTimeout(() => loadAll(attempt + 1), 8000);
      } else {
        setIsWakingUp(false);
        setError(statsData.reason?.message || "Failed to load stats");
      }

      if (eventsData.status === "fulfilled") {
        const evList = Array.isArray(eventsData.value) ? eventsData.value : (eventsData.value?.items || []);
        setEvents(evList);
        if (evList.length > 0) setSelectedEventId(String(evList[0].id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm("Run database migrations?")) return;
    try {
      const res = await migrateDatabase();
      alert(`Migration successful!\n${(res.results || []).join("\n")}`);
    } catch (e) {
      alert(`Migration error: ${e.message}`);
    }
  };

  const selectedEvent = events.find(e => String(e.id) === selectedEventId);
  const eventRegs = selectedEvent?.registered_count ?? selectedEvent?.registered_teams_count ?? 0;
  const eventSeats = selectedEvent ? Math.max(0, (selectedEvent.max_participants ?? selectedEvent.max_teams ?? 30) - eventRegs) : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">ACES Event Management Overview</p>
          </div>
          <div className="flex items-center gap-3">
            {events.length > 0 && (
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#0d1426]">{ev.title}</option>)}
              </select>
            )}
            <button
              onClick={() => { setLoading(true); loadAll(0); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleMigrate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm font-medium rounded-xl transition-colors"
            >
              <Database className="w-4 h-4" /> DB Migration
            </button>
          </div>
        </div>

        {isWakingUp && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-5 py-4 rounded-xl">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
            Backend waking up — retrying automatically…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-5 py-4 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Stats Grid — Global */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">Global Stats</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Events" value={stats?.total_events} icon={Calendar} color="bg-blue-600" loading={loading} />
            <StatCard label="Upcoming" value={stats?.upcoming_events} icon={Clock} color="bg-purple-600" loading={loading} sub={`${stats?.ongoing_events ?? 0} ongoing`} />
            <StatCard label="Total Registrations" value={stats?.total_registrations} icon={Users} color="bg-emerald-600" loading={loading} />
            <StatCard label="Approved" value={stats?.approved_registrations} icon={CheckCircle} color="bg-green-600" loading={loading} sub={`${stats?.pending_registrations ?? 0} pending`} />
          </div>
        </div>

        {/* Stats Grid — Per Event */}
        {selectedEvent && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">
              Event: {selectedEvent.title}
              <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${(selectedEvent.is_registration_open || selectedEvent.registration_status === "open") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {(selectedEvent.is_registration_open || selectedEvent.registration_status === "open") ? "Open" : "Closed"}
              </span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard label="Registrations" value={eventRegs} icon={Users} color="bg-indigo-600" loading={loading} />
              <StatCard label="Remaining Seats" value={eventSeats} icon={Activity} color="bg-amber-600" loading={loading} sub={`of ${selectedEvent.max_participants ?? selectedEvent.max_teams ?? 30}`} />
              <StatCard label="Max Capacity" value={selectedEvent.max_participants ?? selectedEvent.max_teams ?? 30} icon={Star} color="bg-teal-600" loading={loading} />
              <StatCard label="Event Status" value={selectedEvent.event_status ?? "upcoming"} icon={TrendingUp} color="bg-rose-600" loading={false} />
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Events */}
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Recent Events</h2>
              <Link to="/admin/events" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse space-y-2">
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                ))
              ) : stats?.recent_events?.length ? (
                stats.recent_events.map(e => (
                  <Link key={e.id} to={`/admin/events/${e.id}`} className="block px-6 py-4 hover:bg-white/3 transition-colors group">
                    <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors truncate">{e.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{e.event_status} · {e.registered_count ?? 0}/{e.max_participants ?? 30} regs · {fmt(e.created_at)}</p>
                  </Link>
                ))
              ) : events.slice(0, 5).map(e => (
                <Link key={e.id} to={`/admin/events/${e.id}`} className="block px-6 py-4 hover:bg-white/3 transition-colors group">
                  <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors truncate">{e.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{e.event_status ?? "upcoming"} · {e.registered_count ?? 0} regs</p>
                </Link>
              ))}
              {!loading && !stats?.recent_events?.length && !events.length && (
                <p className="px-6 py-8 text-white/30 text-sm text-center">No events yet.</p>
              )}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Recent Registrations</h2>
              <Link to="/admin/event-registrations" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse space-y-2">
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                ))
              ) : stats?.recent_registrations?.length ? (
                stats.recent_registrations.map(r => (
                  <div key={r.id} className="px-6 py-4 hover:bg-white/3 transition-colors">
                    <p className="text-white text-sm font-medium truncate">{r.team_name} — {r.leader_name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{r.event_title} · {r.payment_status} · {fmt(r.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="px-6 py-8 text-white/30 text-sm text-center">No registrations yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Globe Section ── */}
        <GlobeSection />

      </div>
    </AdminLayout>
  );
}
