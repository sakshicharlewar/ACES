// ─── Admin API Helper ─────────────────────────────────────────────────────────
// Centralised fetch wrapper: injects JWT, handles 401 auto-logout

const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

function getToken() {
  return localStorage.getItem("aces_admin_token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function handleUnauthorized() {
  localStorage.removeItem("aces_admin_token");
  window.location.href = "/admin/login";
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

export async function adminLogin(username, password) {
  const res = await fetch(`${BASE_URL}/admin/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  localStorage.setItem("aces_admin_token", data.token);
  return data;
}

export function adminLogout() {
  localStorage.removeItem("aces_admin_token");
}

export function isAdminLoggedIn() {
  return !!getToken();
}

export async function checkAuth() {
  const token = getToken();
  return !!token; // Mock: if there's a token, consider it authenticated for now
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function fetchStats() {
  const res = await apiFetch("/admin/api/stats");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch dashboard stats.");
  }
  return res.json();
}

// ─── Utility ────────────────────────────────────────────────────────────────────

export async function migrateDatabase() {
  const res = await apiFetch("/admin/api/migrate", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Migration failed");
  return data;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

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

export async function rejectSubmission(id, reason) {
  const res = await apiFetch(`/admin/api/innovation/${id}/reject`, { 
    method: "PATCH",
    body: JSON.stringify({ rejection_reason: reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Rejection failed");
  return data;
}

export async function resendSubmissionNotification(id, type) {
  const res = await apiFetch(`/admin/api/innovation/${id}/resend`, { 
    method: "POST",
    body: JSON.stringify({ type })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Resend failed");
  return data;
}

export async function updateSubmissionStatus(id, status, admin_remarks) {
  const res = await apiFetch(`/admin/api/submissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, admin_remarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Update failed");
  return data;
}

export function submissionsExportUrl() {
  return `${BASE_URL}/admin/api/submissions/export?token=${getToken()}`;
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

// ─── Registrations ────────────────────────────────────────────────────────────

export async function fetchRegistrations({ page = 1, limit = 20, search = "", event_id = 0 } = {}) {
  const params = new URLSearchParams({ page, limit, search, event_id });
  const res = await apiFetch(`/admin/api/registrations?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch registrations");
  return data;
}

export async function fetchRegistration(id) {
  const res = await apiFetch(`/admin/api/registrations/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Not found");
  return data;
}

export async function deleteRegistration(id) {
  if (id.toString().startsWith("LOC-")) {
    const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
    const updated = localRegs.filter(r => r.id !== id);
    localStorage.setItem('local_registrations', JSON.stringify(updated));
    return { success: true };
  }
  const res = await apiFetch(`/admin/api/registrations/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Delete failed");
  return data;
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
