import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { fetchStats, migrateDatabase } from "./adminApi";
import {
  Lightbulb, Users, TrendingUp, CalendarCheck,
  ArrowRight, Loader2, AlertCircle, Database
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className={`bg-[#0d1426] border border-white/10 rounded-2xl p-6 flex items-center gap-5
                     hover:border-white/20 transition-all duration-300 group`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-white/10 rounded-lg animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AdminDashboard() {
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    loadStats(0);
  }, []);

  const loadStats = async (attempt = 0) => {
    const MAX_ATTEMPTS = 6;
    const RETRY_DELAY_MS = 8000;
    try {
      const data = await fetchStats();
      setStats(data);
      setError("");
      setIsWakingUp(false);
    } catch (e) {
      console.warn(`[AdminDashboard] stats attempt ${attempt + 1} failed:`, e.message);
      if (attempt < MAX_ATTEMPTS - 1) {
        setIsWakingUp(true);
        setTimeout(() => loadStats(attempt + 1), RETRY_DELAY_MS);
      } else {
        setIsWakingUp(false);
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm("Run database migrations? This will add missing columns to PostgreSQL.")) return;
    try {
      const res = await migrateDatabase();
      alert(`Migration successful!\n${res.results.join("\n")}`);
    } catch (e) {
      alert(`Migration error: ${e.message}`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">Overview of all ACES activity</p>
          </div>
          <button
            onClick={handleMigrate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm font-medium rounded-xl transition-colors"
          >
            <Database className="w-4 h-4" /> Run DB Migration
          </button>
        </div>

        {/* Server waking up */}
        {isWakingUp && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-5 py-4 rounded-xl">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
            Backend server is waking up — retrying automatically, please wait a few seconds…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-5 py-4 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Submissions"    value={stats?.total_submissions}   icon={Lightbulb}     color="bg-blue-600"    loading={loading} />
          <StatCard label="Total Registrations"  value={stats?.total_registrations} icon={Users}         color="bg-purple-600"  loading={loading} />
          <StatCard label="Today's Submissions"  value={stats?.today_submissions}   icon={TrendingUp}    color="bg-emerald-600" loading={loading} />
          <StatCard label="Today's Registrations"value={stats?.today_registrations} icon={CalendarCheck} color="bg-amber-600"   loading={loading} />
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Recent Idea Submissions</h2>
              <Link to="/admin/submissions" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
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
              ) : stats?.recent_submissions?.length ? (
                stats.recent_submissions.map(s => (
                  <Link
                    key={s.id}
                    to={`/admin/submissions/${s.id}`}
                    className="block px-6 py-4 hover:bg-white/3 transition-colors group"
                  >
                    <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors truncate">{s.idea_title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{s.full_name} · {s.department} · {fmt(s.submitted_at)}</p>
                  </Link>
                ))
              ) : (
                <p className="px-6 py-8 text-white/30 text-sm text-center">No submissions yet.</p>
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
                  <div
                    key={r.id}
                    className="block px-6 py-4 hover:bg-white/3 transition-colors group"
                  >
                    <p className="text-white text-sm font-medium group-hover:text-purple-300 transition-colors">{r.full_name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{r.email} · Event #{r.event_id} · {fmt(r.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="px-6 py-8 text-white/30 text-sm text-center">No registrations yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
