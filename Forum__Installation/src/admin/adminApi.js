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
  // Mocked stats since backend is offline
  let localRegs = [];
  try {
    localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
  } catch(e) {}
  
  // Try to parse local submissions if we mocked them (though currently we might only have regs)
  let localSubs = [];
  try {
    localSubs = JSON.parse(localStorage.getItem('local_submissions') || '[]');
  } catch(e) {}

  const today = new Date().setHours(0,0,0,0);
  
  const todayRegs = localRegs.filter(r => new Date(r.created_at || Date.now()).setHours(0,0,0,0) === today).length;
  const todaySubs = localSubs.filter(s => new Date(s.submitted_at || Date.now()).setHours(0,0,0,0) === today).length;

  const recentRegs = localRegs.slice(-5).reverse().map(r => ({
    id: r.id,
    full_name: r.leader_name || r.team_name || "Unknown",
    email: r.leader_email || "",
    event_id: r.event_id || 1,
    created_at: r.created_at || new Date().toISOString()
  }));

  const recentSubs = localSubs.slice(-5).reverse().map(s => ({
    id: s.id,
    idea_title: s.idea_title || "Untitled",
    full_name: s.full_name || "Unknown",
    department: s.department || "",
    submitted_at: s.submitted_at || new Date().toISOString()
  }));

  return {
    total_submissions: localSubs.length,
    total_registrations: localRegs.length,
    today_submissions: todaySubs,
    today_registrations: todayRegs,
    recent_submissions: recentSubs,
    recent_registrations: recentRegs,
    revenue: localRegs.length * 40
  };
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
  let data;
  try {
    const res = await apiFetch(`/admin/api/registrations?${params}`);
    data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch registrations");
  } catch (e) {
    data = { items: [], total: 0, page: 1, pages: 1 };
  }

  // Merge locally mocked registrations
  try {
    const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
    // Normalize local reg fields to match what AdminRegistrations table expects
    const normalized = localRegs.map(r => ({
      id: r.id,
      full_name: r.leader_name || r.full_name || r.team_name || "Unknown",
      email: r.leader_email || r.email || "",
      mobile: r.leader_phone || r.mobile || "",
      department: r.leader_dept || r.department || "",
      year: r.leader_year || r.year || "",
      event_title: r.event_title || `Event #${r.event_id || 1}`,
      event_id: r.event_id || 1,
      created_at: r.created_at || new Date().toISOString(),
      approval_status: r.approval_status || "pending",
      payment_screenshot: r.payment_screenshot || null,
      transaction_id: r.transaction_id || "",
      team_name: r.team_name || "",
      leader_name: r.leader_name || "",
      leader_email: r.leader_email || "",
      leader_phone: r.leader_phone || "",
      leader_year: r.leader_year || "",
      member2_name: r.member2_name || "",
      member2_email: r.member2_email || "",
      registration_id: r.registration_id || r.id,
    }));

    const filteredLocal = search 
      ? normalized.filter(r => 
          (r.full_name||'').toLowerCase().includes(search.toLowerCase()) || 
          (r.email||'').toLowerCase().includes(search.toLowerCase()) || 
          (r.mobile||'').includes(search) ||
          (r.team_name||'').toLowerCase().includes(search.toLowerCase())
        )
      : normalized;
    
    data.items = [...filteredLocal, ...data.items];
    data.total += filteredLocal.length;
  } catch (err) {
    console.error("Failed to parse local registrations", err);
  }

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
