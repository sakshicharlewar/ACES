import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { fetchAdminNotices, createNotice, updateNotice, deleteNotice, pinNotice } from "./adminApi";
import { Megaphone, Plus, Trash2, Edit, Pin, X, Save, Loader2, Link as LinkIcon } from "lucide-react";

export default function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editNotice, setEditNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", content: "", link: "", is_pinned: false, is_active: true });

  useEffect(() => { loadNotices(); }, []);

  async function loadNotices() {
    setLoading(true);
    const data = await fetchAdminNotices().catch(() => []);
    setNotices(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openCreate() {
    setEditNotice(null);
    setForm({ title: "", content: "", link: "", is_pinned: false, is_active: true });
    setError("");
    setModalOpen(true);
  }

  function openEdit(n) {
    setEditNotice(n);
    setForm({ title: n.title || "", content: n.content || "", link: n.link || "", is_pinned: n.is_pinned ?? false, is_active: n.is_active ?? true });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      if (editNotice) await updateNotice(editNotice.id, form);
      else await createNotice(form);
      setModalOpen(false);
      loadNotices();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this notice?")) return;
    await deleteNotice(id).catch(() => {});
    loadNotices();
  }

  async function handlePin(id) {
    await pinNotice(id).catch(() => {});
    loadNotices();
  }

  async function handleToggleActive(id, is_active) {
    await updateNotice(id, { is_active: !is_active }).catch(() => {});
    loadNotices();
  }

  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Megaphone className="w-6 h-6 text-amber-400" /> Notices</h1>
            <p className="text-white/40 text-sm mt-1">Manage announcements and pinned notices</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /> Add Notice
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No notices yet. Add your first notice.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className={`bg-[#0d1426] border rounded-2xl p-5 flex gap-4 hover:border-white/20 transition-all ${n.is_pinned ? "border-amber-500/30" : "border-white/10"} ${!n.is_active ? "opacity-50" : ""}`}>
                {n.is_pinned && (
                  <div className="shrink-0 mt-0.5"><Pin className="w-4 h-4 text-amber-400 rotate-45" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold text-sm">{n.title}</p>
                      {n.content && <p className="text-white/50 text-xs mt-1 line-clamp-2">{n.content}</p>}
                      {n.link && <a href={n.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 text-xs mt-1 hover:text-blue-300"><LinkIcon className="w-3 h-3" />{n.link}</a>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${n.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {n.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-white/30 text-xs">{fmt(n.created_at)}</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button onClick={() => handlePin(n.id)} title={n.is_pinned ? "Unpin" : "Pin"} className={`p-1.5 rounded-lg text-xs transition-colors ${n.is_pinned ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}>
                        <Pin className="w-3.5 h-3.5 rotate-45" />
                      </button>
                      <button onClick={() => handleToggleActive(n.id, n.is_active)} className="p-1.5 rounded-lg text-xs bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors text-[10px] px-2">
                        {n.is_active ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => openEdit(n)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-bold">{editNotice ? "Edit Notice" : "Add Notice"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Content (optional)</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none resize-none h-20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Link (optional)</label>
                <input type="url" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm text-white/70">Pin Notice</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm text-white/70">Active / Visible</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl flex items-center gap-2 transition-colors">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
