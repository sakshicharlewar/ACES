import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, Download, Trash2, CheckCircle, XCircle, Clock, Eye, Lock, Unlock, Send } from "lucide-react";
import { ImagePreviewModal } from "../components/ui/ImagePreviewModal";
import { fetchAdminEvents } from "./adminApi";
import { AdminLayout } from "./AdminLayout";
import { getBaseUrl } from "../lib/apiConfig";
import { BUG_HUNT_REGISTRATIONS } from "../data/bugHuntRegistrations";

const API_URL = getBaseUrl();

const DEFAULT_EVENTS = [
  { id: 1, title: "Bug Hunt: Debug the Web", max_teams: 30, registered_teams_count: 30, is_registration_open: false, registration_status: "closed", result_status: "announced" },
  { id: 12, title: "BuildX - Project Innovation Challenge", max_teams: 30, registered_teams_count: 0, is_registration_open: true, registration_status: "open", result_status: "pending" }
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
  const initialEventId = searchParams.get("event_id") || "1";

  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [registrations, setRegistrations] = useState(initialEventId === "1" ? BUG_HUNT_REGISTRATIONS : []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [rejectionModal, setRejectionModal] = useState(null); // { id: 123 }
  const [rejectionReason, setRejectionReason] = useState("");

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
    else setRegistrations(BUG_HUNT_REGISTRATIONS);
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      let fetchedEvents = await fetchAdminEvents();
      if (!Array.isArray(fetchedEvents)) {
        fetchedEvents = fetchedEvents.items || [];
      }
      if (fetchedEvents && fetchedEvents.length > 0) {
        setEvents(fetchedEvents);
      }
    } catch (e) {
      console.warn("Using fallback events:", e);
    }
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
        // Also match orphaned "BUG-XXX" registrations if this is the Bug Hunt event (ID 1)
        if (eventId.toString() === "1" && r.registration_id && r.registration_id.startsWith("BUG-")) return true;
        return false;
      });
      
      const backendIds = new Set(backendData.map(d => d.id || d.registration_id));
      const uniqueLocalRegs = eventLocalRegs.filter(r => !backendIds.has(r.id) && !backendIds.has(r.registration_id));
      
      let finalData = [...backendData, ...uniqueLocalRegs];
      
      // If viewing Bug Hunt (ID 1)
      if (String(eventId) === "1") {
        if (finalData.length === 0) {
          finalData = BUG_HUNT_REGISTRATIONS;
        } else {
          // Merge to guarantee all 30 teams are present
          const existingRegIds = new Set(finalData.map(r => r.registration_id));
          for (const fallback of BUG_HUNT_REGISTRATIONS) {
            if (!existingRegIds.has(fallback.registration_id)) {
              finalData.push(fallback);
            }
          }
        }
      }
      
      setRegistrations(finalData.sort((a,b) => (a.registration_id || "").localeCompare(b.registration_id || "")));
    } catch (e) { 
        console.error("Failed to fetch registrations:", e);
        if (String(eventId) === "1") {
          setRegistrations(BUG_HUNT_REGISTRATIONS);
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
      "Reg ID":          r.registration_id || r.id,
      "Team Name":       r.team_name,
      "Leader Name":     r.leader_name,
      "Leader Email":    r.leader_email,
      "Leader Phone":    r.leader_phone,
      "Leader Year":     r.leader_year,
      "Member 2 Name":   r.member2_name,
      "Member 2 Email":  r.member2_email,
      "Member 2 Phone":  r.member2_phone,
      "Member 2 Year":   r.member2_year,
      "Approval Status": r.payment_status || "pending",
      "Payment Status":  r.payment_status || "pending",
      "Registration Fee": r.registration_fee || "₹40",
      "Transaction ID":  r.transaction_id || "",
      "Payment Screenshot": r.payment_screenshot
        ? (r.payment_screenshot.startsWith('data:') ? '[Attached - Download manually from admin panel]' : r.payment_screenshot)
        : 'Not uploaded',
      "Payment Date":    r.payment_time ? new Date(r.payment_time).toLocaleString() : "",
      "Verified At":     r.payment_verified_at ? new Date(r.payment_verified_at).toLocaleString() : "",
      "Reg Date":        new Date(r.created_at).toLocaleString(),
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
      </div>
    </AdminLayout>
  );
}
