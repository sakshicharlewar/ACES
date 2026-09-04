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
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    pending:  "bg-yellow-100 text-yellow-800",
  };
  const icons = {
    approved: <CheckCircle size={12} className="inline mr-1" />,
    rejected: <XCircle size={12} className="inline mr-1" />,
    pending:  <Clock size={12} className="inline mr-1" />,
  };
  const cls = map[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
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
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Registrations</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="">Select Event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
            {selectedEvent && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedEvent.registered_teams_count >= selectedEvent.max_teams ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                {selectedEvent.registered_teams_count} / {selectedEvent.max_teams} Teams
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {/* Search — also by Transaction ID */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search name, email, txn ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Event Status Dashboard */}
      {selectedEvent && (
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          selectedEvent.is_registration_open
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">{selectedEvent.registered_teams_count ?? registrations.length}</p>
                <p className="text-xs text-blue-600">Total Registered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {Math.max(0, (selectedEvent.max_participants ?? selectedEvent.max_teams ?? 30) - (selectedEvent.registered_teams_count ?? registrations.length))}
                </p>
                <p className="text-xs text-green-600">Seats Remaining</p>
              </div>
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                  selectedEvent.is_registration_open
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedEvent.is_registration_open ? '🟢 Open' : '🔴 Closed'}
                </span>
                <p className="text-xs text-gray-500 mt-1">Registration Status</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {selectedEvent.result_status === "announced" ? (
                <button
                  disabled
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow opacity-60 cursor-not-allowed"
                  title="Results have been announced. No further changes can be made."
                >
                  <Lock size={14} /> Registration Locked
                </button>
              ) : selectedEvent.is_registration_open ? (
                <button
                  onClick={() => handleToggleStatus(selectedEvent.id, false)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow"
                >
                  <Lock size={14} /> Close Registration
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus(selectedEvent.id, true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow"
                >
                  <Unlock size={14} /> Open Registration
                </button>
              )}
              {selectedEvent.result_status === "announced" && (
                <p className="text-xs text-amber-600 font-medium">⚠️ Event results are announced. Registration status cannot be changed.</p>
              )}
              {!selectedEvent.is_registration_open && selectedEvent.result_status !== "announced" && (
                <p className="text-xs text-red-600 font-medium">⚠️ Registration is currently closed. Users will see a "Registration Closed" message.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {registrations.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", count: registrations.length, color: "blue" },
            { label: "Approved", count: registrations.filter(r => r.payment_status === "approved").length, color: "green" },
            { label: "Pending", count: registrations.filter(r => !r.payment_status || r.payment_status === "pending").length, color: "yellow" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 text-center`}>
              <p className={`text-2xl font-bold text-${color}-700`}>{count}</p>
              <p className={`text-sm text-${color}-600`}>{label} Registrations</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leader</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Txn ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredRegs.length === 0 ? (
                <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-500">No registrations found.</td></tr>
              ) : filteredRegs.map(reg => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-mono font-medium text-gray-900 whitespace-nowrap">{reg.registration_id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{reg.team_name}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{reg.leader_name}</div>
                    <div className="text-xs text-gray-500">{reg.leader_email}</div>
                    <div className="text-xs text-gray-400">{reg.leader_phone}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {/* Member 2 */}
                    {reg.member2_name && (
                      <div className="mb-1">
                        <div className="text-sm text-gray-900 font-medium">M2: {reg.member2_name}</div>
                        <div className="text-xs text-gray-500">{reg.member2_email}</div>
                      </div>
                    )}
                    {/* Members 3+ from extra_members */}
                    {reg.extra_members && reg.extra_members.map((m, i) => (
                      <div key={i} className="mb-1">
                        <div className="text-sm text-gray-900 font-medium">M{i + 3}: {m.name}</div>
                        <div className="text-xs text-gray-500">{m.email}</div>
                      </div>
                    ))}
                    {!reg.member2_name && (!reg.extra_members || reg.extra_members.length === 0) && (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {statusBadge(reg.payment_status)}
                    <div className="flex flex-col gap-1 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded w-max ${reg.email_sent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        Email: {reg.email_sent ? '✅ Sent' : '❌ Pending'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded w-max ${reg.sms_sent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        SMS: {reg.sms_sent ? '✅ Sent' : '❌ Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-gray-700 max-w-[120px] truncate">
                    {reg.transaction_id || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {reg.payment_screenshot ? (
                      <div className="flex flex-col gap-2">
                        <div 
                          className="relative w-[120px] h-[120px] rounded-lg overflow-hidden border border-gray-200 cursor-pointer group bg-gray-100 flex items-center justify-center"
                          onClick={() => setScreenshotModal(reg.payment_screenshot)}
                        >
                          {(reg.payment_screenshot.startsWith("data:application/pdf") || reg.payment_screenshot.toLowerCase().endsWith(".pdf")) ? (
                            <div className="flex flex-col items-center justify-center text-gray-500 group-hover:text-gray-800 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[10px] font-medium uppercase">View PDF</span>
                            </div>
                          ) : (
                            <>
                              <img 
                                src={reg.payment_screenshot} 
                                alt="Payment" 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="text-white w-6 h-6" />
                              </div>
                            </>
                          )}
                        </div>
                        {/* Download button */}
                        <a
                          href={reg.payment_screenshot}
                          download={`payment_${reg.registration_id || reg.id}.${reg.payment_screenshot.startsWith("data:application/pdf") ? "pdf" : "jpg"}`}
                          className="flex items-center justify-center gap-1 w-[120px] py-1 text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download size={11} /> Download
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Resend Actions if handled */}
                      {reg.payment_status !== "pending" && (
                        <>
                          <button
                            onClick={() => handleResend(reg.id, "email")}
                            title="Resend Email"
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                          >
                            <Send size={15} />
                          </button>
                        </>
                      )}
                      
                      {/* Approve */}
                      {reg.payment_status !== "approved" && (
                        <button
                          onClick={() => handleApproveRegistration(reg.id)}
                          title="Approve Registration"
                          className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {/* Reject */}
                      {reg.payment_status !== "rejected" && (
                        <button
                          onClick={() => setRejectionModal({ id: reg.id })}
                          title="Reject Registration"
                          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(reg.id)}
                        title="Delete Registration"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-red-600 hover:text-red-900 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Registration</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this registration. This will be sent to the team leader.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-red-500 focus:border-red-500 resize-none h-24 mb-4"
              placeholder="e.g. Transaction ID mismatch, Fake screenshot, etc."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setRejectionModal(null); setRejectionReason(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitRejection}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
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
