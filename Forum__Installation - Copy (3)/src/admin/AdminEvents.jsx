import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { fetchAdminEvents, createEvent, updateEvent, deleteEvent, toggleEventRegistration } from "./adminApi";
import {
  Search, Plus, Trash2, Edit,
  Loader2, AlertCircle, X, Save, Lock, Unlock, Users
} from "lucide-react";

export function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // null means creating
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    max_teams: 0,
    team_size: 1,
    fee: 0,
    is_registration_open: true,
    qr_image: "",
    payment_link: "",
    whatsapp_link: "",
    eligibility: "",
    registration_start_date: "",
    registration_end_date: "",
    venue: "",
    time: "",
    event_status: "upcoming",
    banner: "",
  });

  const [delId, setDelId] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminEvents();
      let items = Array.isArray(res) ? res : (res.items || []);
      if (items.length === 0) {
        items = [
          { id: 1, title: "Bug Hunt: Debug the Web", max_participants: 30, max_teams: 30, registered_count: 30, registered_teams_count: 30, is_registration_open: false, registration_status: "closed", event_status: "completed", fee: 40 },
          { id: 12, title: "BUILDX - Build. Break. Adapt. Repeat.", max_participants: 60, max_teams: 60, registered_count: 0, registered_teams_count: 0, is_registration_open: true, registration_status: "open", event_status: "upcoming", fee: 200 },
        ];
      }
      setEvents(items);
    } catch (e) {
      setError(e.message);
      setEvents([
        { id: 1, title: "Bug Hunt: Debug the Web", max_participants: 30, max_teams: 30, registered_count: 30, registered_teams_count: 30, is_registration_open: false, registration_status: "closed", event_status: "completed", fee: 40 },
        { id: 12, title: "BUILDX - Build. Break. Adapt. Repeat.", max_participants: 60, max_teams: 60, registered_count: 0, registered_teams_count: 0, is_registration_open: true, registration_status: "open", event_status: "upcoming", fee: 200 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleReg(ev) {
    const nextState = !ev.is_registration_open;
    if (!window.confirm(`Are you sure you want to ${nextState ? "OPEN" : "CLOSE"} registrations for "${ev.title}"?`)) return;
    try {
      await toggleEventRegistration(ev.id, nextState);
      setEvents(events.map(e => e.id === ev.id ? { ...e, is_registration_open: nextState, registration_status: nextState ? 'open' : 'closed' } : e));
    } catch (err) {
      alert("Failed to toggle registration: " + err.message);
    }
  }

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase()) || 
    e.subtitle?.toLowerCase().includes(search.toLowerCase())
  );

  function openCreateModal() {
    setEditingEvent(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      max_teams: 0,
      team_size: 1,
      fee: 0,
      is_registration_open: true,
      qr_image: "",
      payment_link: "",
      whatsapp_link: "",
      eligibility: "",
      registration_start_date: "",
      registration_end_date: "",
      venue: "",
      time: "",
      event_status: "upcoming",
      banner: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(ev) {
    setEditingEvent(ev);
    setFormData({
      title: ev.title || "",
      subtitle: ev.subtitle || "",
      description: ev.description || ev.short_description || "",
      max_teams: ev.max_participants ?? ev.max_teams ?? 0,
      team_size: ev.team_size || 1,
      fee: ev.fee ?? ev.registration_fee ?? 0,
      is_registration_open: ev.is_registration_open ?? true,
      qr_image: ev.qr_image || "",
      payment_link: ev.payment_link || "",
      whatsapp_link: ev.whatsapp_link || "",
      eligibility: ev.eligibility || "",
      registration_start_date: ev.registration_start_date || "",
      registration_end_date: ev.registration_end_date || "",
      venue: ev.venue || "",
      time: ev.time || "",
      event_status: ev.event_status || "upcoming",
      banner: ev.banner || "",
    });
    setIsModalOpen(true);
  }

  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, qr_image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, banner: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  async function handleSaveEvent(e) {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
      } else {
        await createEvent(formData);
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete() {
    if (!delId) return;
    setDelLoading(true);
    try {
      await deleteEvent(delId);
      setDelId(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setDelLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Event Management</h1>
            <p className="text-white/40 text-sm mt-1">{events.length} total events</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500
                       text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search events by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm
                         placeholder-white/25 focus:outline-none focus:border-blue-500 transition-colors"
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
                  <th className="px-5 py-3.5 text-left font-medium">Title</th>
                  <th className="px-5 py-3.5 text-left font-medium">Registrations / Seats</th>
                  <th className="px-5 py-3.5 text-left font-medium">Fee (₹)</th>
                  <th className="px-5 py-3.5 text-left font-medium">Status</th>
                  <th className="px-5 py-3.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 bg-white/10 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-white/30">
                      No events found.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(ev => (
                    <tr key={ev.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-4 text-white/40 font-mono text-xs">{ev.id}</td>
                      <td className="px-5 py-4 text-white font-medium max-w-[200px] truncate">{ev.title}</td>
                      <td className="px-5 py-4 text-white/80">
                        <span className="font-semibold text-white">{ev.registered_teams_count ?? ev.registered_count ?? 0}</span> / {ev.max_participants ?? ev.max_teams ?? 0}
                        <span className="text-xs text-green-400 block font-normal">({ev.seats_left ?? Math.max(0, (ev.max_participants ?? ev.max_teams ?? 0) - (ev.registered_count ?? 0))} left)</span>
                      </td>
                      <td className="px-5 py-4 text-white/80">
                        {ev.fee ?? ev.registration_fee ?? "Free"}
                      </td>
                      <td className="px-5 py-4 flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          ev.is_registration_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          Reg: {ev.is_registration_open ? "Open" : "Closed"}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          ev.event_status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' :
                          ev.event_status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          Phase: {ev.event_status || 'Upcoming'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/event-registrations?event_id=${ev.id}`}
                            title="View Registrations"
                            className="p-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleToggleReg(ev)}
                            title={ev.is_registration_open ? "Close Registrations" : "Open Registrations"}
                            className={`p-1.5 rounded-lg transition-colors ${ev.is_registration_open ? "bg-orange-600/20 hover:bg-orange-600/40 text-orange-400" : "bg-green-600/20 hover:bg-green-600/40 text-green-400"}`}
                          >
                            {ev.is_registration_open ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => openEditModal(ev)}
                            title="Edit Event"
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDelId(ev.id)}
                            title="Delete Event"
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0d1426] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
                {formData.title && (
                  <p className="text-xs text-white/40 mt-1 font-mono">
                    Registration ID Format: <span className="text-blue-400 font-bold">{formData.title.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}-001</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Eligibility Criteria</label>
                <select
                  value={formData.eligibility || ""}
                  onChange={e => setFormData({ ...formData, eligibility: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="" className="bg-[#0d1426]">Any / Not Specified</option>
                  <option value="All Years" className="bg-[#0d1426]">All Years</option>
                  <option value="1st Year Only" className="bg-[#0d1426]">1st Year Only</option>
                  <option value="2nd Year Only" className="bg-[#0d1426]">2nd Year Only</option>
                  <option value="3rd Year Only" className="bg-[#0d1426]">3rd Year Only</option>
                  <option value="4th Year Only" className="bg-[#0d1426]">4th Year Only</option>
                  <option value="1st & 2nd Year" className="bg-[#0d1426]">1st & 2nd Year</option>
                  <option value="2nd & 3rd Year" className="bg-[#0d1426]">2nd & 3rd Year</option>
                  <option value="3rd & 4th Year" className="bg-[#0d1426]">3rd & 4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Max Teams (Seats)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.max_teams}
                    onChange={e => setFormData({ ...formData, max_teams: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Team Size</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.team_size}
                    onChange={e => setFormData({ ...formData, team_size: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Registration Start Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_start_date}
                    onChange={e => setFormData({ ...formData, registration_start_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Registration End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_end_date}
                    onChange={e => setFormData({ ...formData, registration_end_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Event Venue (Optional)</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Event Time (Optional)</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Registration Fee (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.fee}
                    onChange={e => setFormData({ ...formData, fee: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/70 mb-1">Event Phase</label>
                    <select
                      value={formData.event_status}
                      onChange={e => setFormData({ ...formData, event_status: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="upcoming" className="bg-[#0d1426]">Upcoming</option>
                      <option value="ongoing" className="bg-[#0d1426]">Ongoing</option>
                      <option value="completed" className="bg-[#0d1426]">Completed</option>
                      <option value="archived" className="bg-[#0d1426]">Archived</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70 cursor-pointer sm:mt-5">
                    <input
                      type="checkbox"
                      checked={formData.is_registration_open}
                      onChange={e => setFormData({ ...formData, is_registration_open: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500"
                    />
                    Registration Open
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Banner Image (Optional)</label>
                  {formData.banner && (
                    <div className="mb-2 relative w-full h-24 rounded overflow-hidden bg-white/10">
                      <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(p => ({ ...p, banner: "" }))} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                  />
                  <p className="text-xs text-white/40 mt-1">Used as main image for Departmental Events.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">QR Code Image (Optional)</label>
                  {formData.qr_image && (
                    <div className="mb-2 relative w-24 h-24 rounded overflow-hidden bg-white/10">
                      <img src={formData.qr_image} alt="QR Code" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(p => ({ ...p, qr_image: "" }))} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRUpload}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                  />
                </div>
              </div>
              <p className="text-xs text-white/40 mt-1">Upload a custom payment QR code. If none is uploaded, the default ACES QR will be shown.</p>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Payment Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.payment_link || ""}
                  onChange={e => setFormData({ ...formData, payment_link: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">Add a direct link for payment (e.g. Razorpay, UPI link) to show below the QR code.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">WhatsApp Group Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={formData.whatsapp_link || ""}
                  onChange={e => setFormData({ ...formData, whatsapp_link: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">Add a direct link to join a WhatsApp group for event updates.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Delete Event?</h3>
              <p className="text-white/50 text-sm mt-2">
                This event will be permanently deleted. This cannot be undone.
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
