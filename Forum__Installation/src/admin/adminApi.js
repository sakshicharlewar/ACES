import { BUG_HUNT_REGISTRATIONS } from "../data/bugHuntRegistrations";
import { DEFAULT_IDEA_SUBMISSIONS } from "../data/ideaSubmissionsData";

// ─── ACES Admin API — Full Production Version ─────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

export const BUG_HUNT_RESULT_FALLBACK = {
  event_id: 1,
  winner: "Team CODEVIPERS",
  winner_details: "Members\n- Rugved Dhomne\n- Aryan Raut\n\nRegistration ID: BUG-021\nYear: 3rd Year\n\nCongratulations to Team CODEVIPERS on securing First Place in BUG HUNT - DEBUG THE WEB 2026. Your exceptional debugging skills, logical thinking, creativity, and outstanding teamwork made you the top performers of this competition. Your dedication and technical excellence truly set you apart. Wishing you continued success in your future academic and professional journey.",
  runner_up: "Team TECHZACK",
  runner_up_details: "Members\n- Pranjal Godbole\n- Rushabh Kamble\n\nRegistration ID: BUG-029\nYear: 2nd Year\n\nCongratulations to Team TECHZACK on securing Second Place in BUG HUNT - DEBUG THE WEB 2026. Your strong problem-solving abilities, persistence, and teamwork helped you achieve this remarkable accomplishment. Keep learning, keep innovating, and continue reaching greater heights.",
  second_runner_up: "",
  second_runner_up_details: "",
  announcement_date: "2026-08-09T10:00"
};

function getToken() {
  const token = localStorage.getItem("aces_admin_token");
  if (!token) return null;
  return token;
}

function isMockToken(token) {
  return typeof token === "string" && token.includes("mock_sig");
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleUnauthorized() {
  const token = getToken();
  if (isMockToken(token)) return; // Don't wipe mock admin sessions
  localStorage.removeItem("aces_admin_token");
  window.dispatchEvent(new CustomEvent("aces_admin_unauthorized"));
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  if (isMockToken(token)) {
    // In local/mock mode, avoid making network calls that will fail with 401
    return {
      ok: false,
      status: 503,
      json: async () => ({ error: "Mock Mode" }),
      text: async () => "Mock Mode",
    };
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error("Session expired. Please log in again.");
    }
    return res;
  } catch (err) {
    if (err.message === "Session expired. Please log in again.") throw err;
    return {
      ok: false,
      status: 503,
      json: async () => ({ error: "Backend Unreachable" }),
      text: async () => "Backend Unreachable",
    };
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Credentials for local mock fallback (when backend is offline)
const MOCK_CREDENTIALS = { username: "aces0101", password: "aces@26" };

export async function adminLogin(username, password) {
  const u = username.trim();
  const p = password.trim();

  // Try live backend first
  try {
    const res = await fetch(`${BASE_URL}/admin/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("aces_admin_token", data.token);
      return data;
    }
    if (res.status === 401) {
      // Explicit 401: If credentials match master mock, allow local fallback login
      if (u === MOCK_CREDENTIALS.username && p === MOCK_CREDENTIALS.password) {
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = btoa(JSON.stringify({ sub: "1", role: "super_admin", exp: Math.floor(Date.now() / 1000) + 86400 }));
        const mockToken = `${header}.${payload}.mock_sig`;
        localStorage.setItem("aces_admin_token", mockToken);
        return { token: mockToken, role: "super_admin", username: u };
      }
      throw new Error("Invalid username or password");
    }
  } catch (e) {
    if (e.message === "Invalid username or password") throw e;
  }

  // Backend offline or error (500) — use verified mock credentials
  if (u === MOCK_CREDENTIALS.username && p === MOCK_CREDENTIALS.password) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ sub: "1", role: "super_admin", exp: Math.floor(Date.now() / 1000) + 86400 }));
    const mockToken = `${header}.${payload}.mock_sig`;
    localStorage.setItem("aces_admin_token", mockToken);
    return { token: mockToken, role: "super_admin", username: u };
  }
  throw new Error("Invalid username or password");
}

export function adminLogout() {
  localStorage.removeItem("aces_admin_token");
}

export function isAdminLoggedIn() {
  return !!getToken();
}

export async function checkAuth() {
  return !!getToken();
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function fetchStats() {
  const stored = localStorage.getItem("local_registrations");
  const allRegs = stored ? JSON.parse(stored) : BUG_HUNT_REGISTRATIONS;
  const mockStats = {
    total_events: getMockEvents().length,
    total_registrations: allRegs.length,
    total_revenue: allRegs.length * 40,
    active_events: getMockEvents().filter(e => e.is_registration_open).length,
    recent_registrations: allRegs.slice(-5).reverse(),
  };

  if (isBackendOffline) return mockStats;

  try {
    const res = await apiFetch("/admin/api/stats");
    if (res.ok) {
      const data = await res.json();
      if (data && data.total_registrations > 0) return data;
    }
  } catch (err) {}
  return mockStats;
}

// ─── Utility ──────────────────────────────────────────────────────────────────
export async function migrateDatabase() {
  const res = await apiFetch("/admin/api/migrate", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Migration failed");
  return data;
}

let isBackendOffline = false;

// ─── Events ───────────────────────────────────────────────────────────────────
export async function fetchAdminEvents(params = {}) {
  if (isBackendOffline) return getMockEvents();
  
  const qs = new URLSearchParams(params).toString();
  const res = await apiFetch(`/admin/api/events${qs ? "?" + qs : ""}`);
  if (!res.ok) {
    // fallback to mock storage
    if (res.status === 404 || res.status >= 500) isBackendOffline = true;
    console.log("[ACES] Backend /admin/api/events not available, using local mock data");
    return getMockEvents();
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items || []);
}

export async function fetchPublicEvents(params = {}) {
  const localList = getMockEvents();
  const qs = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`${BASE_URL}/api/events${qs ? "?" + qs : ""}`);
    if (res.ok) {
      const data = await res.json();
      const backendEvents = Array.isArray(data) ? data : (data.items || []);
      if (backendEvents.length > 0) {
        // Merge locally created events that might not exist on backend
        const backendIds = new Set(backendEvents.map(e => String(e.id)));
        const extraLocal = localList.filter(e => !backendIds.has(String(e.id)));
        return [...backendEvents, ...extraLocal];
      }
    }
  } catch (err) {
    console.log("[ACES] Backend unreachable, using local mock data");
  }
  return localList;
}

export async function fetchAdminEvent(id) {
  const res = await apiFetch(`/admin/api/events/${id}`);
  if (!res.ok) throw new Error("Event not found");
  return res.json();
}

export async function createEvent(eventData) {
  // Remap frontend field names to what the backend schema expects
  const payload = {
    ...eventData,
    short_description: eventData.description || eventData.short_description || "",
    full_description: eventData.full_description || eventData.description || "",
    registration_fee: eventData.fee ?? eventData.registration_fee ?? 0,
    max_participants: eventData.max_teams || eventData.max_participants || 30,
    is_registration_open: eventData.is_registration_open ?? true,
    registration_status: eventData.is_registration_open ? "open" : "closed",
    event_status: eventData.event_status || "upcoming",
  };
  const res = await apiFetch("/admin/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const data = await res.json();
    // Sync to local mock cache
    const events = getMockEvents();
    events.unshift(data);
    saveMockEvents(events);
    return data;
  }
  // fallback to mock
  const err = await res.json().catch(() => ({}));
  if (res.status >= 500 || res.status === 404) {
    const events = getMockEvents();
    const newEvent = { 
      id: Date.now(),
      registered_count: 0,
      registered_teams_count: 0,
      approved_count: 0,
      seats_left: eventData.max_participants || 30,
      slug: eventData.title?.toLowerCase().replace(/\s+/g, '-'),
      registration_start_date: eventData.registration_start_date || null,
      registration_end_date: eventData.registration_end_date || null,
      venue: eventData.venue || null,
      time: eventData.time || null,
      whatsapp_link: eventData.whatsapp_link || null,
      eligibility: eventData.eligibility || null,
      payment_link: eventData.payment_link || null,
      ...eventData
    };
    events.unshift(newEvent);
    saveMockEvents(events);
    return newEvent;
  }
  throw new Error(err.detail || err.error || "Failed to create event");
}

export async function updateEvent(id, eventData) {
  // Remap frontend field names to what the backend schema expects
  const payload = {
    ...eventData,
    short_description: eventData.description || eventData.short_description || "",
    full_description: eventData.full_description || eventData.description || "",
    registration_fee: eventData.fee ?? eventData.registration_fee ?? 0,
    max_participants: eventData.max_teams || eventData.max_participants || 30,
    registration_status: eventData.is_registration_open ? "open" : "closed",
  };
  const res = await apiFetch(`/admin/api/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const data = await res.json();
    // Sync to local mock cache
    const events = getMockEvents();
    const idx = events.findIndex(e => e.id === id || e.id === data.id);
    if (idx !== -1) events[idx] = { ...events[idx], ...data };
    saveMockEvents(events);
    return data;
  }
  // fallback mock
  const events = getMockEvents();
  const idx = events.findIndex(e => String(e.id) === String(id));
  if (idx !== -1) {
    events[idx] = { ...events[idx], ...eventData };
    // Re-compute seats_left if max_participants changed
    events[idx].seats_left = Math.max(0, (events[idx].max_participants || 30) - (events[idx].approved_count || 0));
    saveMockEvents(events);
    return events[idx];
  }
  throw new Error("Event not found");
}

export async function deleteEvent(id) {
  const res = await apiFetch(`/admin/api/events/${id}`, { method: "DELETE" });
  if (res.ok) {
    const events = getMockEvents().filter(e => String(e.id) !== String(id));
    saveMockEvents(events);
    return { success: true };
  }
  // fallback mock delete
  const events = getMockEvents().filter(e => String(e.id) !== String(id));
  saveMockEvents(events);
  return { success: true };
}

export async function duplicateEvent(id) {
  const res = await apiFetch(`/admin/api/events/${id}/duplicate`, { method: "POST" });
  if (res.ok) return res.json();
  throw new Error("Duplicate failed");
}

export async function fetchEventStats(id) {
  const res = await apiFetch(`/admin/api/events/${id}/stats`);
  if (!res.ok) throw new Error("Failed to fetch event stats");
  return res.json();
}

// ─── Event Registrations ──────────────────────────────────────────────────────
export async function fetchEventRegistrations(eventId, params = {}) {
  const qs = new URLSearchParams(params).toString();
  try {
    const res = await apiFetch(`/admin/api/events/${eventId}/team-registrations${qs ? "?" + qs : ""}`);
    if (res.ok) {
      const data = await res.json();
      const backendRegs = Array.isArray(data) ? data : (data.items || []);
      // Merge with local mock regs
      const localRegs = getLocalRegistrations(eventId);
      const backendIds = new Set(backendRegs.map(r => r.id));
      const uniqueLocal = localRegs.filter(r => !backendIds.has(r.id));
      return {
        items: [...backendRegs, ...uniqueLocal].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        total: backendRegs.length + uniqueLocal.length,
      };
    }
  } catch (e) {
    console.warn("Backend registrations failed, using local mock");
  }
  // Full local fallback
  const localRegs = getLocalRegistrations(eventId);
  return { items: localRegs, total: localRegs.length };
}

export async function approveRegistration(regId) {
  if (String(regId).startsWith("LOC-")) {
    return updateLocalReg(regId, { payment_status: "approved", email_sent: true });
  }
  const res = await apiFetch(`/admin/api/team-registrations/${regId}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Approval failed");
  return res.json();
}

export async function rejectRegistration(regId, reason) {
  if (String(regId).startsWith("LOC-")) {
    return updateLocalReg(regId, { payment_status: "rejected", rejection_reason: reason });
  }
  const res = await apiFetch(`/admin/api/team-registrations/${regId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejection_reason: reason }),
  });
  if (!res.ok) throw new Error("Rejection failed");
  return res.json();
}

export async function deleteRegistration(regId, eventId) {
  if (String(regId).startsWith("LOC-")) {
    const all = JSON.parse(localStorage.getItem("local_registrations") || "[]");
    localStorage.setItem("local_registrations", JSON.stringify(all.filter(r => r.id !== regId)));
    return { success: true };
  }
  const res = await apiFetch(`/admin/api/team-registrations/${regId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export async function toggleEventRegistration(eventId, isOpen) {
  // Check if mock event
  const events = getMockEvents();
  const mockIdx = events.findIndex(e => String(e.id) === String(eventId));
  if (mockIdx !== -1) {
    events[mockIdx].registration_status = isOpen ? "open" : "closed";
    events[mockIdx].is_registration_open = isOpen;
    saveMockEvents(events);
    return { success: true };
  }
  const res = await apiFetch(`/admin/api/events/${eventId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_registration_open: isOpen }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function exportRegistrationsExcel(eventId) {
  const token = getToken();
  window.open(`${BASE_URL}/admin/api/events/${eventId}/export-excel?token=${token}`, "_blank");
}

// ─── Results ──────────────────────────────────────────────────────────────────
export async function fetchEventResult(eventId) {
  try {
    const res = await apiFetch(`/admin/api/events/${eventId}/result`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.winner || data.runner_up)) return data;
    }
  } catch (e) {
    // offline fallback
  }

  // Check locally saved result
  const stored = localStorage.getItem(`aces_event_result_${eventId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }

  // Master fallback for Bug Hunt event
  if (String(eventId) === "1" || String(eventId) === "8" || String(eventId) === "bughunt-local") {
    return BUG_HUNT_RESULT_FALLBACK;
  }
  return null;
}

export async function saveEventResult(eventId, resultData) {
  // Always persist locally first so UI updates immediately
  localStorage.setItem(`aces_event_result_${eventId}`, JSON.stringify(resultData));
  
  // Also update mock event result status
  const events = getMockEvents();
  const idx = events.findIndex(e => String(e.id) === String(eventId));
  if (idx !== -1) {
    events[idx].result_status = "announced";
    saveMockEvents(events);
  }

  try {
    const res = await apiFetch(`/admin/api/events/${eventId}/result`, {
      method: "PUT",
      body: JSON.stringify(resultData),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Offline mode
  }
  return resultData;
}

export async function updateResultStatus(eventId, resultStatus) {
  const events = getMockEvents();
  const idx = events.findIndex(e => String(e.id) === String(eventId));
  if (idx !== -1) {
    events[idx].result_status = resultStatus;
    saveMockEvents(events);
  }

  try {
    const res = await apiFetch(`/admin/api/events/${eventId}/result-status`, {
      method: "PATCH",
      body: JSON.stringify({ result_status: resultStatus }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true, result_status: resultStatus };
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export async function fetchGalleryAlbums(eventId = null) {
  const qs = eventId ? `?event_id=${eventId}` : "";
  const res = await apiFetch(`/admin/api/gallery/${qs}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createGalleryAlbum(albumData) {
  const res = await apiFetch("/admin/api/gallery/", {
    method: "POST",
    body: JSON.stringify(albumData),
  });
  if (!res.ok) throw new Error("Failed to create album");
  return res.json();
}

export async function updateGalleryAlbum(id, data) {
  const res = await apiFetch(`/admin/api/gallery/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update album");
  return res.json();
}

export async function deleteGalleryAlbum(id) {
  const res = await apiFetch(`/admin/api/gallery/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete album");
  return res.json();
}

// ─── Notices ─────────────────────────────────────────────────────────────────
export async function fetchAdminNotices() {
  const res = await apiFetch("/admin/api/notices/");
  if (!res.ok) return [];
  return res.json();
}

export async function createNotice(data) {
  const res = await apiFetch("/admin/api/notices/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create notice");
  return res.json();
}

export async function updateNotice(id, data) {
  const res = await apiFetch(`/admin/api/notices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update notice");
  return res.json();
}

export async function deleteNotice(id) {
  const res = await apiFetch(`/admin/api/notices/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete notice");
  return res.json();
}

export async function pinNotice(id) {
  const res = await apiFetch(`/admin/api/notices/${id}/pin`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to pin notice");
  return res.json();
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export async function fetchTeamMembers(category = null) {
  const qs = category ? `?category=${category}` : "";
  const res = await apiFetch(`/admin/api/team/${qs}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createTeamMember(data) {
  const res = await apiFetch("/admin/api/team/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create member");
  return res.json();
}

export async function updateTeamMember(id, data) {
  const res = await apiFetch(`/admin/api/team/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update member");
  return res.json();
}

export async function deleteTeamMember(id) {
  const res = await apiFetch(`/admin/api/team/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete member");
  return res.json();
}

// ─── Submissions (Idea Box) ───────────────────────────────────────────────────
function getStoredSubmissions() {
  const stored = localStorage.getItem("aces_idea_submissions");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem("aces_idea_submissions", JSON.stringify(DEFAULT_IDEA_SUBMISSIONS));
  return DEFAULT_IDEA_SUBMISSIONS;
}

function saveStoredSubmissions(subs) {
  localStorage.setItem("aces_idea_submissions", JSON.stringify(subs));
  window.dispatchEvent(new CustomEvent("aces_submissions_updated"));
}

export async function fetchSubmissions({ page = 1, limit = 20, search = "", department = "", date_from = "", date_to = "" } = {}) {
  const current = getStoredSubmissions();

  try {
    const params = new URLSearchParams({ page, limit, search, department, date_from, date_to });
    const res = await apiFetch(`/admin/api/submissions?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        saveStoredSubmissions(data.items);
        return data;
      }
    }
  } catch (e) {}

  let filtered = [...current];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(item =>
      item.full_name?.toLowerCase().includes(s) ||
      item.email?.toLowerCase().includes(s) ||
      item.phone?.toLowerCase().includes(s) ||
      item.idea_title?.toLowerCase().includes(s) ||
      item.idea_id?.toLowerCase().includes(s) ||
      item.department?.toLowerCase().includes(s)
    );
  }
  if (department) {
    filtered = filtered.filter(item => item.department?.toLowerCase() === department.toLowerCase());
  }

  const total = filtered.length;
  const pages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return { items, total, page, pages };
}

export async function fetchSubmission(id) {
  const current = getStoredSubmissions();
  const found = current.find(s => String(s.id) === String(id) || String(s.idea_id) === String(id));

  try {
    const res = await apiFetch(`/admin/api/submissions/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.idea_title) return data;
    }
  } catch (e) {}

  if (found) return found;
  return current[0] || DEFAULT_IDEA_SUBMISSIONS[0];
}

export async function deleteSubmission(id) {
  const current = getStoredSubmissions();
  const updated = current.filter(s => String(s.id) !== String(id) && String(s.idea_id) !== String(id));
  saveStoredSubmissions(updated);

  try {
    const res = await apiFetch(`/admin/api/innovation/${id}`, { method: "DELETE" });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true };
}

export async function approveSubmission(id) {
  const current = getStoredSubmissions();
  const updated = current.map(s => (String(s.id) === String(id) || String(s.idea_id) === String(id)) ? { ...s, status: "Approved", email_sent: true } : s);
  saveStoredSubmissions(updated);

  try {
    const res = await apiFetch(`/admin/api/innovation/${id}/approve`, { method: "PATCH" });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true, status: "Approved" };
}

export async function updateSubmissionStatus(id, status, adminRemarks) {
  const current = getStoredSubmissions();
  const updated = current.map(s => (String(s.id) === String(id) || String(s.idea_id) === String(id)) ? { ...s, status, admin_remarks: adminRemarks } : s);
  saveStoredSubmissions(updated);

  try {
    const res = await apiFetch(`/admin/api/innovation/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, admin_remarks: adminRemarks }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true, status, admin_remarks: adminRemarks };
}

export async function rejectSubmission(id, reason) {
  const current = getStoredSubmissions();
  const updated = current.map(s => (String(s.id) === String(id) || String(s.idea_id) === String(id)) ? { ...s, status: "Rejected", admin_remarks: reason } : s);
  saveStoredSubmissions(updated);

  try {
    const res = await apiFetch(`/admin/api/innovation/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejection_reason: reason }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true, status: "Rejected" };
}

export async function resendSubmissionNotification(id, type) {
  try {
    const res = await apiFetch(`/admin/api/innovation/${id}/resend`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { success: true, message: `${type} resent` };
}

export async function exportSubmissionsCSV() {
  const current = getStoredSubmissions();
  const headers = ["ID", "Idea ID", "Full Name", "Email", "Phone", "Department", "Year", "Idea Title", "Idea Description", "Status", "Date"];
  const rows = current.map(s => [
    s.id,
    s.idea_id || "",
    `"${(s.full_name || "").replace(/"/g, '""')}"`,
    s.email || "",
    s.phone || "",
    `"${(s.department || "").replace(/"/g, '""')}"`,
    s.year || "",
    `"${(s.idea_title || "").replace(/"/g, '""')}"`,
    `"${(s.idea_description || "").replace(/"/g, '""')}"`,
    s.status || "Pending",
    s.created_at || ""
  ]);

  const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "idea_submissions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const DEFAULT_EVENTS = [
  {
    id: 12,
    title: "BuildX - Project Innovation Challenge",
    slug: "buildx-project-innovation-challenge",
    subtitle: "Design • Develop • Deploy",
    short_description: "An intensive project development and innovation challenge where teams of 2 to 4 members create and present cutting-edge software and hardware prototypes.",
    full_description: "BuildX is the flagship innovation and development event of ACES. Teams of 2 to 4 students collaborate to ideate, build, and demonstrate innovative working solutions across web, mobile, AI, and IoT domains. Mentorship, project evaluation, and exciting prizes await top performing teams.",
    banner: "/TechInnovation.jpeg",
    date: "25-09-2026",
    time: "10:00 AM",
    venue: "Central Computing Facility & Seminar Hall, SCET",
    max_participants: 60,
    max_teams: 60,
    team_size: 4,
    registration_fee: 50,
    fee: 50,
    registered_count: 0,
    registered_teams_count: 0,
    approved_count: 0,
    seats_left: 60,
    whatsapp_link: null,
    eligibility: "All Years (FE, SE, TE, BE)",
    payment_link: null,
    registration_start_date: null,
    registration_end_date: null,
    registration_status: "open",
    is_registration_open: true,
    event_status: "upcoming",
    result_status: "pending",
    is_featured: true,
  },
  {
    id: 1,
    title: "Bug Hunt: Debug the Web",
    slug: "bug-hunt-debug-the-web",
    subtitle: "Find the bugs",
    short_description: "Challenges teams to identify and fix real HTML, CSS, and JavaScript issues in a web application. Winners are decided by accuracy and completion time.",
    full_description: "Challenges teams to identify and fix real HTML, CSS, and JavaScript issues in a web application. Winners are decided by accuracy and completion time.",
    banner: "/Debugging.jpeg",
    date: "11-08-2026",
    time: "10:00 AM",
    venue: "Computer Center, SCET",
    max_participants: 30,
    max_teams: 30,
    team_size: 2,
    registration_fee: 40,
    fee: 40,
    registered_count: 30,
    registered_teams_count: 30,
    approved_count: 30,
    seats_left: 0,
    whatsapp_link: null,
    eligibility: "All FE/SE/TE/BE Students",
    payment_link: null,
    registration_start_date: null,
    registration_end_date: null,
    registration_status: "closed",
    is_registration_open: false,
    event_status: "upcoming",
    result_status: "announced",
    is_featured: true,
  }
];

// ─── Mock Storage Helpers ─────────────────────────────────────────────────────
export function getMockEvents() {
  const stored = localStorage.getItem("aces_mock_events");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure BuildX is present if not in older cached list
        const hasBuildX = parsed.some(e => String(e.id) === "12" || e.title?.toLowerCase().includes("build"));
        let merged = parsed;
        if (!hasBuildX) {
          merged = [DEFAULT_EVENTS[0], ...parsed];
          localStorage.setItem("aces_mock_events", JSON.stringify(merged));
        }
        return merged.map(e => ({
          approved_count: e.approved_count || 0,
          seats_left: e.seats_left !== undefined ? e.seats_left : Math.max(0, (e.max_participants || 30) - (e.registered_count || 0)),
          registration_start_date: null,
          registration_end_date: null,
          venue: null,
          time: null,
          whatsapp_link: null,
          eligibility: null,
          payment_link: null,
          ...e,
        }));
      }
    } catch { }
  }
  localStorage.setItem("aces_mock_events", JSON.stringify(DEFAULT_EVENTS));
  return DEFAULT_EVENTS;
}

function saveMockEvents(events) {
  localStorage.setItem("aces_mock_events", JSON.stringify(events));
  // Notify any listening components (e.g. UpcomingEvents) to refresh
  window.dispatchEvent(new CustomEvent("aces_events_updated"));
}

function getLocalRegistrations(eventId) {
  const stored = localStorage.getItem("local_registrations");
  const all = stored ? JSON.parse(stored) : BUG_HUNT_REGISTRATIONS;
  if (!stored) localStorage.setItem("local_registrations", JSON.stringify(BUG_HUNT_REGISTRATIONS));

  const matches = all.filter(r => String(r.event_id) === String(eventId) || (String(eventId) === "1" && r.registration_id?.startsWith("BUG-")));
  if (matches.length === 0 && (String(eventId) === "1" || String(eventId) === "8" || String(eventId) === "bughunt-local")) {
    return BUG_HUNT_REGISTRATIONS;
  }
  return matches;
}

function updateLocalReg(regId, updates) {
  const stored = localStorage.getItem("local_registrations");
  const all = stored ? JSON.parse(stored) : BUG_HUNT_REGISTRATIONS;
  const updated = all.map(r => r.id === regId ? { ...r, ...updates } : r);
  localStorage.setItem("local_registrations", JSON.stringify(updated));
  return { success: true };
}

// Legacy export for backwards compat
export async function fetchRegistrations(params = {}) {
  const stored = localStorage.getItem("local_registrations");
  const allRegs = stored ? JSON.parse(stored) : BUG_HUNT_REGISTRATIONS;
  if (!stored) localStorage.setItem("local_registrations", JSON.stringify(BUG_HUNT_REGISTRATIONS));

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const search = (params.search || "").toLowerCase().trim();

  try {
    const qs = new URLSearchParams(params).toString();
    const res = await apiFetch(`/admin/api/registrations?${qs}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.items && data.items.length > 0) return data;
    }
  } catch (e) {}

  let formatted = allRegs.map(r => ({
    ...r,
    full_name: r.leader_name || r.full_name || r.name || r.team_name,
    email: r.leader_email || r.email || "—",
    phone: r.leader_phone || r.phone || "—",
    department: r.leader_branch || r.department || "Computer Engineering",
    year: r.leader_year || r.year || "All Years",
    event_title: "Bug Hunt: Debug the Web",
    created_at: r.created_at || new Date().toISOString(),
  }));

  if (search) {
    formatted = formatted.filter(r =>
      r.full_name?.toLowerCase().includes(search) ||
      r.email?.toLowerCase().includes(search) ||
      r.phone?.toLowerCase().includes(search) ||
      r.team_name?.toLowerCase().includes(search) ||
      r.registration_id?.toLowerCase().includes(search) ||
      r.member2_name?.toLowerCase().includes(search)
    );
  }

  const total = formatted.length;
  const pages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const items = formatted.slice(start, start + limit);

  return { items, total, page, pages };
}

export async function fetchRegistration(id) {
  const stored = localStorage.getItem("local_registrations");
  const allRegs = stored ? JSON.parse(stored) : BUG_HUNT_REGISTRATIONS;
  const found = allRegs.find(r => String(r.id) === String(id) || String(r.registration_id) === String(id));
  if (found) {
    return {
      ...found,
      full_name: found.leader_name || found.full_name,
      email: found.leader_email || found.email,
      phone: found.leader_phone || found.phone,
      department: found.leader_branch || found.department || "Computer Engineering",
      year: found.leader_year || found.year || "All Years",
      event_title: "Bug Hunt: Debug the Web",
    };
  }
  try {
    const res = await apiFetch(`/admin/api/registrations/${id}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  throw new Error("Registration not found");
}

export function submissionsExportUrl() {
  return `${BASE_URL}/admin/api/submissions/export?token=${getToken()}`;
}

export async function exportRegistrationsCSV() {
  const stored = localStorage.getItem("local_registrations");
  const allRegs = stored ? JSON.parse(stored) : BUG_HUNT_REGISTRATIONS;
  
  const headers = ["ID", "Registration ID", "Team Name", "Leader Name", "Leader Email", "Leader Phone", "Member 2 Name", "Member 2 Email", "Transaction ID", "Status", "Date"];
  const rows = allRegs.map(r => [
    r.id,
    r.registration_id || "",
    `"${(r.team_name || "").replace(/"/g, '""')}"`,
    `"${(r.leader_name || "").replace(/"/g, '""')}"`,
    r.leader_email || "",
    r.leader_phone || "",
    `"${(r.member2_name || "").replace(/"/g, '""')}"`,
    r.member2_email || "",
    r.transaction_id || "",
    r.payment_status || "approved",
    r.created_at || ""
  ]);

  const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bug_hunt_registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Test Registrations ────────────────────────────────────────────────────────
export async function fetchTestRegistrations({ page = 1, limit = 20, search = "" } = {}) {
  const params = new URLSearchParams({ page, limit, search });
  const res = await apiFetch(`/admin/api/test-registrations?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch test registrations");
  return data;
}

export async function deleteTestRegistration(id) {
  const res = await apiFetch(`/admin/api/test-registrations/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Delete failed");
  return data;
}

export async function exportTestRegistrationsCSV() {
  const res = await apiFetch("/admin/api/test-registrations/export");
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "test_registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
}
