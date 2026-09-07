import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, Download, Trash2, CheckCircle, XCircle, Clock, Eye, FileText, Code, Copy, Check, User } from "lucide-react";
import { ImagePreviewModal } from "../components/ui/ImagePreviewModal";
import { fetchAdminEvents } from "./adminApi";
import { AdminLayout } from "./AdminLayout";
import { getBaseUrl } from "../lib/apiConfig";
import { BUG_HUNT_REGISTRATIONS } from "../data/bugHuntRegistrations";

const API_URL = getBaseUrl();

const DEFAULT_EVENTS = [
  { id: 12, title: "BUILDX - Project Innovation Challenge", max_teams: 60, max_participants: 60, registered_teams_count: 0, is_registration_open: true, registration_status: "open", result_status: "pending" },
  { id: 1, title: "Bug Hunt: Debug the Web", max_teams: 30, max_participants: 30, registered_teams_count: 30, is_registration_open: false, registration_status: "closed", result_status: "announced" }
];

const statusBadge = (status) => {
  const map = {
    approved: "bg-green-500/20 text-green-400 border border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
    pending:  "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  };
  const icons = {
    approved: <CheckCircle size={12} className="inline mr-1" />,
    rejected: <XCircle size={12} className="inline mr-1" />,
    pending:  <Clock size={12} className="inline mr-1" />,
  };
  const cls = map[status] || "bg-white/10 text-white/70 border border-white/10";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${cls}`}>
      {icons[status]}
      {(status || "pending").charAt(0).toUpperCase() + (status || "pending").slice(1)}
    </span>
  );
};

export default function AdminEventRegistrations() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialEventId = searchParams.get("event_id") || "12";

  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [rejectionModal, setRejectionModal] = useState(null); // { id: 123 }
  const [rejectionReason, setRejectionReason] = useState("");
  const [detailModal, setDetailModal] = useState(null);
  const [detailTab, setDetailTab] = useState("formatted");
  const [copiedRaw, setCopiedRaw] = useState(false);

  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    const eventIdFromUrl = currentParams.get("event_id");
    if (eventIdFromUrl) {
      setSelectedEventId(eventIdFromUrl);
    }
  }, [location.search]);

  useEffect(() => { 
    fetchEvents(); 
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchRegistrations(selectedEventId);
    else if (events.length > 0) fetchRegistrations(events[0].id);

    // Auto-refresh registrations every 15 seconds so admin panel updates live on all devices
    const interval = setInterval(() => {
      if (selectedEventId) fetchRegistrations(selectedEventId);
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      let fetchedEvents = await fetchAdminEvents();
      if (!Array.isArray(fetchedEvents)) {
        fetchedEvents = fetchedEvents.items || [];
      }
      if (fetchedEvents && fetchedEvents.length > 0) {
        // Ensure BuildX is at the top if present
        const sorted = [...fetchedEvents].sort((a, b) => {
          const aIsBuildX = String(a.id) === "12" || (a.title || "").toLowerCase().includes("buildx");
          const bIsBuildX = String(b.id) === "12" || (b.title || "").toLowerCase().includes("buildx");
          if (aIsBuildX) return -1;
          if (bIsBuildX) return 1;
          return 0;
        });
        setEvents(sorted);
      }
    } catch (e) {
      console.warn("Using fallback events:", e);
    }
  };

  const normalizeReg = (r, fallbackEventId) => {
    const extra = r.extra_members || r.extraMembers || (Array.isArray(r.members) ? r.members.slice(1) : []);
    
    let rawBranch = r.leader_branch || r.leaderBranch || r.department || "";
    let rawCollege = r.leader_college || r.leaderCollege || r.college_name || "";
    if (rawBranch && rawBranch.includes(" | ") && !rawCollege) {
      const parts = rawBranch.split(" | ");
      rawBranch = parts[0];
      rawCollege = parts[1];
    }

    return {
      id: r.id || r.registration_id || `REG-${Math.random().toString(36).slice(2, 7)}`,
      registration_id: r.registration_id || r.id || "BUILDX-PENDING",
      event_id: r.event_id || fallbackEventId,
      team_name: r.team_name || r.teamName || "Unnamed Team",
      leader_name: r.leader_name || r.leaderName || r.full_name || "Unknown",
      leader_email: r.leader_email || r.leaderEmail || r.email || "",
      leader_phone: r.leader_phone || r.leaderPhone || r.mobile || "",
      leader_year: r.leader_year || r.leaderYear || r.year || "",
      leader_branch: rawBranch,
      leader_college: rawCollege || "Suryodaya College of Engineering & Technology",
      member2_name: r.member2_name || r.member2Name || (Array.isArray(r.members) && r.members[0]?.name) || "",
      member2_email: r.member2_email || r.member2Email || (Array.isArray(r.members) && r.members[0]?.email) || "",
      member2_phone: r.member2_phone || r.member2Phone || (Array.isArray(r.members) && r.members[0]?.phone) || "",
      member2_year: r.member2_year || r.member2Year || (Array.isArray(r.members) && r.members[0]?.year) || "",
      extra_members: Array.isArray(extra) ? extra.filter(m => m && (m.name || m.email)) : [],
      payment_status: r.payment_status || r.paymentStatus || "pending",
      transaction_id: r.transaction_id || r.transactionId || "",
      payment_screenshot: r.payment_screenshot || r.paymentScreenshot || null,
      rejection_reason: r.rejection_reason || r.rejectionReason || null,
      created_at: r.created_at || r.createdAt || r.registeredAt || new Date().toISOString(),
      raw_record: r,
    };
  };

  const fetchRegistrations = async (eventId) => {
    setLoading(true);
    try {
      let backendData = [];
      try {
        const baseUrl = getBaseUrl();
        const token = localStorage.getItem("aces_admin_token") || localStorage.getItem("adminToken") || "";
        const res = await fetch(`${baseUrl}/admin/api/events/${eventId}/team-registrations`, {
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });
        if (res.ok) {
          const json = await res.json();
          backendData = Array.isArray(json) ? json : (json.items || json.data || []);
        }
      } catch (e) {
        console.warn("Backend fetch failed, using local registrations");
      }
      
      const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const eventLocalRegs = localRegs.filter(r => {
        // Match if event_id matches exactly
        if (r.event_id?.toString() === eventId.toString()) return true;
        // Match if viewing BuildX (ID 12)
        if ((eventId.toString() === "12" || String(eventId).toLowerCase().includes("buildx")) && 
            (r.registration_id?.toUpperCase().startsWith("BUILDX") || (r.event_title || "").toLowerCase().includes("buildx") || r.event_id === 12)) {
          return true;
        }
        // Match if viewing Bug Hunt (ID 1)
        if (eventId.toString() === "1" && (r.registration_id?.toUpperCase().startsWith("BUG-") || r.event_id === 1)) {
          return true;
        }
        return false;
      });
      
      const normalizedBackend = backendData.map(r => normalizeReg(r, eventId));
      const normalizedLocal = eventLocalRegs.map(r => normalizeReg(r, eventId));
      
      const seenIds = new Set();
      const seenTxns = new Set();
      const merged = [];

      for (const r of [...normalizedBackend, ...normalizedLocal]) {
        const regKey = r.registration_id || r.id;
        const txnKey = r.transaction_id && r.transaction_id.toUpperCase() !== "FREE" ? r.transaction_id.toLowerCase() : null;
        
        if (regKey && seenIds.has(regKey)) continue;
        if (txnKey && seenTxns.has(txnKey)) continue;

        if (regKey) seenIds.add(regKey);
        if (txnKey) seenTxns.add(txnKey);
        merged.push(r);
      }
      
      let finalData = merged;
      
      // If viewing Bug Hunt (ID 1)
      if (String(eventId) === "1") {
        if (finalData.length === 0) {
          finalData = BUG_HUNT_REGISTRATIONS.map(r => normalizeReg(r, 1));
        } else {
          const existingRegIds = new Set(finalData.map(r => r.registration_id));
          for (const fallback of BUG_HUNT_REGISTRATIONS) {
            if (!existingRegIds.has(fallback.registration_id)) {
              finalData.push(normalizeReg(fallback, 1));
            }
          }
        }
      }
      
      setRegistrations(finalData.sort((a,b) => (a.registration_id || "").localeCompare(b.registration_id || "")));
    } catch (e) { 
        console.error("Failed to fetch registrations:", e);
        if (String(eventId) === "1") {
          setRegistrations(BUG_HUNT_REGISTRATIONS.map(r => normalizeReg(r, 1)));
        }
    } finally { 
        setLoading(false); 
    }
  };

  const handleToggleStatus = async (eventId, openNow) => {
    if (!window.confirm(`${openNow ? 'Open' : 'Close'} registration for this event?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aces_admin_token") || localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ is_registration_open: openNow }),
      });
      if (res.ok) {
        // Only update this specific event in state — don't re-fetch all events
        setEvents(prev => prev.map(e =>
          String(e.id) === String(eventId)
            ? { ...e, is_registration_open: openNow, registration_status: openNow ? "open" : "closed" }
            : e
        ));
      } else {
        alert("Failed to update registration status.");
      }
    } catch (e) { console.error(e); alert("Network error."); }
  };

  const handleApproveRegistration = async (id) => {
    if (!window.confirm("Approve this registration?")) return;
    if (id.toString().startsWith("LOC-")) {
      const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const updated = localRegs.map(r =>
        r.id === id ? { ...r, payment_status: 'approved', email_sent: true } : r
      );
      localStorage.setItem('local_registrations', JSON.stringify(updated));
      fetchRegistrations(selectedEventId);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/api/team-registrations/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("aces_admin_token") || localStorage.getItem("adminToken")}`
        }
      });
      if (res.ok) fetchRegistrations(selectedEventId);
      else alert("Failed to approve registration.");
    } catch (e) {
      console.error(e);
      alert("Error approving registration.");
    }
  };

  const handleResend = async (id, type) => {

    if (!window.confirm(`Resend ${type.toUpperCase()} notification?`)) return;
    if (id.toString().startsWith("LOC-")) {
      const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const field = type === 'email' ? 'email_sent' : 'sms_sent';
      const updated = localRegs.map(r => r.id === id ? { ...r, [field]: true } : r);
      localStorage.setItem('local_registrations', JSON.stringify(updated));
      alert(`${type.toUpperCase()} resent successfully! (Mocked)`);
      fetchRegistrations(selectedEventId);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/api/team-registrations/${id}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aces_admin_token") || localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        alert(`${type.toUpperCase()} resent successfully!`);
        fetchRegistrations(selectedEventId);
      } else {
        const data = await res.json();
        alert(`Failed to resend ${type}: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error resending ${type}.`);
    }
  };

  const handleDelete = async (regId) => {
    if (!window.confirm("Delete this registration?")) return;
    if (regId.toString().startsWith("LOC-")) {
      const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const updated = localRegs.filter(r => r.id !== regId);
      localStorage.setItem('local_registrations', JSON.stringify(updated));
      fetchRegistrations(selectedEventId);
      fetchEvents();
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/api/team-registrations/${regId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("aces_admin_token") || localStorage.getItem("adminToken")}` },
      });
      if (res.ok) { fetchRegistrations(selectedEventId); fetchEvents(); }
    } catch (e) { console.error(e); }
  };


  const submitRejection = async () => {
    if (!rejectionModal) return;
    const regId = rejectionModal.id;
    const reason = rejectionReason;
    
    setRejectionModal(null);
    setRejectionReason("");
    
    setRegistrations(prev =>
      prev.map(r => r.id === regId ? { ...r, payment_status: "rejected" } : r)
    );

    if (regId.toString().startsWith("LOC-")) {
      const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const updated = localRegs.map(r => r.id === regId ? { ...r, payment_status: 'rejected', rejection_reason: reason } : r);
      localStorage.setItem('local_registrations', JSON.stringify(updated));
      fetchRegistrations(selectedEventId);
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/admin/api/team-registrations/${regId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      if (!res.ok) fetchRegistrations(selectedEventId);
    } catch (e) {
      console.error(e);
      fetchRegistrations(selectedEventId);
    }
  };

  const exportToExcel = () => {
    if (!registrations.length) return;
    const ws = XLSX.utils.json_to_sheet(registrations.map(r => ({
      "Reg ID":               r.registration_id || r.id,
      "Team Name":            r.team_name,
      "Leader Name":          r.leader_name,
      "Leader Email":         r.leader_email,
      "Leader Phone":         r.leader_phone,
      "Leader Year":          r.leader_year,
      "Leader Branch":        r.leader_branch,
      "Leader College":       r.leader_college,
      "Member 2 Name":        r.member2_name,
      "Member 2 Email":       r.member2_email,
      "Member 2 Phone":       r.member2_phone,
      "Member 2 Year":        r.member2_year,
      "Extra Members Count":  (r.extra_members || []).length,
      "Extra Members Data":   (r.extra_members || []).map((m, i) => `M${i+3}: ${m.name || ''} (${m.email || ''}, ${m.phone || ''}, ${m.year || ''})`).join(" | "),
      "Approval Status":      r.payment_status || "pending",
      "Payment Status":       r.payment_status || "pending",
      "Transaction ID":       r.transaction_id || "",
      "Payment Screenshot":   r.payment_screenshot
        ? (r.payment_screenshot.startsWith('data:') ? '[Attached - View in Admin Panel]' : r.payment_screenshot)
        : 'Not uploaded',
      "Reg Date":             new Date(r.created_at).toLocaleString(),
      "Raw Data JSON":        JSON.stringify(r.raw_record || r),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, `Event_${selectedEventId}_Registrations.xlsx`);
  };

  const selectedEvent = events.find(e => e.id.toString() === selectedEventId);

  const filteredRegs = registrations.filter(r =>
    r.team_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.leader_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.registration_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.leader_email?.toLowerCase().includes(search.toLowerCase()) ||
    r.transaction_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Event Registrations</h1>
            <p className="text-white/40 text-sm">View, approve, and manage registered teams and participants</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:border-blue-500 focus:outline-none px-4 py-2.5"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id} className="bg-[#0d1426] text-white">
                  {ev.title} {String(ev.id) === "1" ? "(30 Teams)" : ""}
                </option>
              ))}
            </select>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* Quick Event Switcher Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {events.map(ev => {
            const isSelected = String(ev.id) === String(selectedEventId);
            const isBuildX = String(ev.id) === "12" || (ev.title || "").toLowerCase().includes("buildx");
            const isBugHunt = String(ev.id) === "1" || (ev.title || "").toLowerCase().includes("bug hunt");
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(String(ev.id))}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-white text-black border-white shadow-lg shadow-white/10"
                    : "bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10"
                }`}
              >
                {isBuildX ? "🚀 " : isBugHunt ? "🐞 " : "📅 "}
                <span>{ev.title}</span>
                {isBuildX && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-black text-white" : "bg-green-500/20 text-green-400"}`}>Live</span>}
                {isBugHunt && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-black/20 text-black font-bold" : "bg-white/10 text-white/60"}`}>30 Teams</span>}
              </button>
            );
          })}
        </div>

        {/* Search & Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Total Teams</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{registrations.length}</p>
            <p className="text-white/30 text-xs mt-0.5">{selectedEvent?.title || "Selected Event"}</p>
          </div>
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Approved</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {registrations.filter(r => r.payment_status === "approved").length}
            </p>
            <p className="text-white/30 text-xs mt-0.5">Verified participants</p>
          </div>
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Pending Verification</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {registrations.filter(r => !r.payment_status || r.payment_status === "pending").length}
            </p>
            <p className="text-white/30 text-xs mt-0.5">Awaiting review</p>
          </div>
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Registration Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                selectedEvent?.is_registration_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {selectedEvent?.is_registration_open ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
            <p className="text-white/30 text-xs mt-1">
              Capacity: {selectedEvent?.max_participants ?? selectedEvent?.max_teams ?? 30} Teams
            </p>
          </div>
        </div>

        {/* Search Filter Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/30" />
          </div>
          <input
            type="text"
            placeholder="Search by team name, leader name, email, registration ID, transaction ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Registrations Table */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-white/10">
              <thead className="bg-white/5 text-white/40 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Reg ID</th>
                  <th className="px-5 py-3.5">Team</th>
                  <th className="px-5 py-3.5">Leader Details</th>
                  <th className="px-5 py-3.5">Team Members</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Transaction ID</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-white/10 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredRegs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-white/30">
                      No registrations found.
                    </td>
                  </tr>
                ) : filteredRegs.map(reg => (
                  <tr key={reg.id || reg.registration_id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-blue-400 whitespace-nowrap">
                      {reg.registration_id}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white whitespace-nowrap">
                      {reg.team_name}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white text-sm font-medium">{reg.leader_name}</p>
                      <p className="text-white/40 text-xs">{reg.leader_email}</p>
                      <p className="text-white/30 text-xs">{reg.leader_phone}</p>
                      {(reg.leader_branch || reg.leader_year) && (
                        <p className="text-blue-400/60 text-[11px] mt-0.5">{reg.leader_branch || ""}{reg.leader_branch && reg.leader_year ? " • " : ""}{reg.leader_year || ""}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {reg.member2_name && (
                        <div className="mb-1">
                          <p className="text-white/80 text-xs font-medium">M2: {reg.member2_name}</p>
                          {reg.member2_email && <p className="text-white/40 text-[11px]">{reg.member2_email}</p>}
                        </div>
                      )}
                      {reg.extra_members && reg.extra_members.map((m, i) => (
                        <div key={i} className="mb-1">
                          <p className="text-white/80 text-xs font-medium">M{i + 3}: {m.name}</p>
                          {m.email && <p className="text-white/40 text-[11px]">{m.email}</p>}
                        </div>
                      ))}
                      {!reg.member2_name && (!reg.extra_members || reg.extra_members.length === 0) && (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {statusBadge(reg.payment_status)}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-white/60">
                      {reg.transaction_id || <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {reg.payment_screenshot ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setScreenshotModal(reg.payment_screenshot)}
                            className="px-2.5 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                          <a
                            href={reg.payment_screenshot}
                            download={`payment_${reg.registration_id || reg.id}.jpg`}
                            className="p-1 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
                            title="Download Receipt"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setDetailModal(reg); setDetailTab("formatted"); }}
                          title="View Full Details & Raw Data"
                          className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 transition-colors"
                        >
                          <FileText size={15} />
                        </button>
                        {reg.payment_status !== "approved" && (
                          <button
                            onClick={() => handleApproveRegistration(reg.id)}
                            title="Approve Registration"
                            className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 transition-colors"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {reg.payment_status !== "rejected" && (
                          <button
                            onClick={() => setRejectionModal({ id: reg.id })}
                            title="Reject Registration"
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(reg.id)}
                          title="Delete Registration"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Image Preview Modal */}
        <ImagePreviewModal
          isOpen={!!screenshotModal}
          onClose={() => setScreenshotModal(null)}
          imageUrl={screenshotModal}
          altText="Payment Screenshot"
        />

        {/* Rejection Modal */}
        {rejectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-[#0d1426] rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-bold text-lg mb-2">Reject Registration</h3>
              <p className="text-white/50 text-sm mb-4">Please provide a reason for rejecting this registration.</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-red-500 resize-none h-24 mb-4"
                placeholder="e.g. Transaction ID mismatch, payment not received..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setRejectionModal(null); setRejectionReason(""); }}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition-colors"
                >
                  Reject Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Details & Raw Data Modal */}
        {detailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6 overflow-y-auto">
            <div className="bg-[#0d1426] rounded-2xl border border-white/10 p-6 w-full max-w-3xl shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-400 text-lg">{detailModal.registration_id}</span>
                    {statusBadge(detailModal.payment_status)}
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{detailModal.team_name}</h2>
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 shrink-0">
                <button
                  onClick={() => setDetailTab("formatted")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                    detailTab === "formatted" ? "bg-blue-600 text-white" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <FileText size={14} /> Full Registration Details
                </button>
                <button
                  onClick={() => setDetailTab("raw")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                    detailTab === "raw" ? "bg-purple-600 text-white" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <Code size={14} /> Raw JSON Data
                </button>
              </div>

              {/* Tab Content */}
              <div className="overflow-y-auto flex-1 custom-scrollbar pr-1 space-y-4">
                {detailTab === "formatted" ? (
                  <>
                    {/* Leader Details Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <h3 className="text-xs uppercase tracking-wider text-blue-400 font-bold flex items-center gap-2">
                        <User size={14} /> Team Leader Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-white/40 text-xs">Full Name</p>
                          <p className="text-white font-medium">{detailModal.leader_name}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Email Address</p>
                          <p className="text-white font-medium">{detailModal.leader_email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Phone Number</p>
                          <p className="text-white font-medium">{detailModal.leader_phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Year of Study</p>
                          <p className="text-white font-medium">{detailModal.leader_year || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Department / Branch</p>
                          <p className="text-white font-medium">{detailModal.leader_branch || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">College / Institute</p>
                          <p className="text-white font-medium">{detailModal.leader_college || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Member 2 Card */}
                    {detailModal.member2_name && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs uppercase tracking-wider text-green-400 font-bold flex items-center gap-2">
                          <User size={14} /> Member 2 Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-white/40 text-xs">Full Name</p>
                            <p className="text-white font-medium">{detailModal.member2_name}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs">Email Address</p>
                            <p className="text-white font-medium">{detailModal.member2_email || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs">Phone Number</p>
                            <p className="text-white font-medium">{detailModal.member2_phone || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs">Year of Study</p>
                            <p className="text-white font-medium">{detailModal.member2_year || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Extra Members Cards */}
                    {detailModal.extra_members && detailModal.extra_members.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase tracking-wider text-amber-400 font-bold">Additional Team Members</h3>
                        {detailModal.extra_members.map((m, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                            <h4 className="text-xs font-semibold text-white/70">Member {idx + 3}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-white/40 text-xs">Full Name</p>
                                <p className="text-white font-medium">{m.name || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-white/40 text-xs">Email Address</p>
                                <p className="text-white font-medium">{m.email || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-white/40 text-xs">Phone Number</p>
                                <p className="text-white font-medium">{m.phone || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-white/40 text-xs">Year / Branch</p>
                                <p className="text-white font-medium">{m.year || "N/A"} {m.branch ? `• ${m.branch}` : ""}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment & Audit Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Payment & Transaction Audit</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-white/40 text-xs">Transaction ID</p>
                          <p className="text-white font-mono font-medium">{detailModal.transaction_id || "N/A (Free)"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Registration Timestamp</p>
                          <p className="text-white font-medium">{new Date(detailModal.created_at).toLocaleString()}</p>
                        </div>
                        {detailModal.rejection_reason && (
                          <div className="col-span-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-300 text-xs">
                            <strong>Rejection Reason:</strong> {detailModal.rejection_reason}
                          </div>
                        )}
                      </div>
                      {detailModal.payment_screenshot && (
                        <div className="pt-2">
                          <p className="text-white/40 text-xs mb-2">Payment Receipt Screenshot</p>
                          <div className="relative group inline-block max-w-sm rounded-xl overflow-hidden border border-white/10 bg-black/40">
                            <img src={detailModal.payment_screenshot} alt="Receipt" className="max-h-48 object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                              <button
                                onClick={() => setScreenshotModal(detailModal.payment_screenshot)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                              >
                                Enlarge Image
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Raw JSON Payload */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white/40 text-xs">Raw Database Record (Full JSON Payload)</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(detailModal.raw_record || detailModal, null, 2));
                          setCopiedRaw(true);
                          setTimeout(() => setCopiedRaw(false), 2000);
                        }}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {copiedRaw ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        <span>{copiedRaw ? "Copied Raw JSON!" : "Copy JSON"}</span>
                      </button>
                    </div>
                    <pre className="bg-[#050914] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-white/10 max-h-96">
                      {JSON.stringify(detailModal.raw_record || detailModal, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 shrink-0">
                {detailModal.payment_status !== "approved" && (
                  <button
                    onClick={() => { handleApproveRegistration(detailModal.id); setDetailModal(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle size={16} /> Approve Registration
                  </button>
                )}
                <button
                  onClick={() => setDetailModal(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
