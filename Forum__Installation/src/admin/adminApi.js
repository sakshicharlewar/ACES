// ─── ACES Admin API — Full Production Version ─────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

function getToken() {
  const token = localStorage.getItem("aces_admin_token");
  if (!token) return null;
  // Detect and discard stale mock tokens (base64 JSON, not real JWTs)
  // Real JWTs have 3 dot-separated base64url segments starting with eyJ
  const parts = token.split(".");
  if (parts.length !== 3) {
    // This is a mock/invalid token — clear it so real login is forced
    localStorage.removeItem("aces_admin_token");
    return null;
  }
  return token;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function handleUnauthorized() {
  localStorage.removeItem("aces_admin_token");
  // Use React Router navigation instead of hard redirect to avoid full page reload
  window.dispatchEvent(new CustomEvent("aces_admin_unauthorized"));
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }
  return res;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Credentials for local mock fallback (when backend is offline)
const MOCK_CREDENTIALS = { username: "aces0101", password: "aces@26" };

export async function adminLogin(username, password) {
  try {
    const res = await fetch(`${BASE_URL}/admin/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("aces_admin_token", data.token);
      return data;
    }
    const err = await res.json().catch(() => ({}));
    // Don't fallback for explicit 401 — wrong password
    if (res.status === 401) throw new Error(err.detail || "Invalid username or password");
    throw new Error(err.detail || "Login failed");
  } catch (e) {
    // If it's a real auth error, rethrow
    if (e.message === "Invalid username or password") throw e;

    // Backend offline — use mock credentials
    console.warn("Backend unreachable, using local mock login");
    if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
      const mockToken = btoa(JSON.stringify({ sub: "1", role: "super_admin", exp: Date.now() + 86400000 }));
      localStorage.setItem("aces_admin_token", mockToken);
      return { token: mockToken, role: "super_admin", username };
    }
    throw new Error("Invalid username or password");
  }
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
  if (isBackendOffline) {
    return {
      total_events: getMockEvents().length,
      total_registrations: JSON.parse(localStorage.getItem("local_registrations") || "[]").length,
      total_revenue: 0,
      active_events: getMockEvents().filter(e => e.is_registration_open).length,
      recent_registrations: [],
    };
  }
  try {
    const res = await apiFetch("/admin/api/stats");
    if (!res.ok) {
      // Only set offline for network-level failures, not auth errors
      if (res.status === 404 || res.status >= 500) isBackendOffline = true;
      throw new Error("Stats not available");
    }
    return await res.json();
  } catch (err) {
    // Don't mark offline if it was an auth error (401/403)
    if (err.message !== "Session expired. Please log in again.") isBackendOffline = true;
    return {
      total_events: getMockEvents().length,
      total_registrations: JSON.parse(localStorage.getItem("local_registrations") || "[]").length,
      total_revenue: 0,
      active_events: getMockEvents().filter(e => e.is_registration_open).length,
      recent_registrations: [],
    };
  }
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
  if (isBackendOffline) return getMockEvents();

  const qs = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`${BASE_URL}/api/events${qs ? "?" + qs : ""}`);
    if (!res.ok) {
      if (res.status === 404 || res.status >= 500) isBackendOffline = true;
      console.log("[ACES] Backend /api/events not available, using local mock data");
      return getMockEvents();
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || []);
  } catch (err) {
    isBackendOffline = true;
    console.log("[ACES] Backend unreachable, using local mock data");
    return getMockEvents();
  }
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
  const res = await apiFetch(`/admin/api/events/${eventId}/result`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch result");
  return res.json();
}

export async function saveEventResult(eventId, resultData) {
  const res = await apiFetch(`/admin/api/events/${eventId}/result`, {
    method: "PUT",
    body: JSON.stringify(resultData),
  });
  if (!res.ok) throw new Error("Failed to save result");
  return res.json();
}

export async function updateResultStatus(eventId, resultStatus) {
  const res = await apiFetch(`/admin/api/events/${eventId}/result-status`, {
    method: "PATCH",
    body: JSON.stringify({ result_status: resultStatus }),
  });
  if (!res.ok) throw new Error("Failed to update result status");
  return res.json();
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

// ─── Submissions (Legacy) ─────────────────────────────────────────────────────
export async function fetchSubmissions({ page = 1, limit = 20, search = "", department = "", date_from = "", date_to = "" } = {}) {
  const params = new URLSearchParams({ page, limit, search, department, date_from, date_to });
  const res = await apiFetch(`/admin/api/submissions?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch submissions");
  return data;
}

export async function fetchSubmission(id) {
  const res = await apiFetch(`/admin/api/submissions/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Not found");
  return data;
}

export async function deleteSubmission(id) {
  const res = await apiFetch(`/admin/api/innovation/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Delete failed");
  return data;
}

export async function approveSubmission(id) {
  const res = await apiFetch(`/admin/api/innovation/${id}/approve`, { method: "PATCH" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Approval failed");
  return data;
}

export async function updateSubmissionStatus(id, status, adminRemarks) {
  const res = await apiFetch(`/admin/api/innovation/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, admin_remarks: adminRemarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update status");
  return data;
}

export async function rejectSubmission(id, reason) {
  const res = await apiFetch(`/admin/api/innovation/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejection_reason: reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Rejection failed");
  return data;
}

export async function resendSubmissionNotification(id, type) {
  const res = await apiFetch(`/admin/api/innovation/${id}/resend`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Resend failed");
  return data;
}

export async function exportSubmissionsCSV() {
  const res = await apiFetch("/admin/api/submissions/export");
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "submissions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Mock Storage Helpers ─────────────────────────────────────────────────────
function getMockEvents() {
  const stored = localStorage.getItem("aces_mock_events");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Backfill any missing new fields on stored events
      return parsed.map(e => ({
        approved_count: 0,
        seats_left: Math.max(0, (e.max_participants || 30) - (e.approved_count || 0)),
        registration_start_date: null,
        registration_end_date: null,
        venue: null,
        time: null,
        whatsapp_link: null,
        eligibility: null,
        payment_link: null,
        ...e,
      }));
    } catch { }
  }
  const defaults = [{
    id: 1,
    title: "Bug Hunt: Debug the Web",
    slug: "bug-hunt-debug-the-web",
    subtitle: "Find the bugs",
    short_description: "Challenges teams to identify and fix real HTML, CSS, and JavaScript issues.",
    date: null,
    time: null,
    venue: null,
    max_participants: 30,
    max_teams: 30,
    team_size: 2,
    registration_fee: 40,
    fee: 40,
    registered_count: 0,
    registered_teams_count: 0,
    approved_count: 0,
    seats_left: 30,
    whatsapp_link: null,
    eligibility: null,
    payment_link: null,
    registration_start_date: null,
    registration_end_date: null,
    registration_status: "open",
    is_registration_open: true,
    event_status: "upcoming",
    result_status: "pending",
    is_featured: true,
  }];
  localStorage.setItem("aces_mock_events", JSON.stringify(defaults));
  return defaults;
}

function saveMockEvents(events) {
  localStorage.setItem("aces_mock_events", JSON.stringify(events));
  // Notify any listening components (e.g. UpcomingEvents) to refresh
  window.dispatchEvent(new CustomEvent("aces_events_updated"));
}

function getLocalRegistrations(eventId) {
  const all = JSON.parse(localStorage.getItem("local_registrations") || "[]");
  return all.filter(r => String(r.event_id) === String(eventId));
}

function updateLocalReg(regId, updates) {
  const all = JSON.parse(localStorage.getItem("local_registrations") || "[]");
  const updated = all.map(r => r.id === regId ? { ...r, ...updates } : r);
  localStorage.setItem("local_registrations", JSON.stringify(updated));
  return { success: true };
}

// Legacy export for backwards compat
export async function fetchRegistrations(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiFetch(`/admin/api/registrations?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed");
  return data;
}

export async function fetchRegistration(id) {
  const res = await apiFetch(`/admin/api/registrations/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Not found");
  return data;
}

export function submissionsExportUrl() {
  return `${BASE_URL}/admin/api/submissions/export?token=${getToken()}`;
}

export async function exportRegistrationsCSV() {
  const res = await apiFetch("/admin/api/registrations/export");
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "registrations.csv";
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
