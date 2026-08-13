import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "./AdminLayout";
import { fetchTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "./adminApi";
import { Users, Plus, Trash2, Edit, X, Upload, Loader2, Save } from "lucide-react";

const CATEGORIES = ["faculty", "core", "executive"];

export default function AdminTeam() {
  const [members, setMembers] = useState([]);
  const [category, setCategory] = useState("core");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", role: "", department: "", email: "", linkedin: "", photo: "", category: "core", sort_order: 0 });
  const photoRef = useRef();

  useEffect(() => { loadMembers(); }, [category]);

  async function loadMembers() {
    setLoading(true);
    const data = await fetchTeamMembers(category).catch(() => []);
    setMembers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openCreate() {
    setEditMember(null);
    setForm({ name: "", role: "", department: "", email: "", linkedin: "", photo: "", category, sort_order: members.length });
    setError("");
    setModalOpen(true);
  }

  function openEdit(m) {
    setEditMember(m);
    setForm({ name: m.name || "", role: m.role || "", department: m.department || "", email: m.email || "", linkedin: m.linkedin || "", photo: m.photo || "", category: m.category || category, sort_order: m.sort_order ?? 0 });
    setError("");
    setModalOpen(true);
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) { setError("Name and role are required"); return; }
    setSaving(true); setError("");
    try {
      if (editMember) await updateTeamMember(editMember.id, form);
      else await createTeamMember(form);
      setModalOpen(false);
      loadMembers();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this team member?")) return;
    await deleteTeamMember(id).catch(() => {});
    loadMembers();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Users className="w-6 h-6 text-blue-400" /> Team Members</h1>
            <p className="text-white/40 text-sm mt-1">Manage faculty, core team and executive members</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${category === cat ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No {category} members yet. Add the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {members.map(m => (
              <div key={m.id} className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group">
                <div className="aspect-square bg-white/5 relative overflow-hidden">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-blue-600/30 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-300">{m.name[0]}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-white text-sm font-semibold truncate">{m.name}</p>
                  <p className="text-white/40 text-xs truncate">{m.role}</p>
                  {m.department && <p className="text-white/30 text-[11px] truncate">{m.department}</p>}
                  <div className="flex gap-1 mt-3">
                    <button onClick={() => openEdit(m)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
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
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <h2 className="text-white font-bold">{editMember ? "Edit Member" : "Add Member"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                  {form.photo ? <img src={form.photo} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-white/30"><Users className="w-6 h-6" /></div>
                  )}
                </div>
                <div>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <button onClick={() => photoRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm rounded-xl transition-colors">
                    <Upload className="w-4 h-4" /> Upload Photo
                  </button>
                </div>
              </div>

              {[
                { key: "name", label: "Full Name *" },
                { key: "role", label: "Role / Position *" },
                { key: "department", label: "Department" },
                { key: "email", label: "Email" },
                { key: "linkedin", label: "LinkedIn URL" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
                  <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0d1426] capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
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
