import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminLogout } from "./adminApi";
import {
  LayoutDashboard,
  Lightbulb,
  Users,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/admin/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { to: "/admin/submissions",   label: "Idea Submissions", icon: Lightbulb },
  { to: "/admin/registrations", label: "Registrations", icon: Users },
  { to: "/admin/event-registrations", label: "Bug Hunt Regs", icon: Users },
];

export function AdminLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  function logout() {
    adminLogout();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-[#0a0f1e] text-white font-sans">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d1426] border-r border-white/10 flex flex-col transform transition-transform duration-300
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
          <button
            onClick={() => setOpen(false)}
            className="ml-auto md:hidden text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
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
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0a0f1e]/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-white/60 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-white/40 font-medium uppercase tracking-widest">
            ACES — Admin Panel
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
