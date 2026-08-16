import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminLogout } from "./adminApi";
import {
  LayoutDashboard, Lightbulb, Users, LogOut, Shield, Menu, X,
  Calendar, ChevronDown, ChevronRight, Bell, ImageIcon,
  Trophy, Megaphone, FlaskConical, BookOpen, Award, UserCheck, Star, Monitor
} from "lucide-react";
import { useState, useEffect } from "react";

export function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [regsExpanded, setRegsExpanded] = useState(false);

  useEffect(() => {
    // Read events directly from localStorage — no network needed for sidebar list
    const loadEvents = () => {
      try {
        const stored = localStorage.getItem("aces_mock_events");
        if (stored) setEvents(JSON.parse(stored));
      } catch {}
    };
    loadEvents();
    window.addEventListener("aces_events_updated", loadEvents);
    return () => window.removeEventListener("aces_events_updated", loadEvents);
  }, []);

  function logout() {
    adminLogout();
    navigate("/admin/login");
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const NavLink = ({ to, icon: Icon, label, badge }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">{badge}</span>}
      </Link>
    );
  };

  const SectionHeader = ({ icon: Icon, label, expanded, onToggle }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="flex-1 text-left">{label}</span>
      {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-transparent text-white font-sans">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] border-r border-white/10 flex flex-col transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">ACES Admin</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Control Panel</p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLink to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink to="/admin/submissions" icon={Lightbulb} label="Idea Submissions" />

          {/* ── Events section ── */}
          <div className="pt-2">
            <SectionHeader icon={Calendar} label="Events" expanded={eventsExpanded} onToggle={() => setEventsExpanded(v => !v)} />
            {eventsExpanded && (
              <div className="ml-3 mt-1 space-y-0.5">
                <NavLink to="/admin/events" icon={Calendar} label="Manage Events" />
                {events.slice(0, 10).map(ev => (
                  <Link
                    key={ev.id}
                    to={`/admin/events/${ev.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
                      ${isActive(`/admin/events/${ev.id}`)
                        ? "bg-blue-600/30 text-blue-300"
                        : "text-white/40 hover:bg-white/5 hover:text-white/70"
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.registration_status === "open" || ev.is_registration_open ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="truncate">{ev.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Registrations section ── */}
          <div className="pt-1">
            <SectionHeader icon={Users} label="Registrations" expanded={regsExpanded} onToggle={() => setRegsExpanded(v => !v)} />
            {regsExpanded && (
              <div className="ml-3 mt-1 space-y-0.5">
                <NavLink to="/admin/event-registrations" icon={Users} label="All Event Regs" />
                {events.map(ev => (
                  <NavLink 
                    key={ev.id} 
                    to={`/admin/event-registrations?event_id=${ev.id}`} 
                    icon={Users} 
                    label={`${ev.title} Regs`} 
                  />
                ))}
                <NavLink to="/admin/registrations" icon={Lightbulb} label="Idea Submissions" />
                <NavLink to="/admin/test-registrations" icon={FlaskConical} label="Test Event Regs" />
              </div>
            )}
          </div>

          <div className="pt-1">
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/30">Content</p>
            <NavLink to="/admin/committee" icon={Users} label="Committee" />
            <NavLink to="/admin/toppers" icon={Award} label="Academic Toppers" />
            <NavLink to="/admin/faculty" icon={UserCheck} label="Faculty Members" />
            <NavLink to="/admin/hod" icon={Star} label="HOD Profile" />
            <NavLink to="/admin/laboratories" icon={Monitor} label="Laboratories" />
            <NavLink to="/admin/results" icon={Trophy} label="Results" />
            <NavLink to="/admin/departmental-events" icon={BookOpen} label="Departmental Events" />
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-[#0B0B0B]/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setOpen(true)} className="md:hidden text-white/60 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-white/40 font-medium uppercase tracking-widest">ACES — Admin Panel</span>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
