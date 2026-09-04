import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Plus, Trash2, Edit, Loader2, X, Save, Image, AlertCircle, CheckCircle2
} from "lucide-react";
import { getBaseUrl } from "../lib/apiConfig";

function getToken() {
  return localStorage.getItem("aces_admin_token");
}
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

async function apiFetch(path, options = {}) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401) throw new Error("Session expired. Please log in again.");
  return res;
}

const DEFAULT_DEPT_EVENTS = [
  {
    id: 3,
    title: "REIMAGINE UI/UX Competition",
    slug: "reimagine-uiux-competition-completed",
    date: "August 20, 2025",
    short_description: "UI/UX design challenge to redesign college portals.",
    full_description: "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized the UI/UX Competition \"REIMAGINE\" under the ACES Forum on 20th August 2025 at MCA Seminar Hall for teams of two participants. A total of 40 teams (80 participants) competed in preliminary and final rounds.",
    banner: "/Reimagin.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 4,
    title: "Debugging Competition",
    slug: "debugging-competition-completed",
    date: "July 15, 2025",
    short_description: "Annual code debugging competition.",
    full_description: "The Department of Computer Engineering under Forum 'ACES' organized a Debugging Competition on 15th July 2025 at Room No. S-24 and S-30. The competition consisted of preliminary and final rounds for teams of three. A total of 60 teams (180 participants) participated.",
    banner: "/Debugging.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 5,
    title: "Logo Design Competition",
    slug: "logo-design-competition-completed",
    date: "August 13, 2025",
    short_description: "Design the official ACES student chapter logo.",
    full_description: "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized a Logo Design Competition on 13th August 2025 at Lab-III. A total of 17 students participated and created logo designs for the ACES forum. The most creative and original design was selected as the official ACES logo.",
    banner: "/LogoCompition.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 6,
    title: "Face the Panel",
    slug: "face-the-panel-completed",
    date: "Upcoming Event",
    short_description: "Mock interview and panel defense session.",
    full_description: "Face the Panel was a career-oriented mock interview event organized by the Department of Computer Engineering under the Students Forum. Participants experienced real interview scenarios, where faculty members assessed their communication, technical knowledge, confidence, and problem-solving skills. The event provided valuable feedback, helping students improve their interview performance, boost confidence, and prepare for placements and future professional opportunities.",
    banner: "/FaceThePanel.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 7,
    title: "Kite Making",
    slug: "kite-making-completed",
    date: "Upcoming Event",
    short_description: "Makar Sankranti special kite designing.",
    full_description: "Kite Making and Flying Competition was a fun-filled event organized by the Department of Computer Engineering to encourage creativity, teamwork, and festive spirit. Students showcased their artistic skills by designing colorful kites and participated enthusiastically in the flying competition, making the event a memorable celebration of innovation, collaboration, and healthy competition.",
    banner: "/KiteMaking.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 8,
    title: "National Conference 2026",
    slug: "national-conference-2026-completed",
    date: "February 3, 2026",
    short_description: "National level conference on Emerging Trends in Computing.",
    full_description: "National Conference 2026 was organized on 03 February 2026 to bring together academicians, researchers, industry experts, and students for knowledge sharing and research discussions. The event featured technical paper presentations, keynote sessions, and interactive discussions, promoting innovation, collaboration, and academic excellence across various disciplines.",
    banner: "/NationalConference.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 9,
    title: "International Conference 2026",
    slug: "international-conference-2026-completed",
    date: "April 13, 2026",
    short_description: "International conference bringing researchers together.",
    full_description: "International Conference 2026 was organized on 13 April 2026 to provide a global platform for researchers, academicians, industry professionals, and students to share innovative research and emerging technologies. The conference featured keynote speeches, technical paper presentations, and interactive sessions, fostering international collaboration, knowledge exchange, and research excellence.",
    banner: "/InternationalConference.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 10,
    title: "EduSkills 3-Day Workshop",
    slug: "eduskills-3-day-workshop-completed",
    date: "30 July – 1 August 2026",
    short_description: "Hands-on cloud & cybersecurity skills training.",
    full_description: "The Department of Computer Engineering and Department of CSE (Data Science) at Suryodaya College of Engineering and Technology successfully organised a three-day EduSkills workshop focused on enhancing students' industry-oriented technical skills. The workshop provided students with practical learning, expert guidance and hands-on exposure to emerging technologies.",
    banner: "/EduSkill.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 11,
    title: "GUEST LECTURE - Smart India Hackathon",
    slug: "guest-lecture-sih-completed",
    date: "11-08-2026 (3:00 PM)",
    short_description: "Informative session on Smart India Hackathon by Kunal Panche Sir.",
    full_description: "An informative session designed to introduce students to the Smart India Hackathon (SIH), its objectives, problem statements, team formation, idea development, and the overall selection process. The session will guide students on how to identify real-world problems, develop innovative solutions, and prepare effectively for participation in SIH.",
    banner: "/NationalConference.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
  {
    id: 13,
    title: "GUEST LECTURE - Dr. Lowlesh Yadav (HOD)",
    slug: "guest-lecture-hod-sir",
    date: "28-08-2025",
    short_description: "Special Guest Lecture and interactive technical guidance session by Dr. Lowlesh Yadav (Head of Department).",
    full_description: "Special Guest Lecture and interactive technical guidance session conducted by Dr. Lowlesh Yadav, Head of Computer Engineering Department, Suryodaya College of Engineering & Technology. The session guided students on emerging computing technologies, research opportunities, academic excellence, and career development in modern engineering.",
    banner: "/HOD_Guest_Lecture.jpeg",
    event_status: "completed",
    registration_status: "closed",
  },
];

async function fetchDeptEvents() {
  try {
    const res = await apiFetch("/admin/api/events?status=completed&limit=100");
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.items || []);
      const deptList = list.filter(e => {
        const t = (e.title || "").toLowerCase();
        const s = (e.slug || "").toLowerCase();
        const isFlagship = e.id === 1 || s.includes("bug-hunt") || s.includes("bughunt") || t.includes("bug hunt") || s.includes("buildx") || t.includes("buildx");
        return !isFlagship;
      });
      if (deptList.length > 0) return deptList;
    }
  } catch (e) {
    console.warn("fetchDeptEvents network warning:", e);
  }
  return DEFAULT_DEPT_EVENTS;
}

async function createDeptEvent(payload) {
  const res = await apiFetch("/admin/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create event");
  }
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("aces_events_updated"));
  return data;
}

async function updateDeptEvent(id, payload) {
  const res = await apiFetch(`/admin/api/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update event");
  }
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("aces_events_updated"));
  return data;
}

async function deleteDeptEvent(id) {
  const res = await apiFetch(`/admin/api/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event");
  window.dispatchEvent(new CustomEvent("aces_events_updated"));
}

const EMPTY_FORM = {
  title: "",
  date: "",
  full_description: "",
  banner: "",
  event_status: "completed",
  registration_status: "closed",
  is_registration_open: false,
  max_teams: 0,
  team_size: 1,
  fee: 0,
};

export function AdminDepartmentalEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [delId, setDelId] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDeptEvents();
      setEvents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function openCreate() {
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEdit(ev) {
    setEditingEvent(ev);
    setFormData({
      title: ev.title || "",
      date: ev.date || "",
      full_description: ev.full_description || ev.short_description || "",
      banner: ev.banner || "",
      event_status: "completed",
      registration_status: "closed",
      is_registration_open: false,
      max_teams: 0,
      team_size: 1,
      fee: 0,
    });
    setIsModalOpen(true);
  }

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, banner: reader.result }));
    reader.readAsDataURL(file);
  };

  async function handleSave(e) {
    e.preventDefault();
    setModalLoading(true);
    try {
      const payload = {
        ...formData,
        event_status: "completed",
        registration_status: "closed",
        is_registration_open: false,
        max_teams: 0,
        team_size: 1,
        fee: 0,
      };
      if (editingEvent) {
        await updateDeptEvent(editingEvent.id, payload);
        showSuccess("Event updated successfully!");
      } else {
        await createDeptEvent(payload);
        showSuccess("Event created and added to Departmental Events!");
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
      await deleteDeptEvent(delId);
      setDelId(null);
      showSuccess("Event deleted.");
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
            <h1 className="text-2xl font-bold text-white">Departmental Events</h1>
            <p className="text-white/40 text-sm mt-1">
              Manage completed events shown in the Departmental Events slider on the homepage.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Event
          </button>
        </div>

        {/* Success / Error */}
        {success && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-5 py-4 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-5 py-4 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Image className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 text-sm">No departmental events yet.</p>
            <button onClick={openCreate} className="mt-4 text-blue-400 text-sm hover:underline">
              Add your first event →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => (
              <div key={ev.id} className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all">
                {/* Banner */}
                <div className="relative h-44 bg-white/5 overflow-hidden">
                  {ev.banner ? (
                    <img src={ev.banner} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-10 h-10 text-white/10" />
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => openEdit(ev)}
                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDelId(ev.id)}
                      className="p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">{ev.title}</h3>
                  {ev.date && <p className="text-white/40 text-xs mt-1">📅 {ev.date}</p>}
                  {(ev.full_description || ev.short_description) && (
                    <p className="text-white/30 text-xs mt-2 line-clamp-2">{ev.full_description || ev.short_description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0d1426] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingEvent ? "Edit Departmental Event" : "Add New Departmental Event"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Event Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Bug Hunt: Debug the Web"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Date (display text)</label>
                <input
                  type="text"
                  placeholder="e.g. July 15, 2025 or 30 July – 1 August 2026"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Description *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Full event description..."
                  value={formData.full_description}
                  onChange={e => setFormData({ ...formData, full_description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Banner / Cover Image</label>
                {formData.banner && (
                  <div className="mb-2 relative w-full h-36 rounded-xl overflow-hidden bg-white/10">
                    <img src={formData.banner} alt="Banner preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, banner: "" }))}
                      className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-500 transition-colors"
                    >
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
                <p className="text-xs text-white/30 mt-1">This image appears as the event card's cover in the slider.</p>
              </div>

              {/* Actions */}
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
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingEvent ? "Update Event" : "Add to Departmental Events"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Remove Event?</h3>
              <p className="text-white/50 text-sm mt-2">
                This will permanently remove the event from Departmental Events. This cannot be undone.
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
