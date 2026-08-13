import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Plus, Trash2, Edit, Loader2, X, Save, AlertCircle, CheckCircle2, User, Camera, MoreVertical, GripVertical
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("aces_admin_token");
}
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401) throw new Error("Session expired. Please log in again.");
  return res;
}

async function fetchCommittee() {
  const res = await apiFetch("/admin/api/committee");
  if (!res.ok) throw new Error("Failed to fetch committee");
  return res.json();
}

async function createMember(payload) {
  const res = await apiFetch("/admin/api/committee", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add member");
  }
  return res.json();
}

async function updateMember(id, payload) {
  const res = await apiFetch(`/admin/api/committee/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update member");
  }
  return res.json();
}

async function deleteMember(id) {
  const res = await apiFetch(`/admin/api/committee/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete member");
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
        type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
      }`}>
        {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminCommittee() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    role: "",
    image: "",
    bio: "",
    linkedin: "",
    github: "",
    email: "",
    display_order: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCommittee();
      setMembers(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingId(member.id);
      setFormData({
        key: member.key || "",
        name: member.name || "",
        role: member.role || "",
        image: member.image || "",
        bio: member.bio || "",
        linkedin: member.linkedin || "",
        github: member.github || "",
        email: member.email || "",
        display_order: member.display_order || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        key: "",
        name: "",
        role: "",
        image: "",
        bio: "",
        linkedin: "",
        github: "",
        email: "",
        display_order: members.length > 0 ? Math.max(...members.map(m => m.display_order || 0)) + 1 : 1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.role.trim() || !formData.key.trim()) {
        throw new Error("Key, Name, and Role are required");
      }
      setIsSaving(true);
      
      const payload = {
        ...formData,
        display_order: Number(formData.display_order)
      };

      if (editingId) {
        await updateMember(editingId, payload);
        setToast({ type: "success", msg: "Member updated successfully!" });
      } else {
        await createMember(payload);
        setToast({ type: "success", msg: "Member added successfully!" });
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      setToast({ type: "error", msg: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      setToast({ type: "info", msg: "Deleting member..." });
      await deleteMember(id);
      setToast({ type: "success", msg: "Member deleted successfully!" });
      loadData();
    } catch (err) {
      setToast({ type: "error", msg: err.message });
    }
  };

  // Convert local file to base64 for image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              Committee Members
            </h1>
            <p className="text-white/50">Manage the ACES core committee members</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <button onClick={() => loadData()} className="ml-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p>Loading committee members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl text-center">
            <User className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No members found</h3>
            <p className="text-white/50 mb-6 max-w-md">Get started by adding the first committee member.</p>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" /> Add Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <div
                key={member.id}
                className="group relative bg-[#121212] rounded-[24px] border border-[rgba(255,255,255,0.08)] overflow-hidden transition-all duration-300 hover:border-[rgba(59,130,246,0.3)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] flex flex-col"
              >
                {/* Actions Overlay */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(member)}
                    className="p-2 bg-white/10 hover:bg-blue-500/20 text-white/70 hover:text-blue-400 backdrop-blur-md rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 backdrop-blur-md rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 flex flex-col items-center flex-grow text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[rgba(59,130,246,0.3)] mb-4 relative bg-[#1A1A1A]">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold mb-3 tracking-wide">
                    {member.role}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-sm text-white/40 mb-4 truncate w-full">{member.key}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl bg-[#121212] rounded-[24px] border border-[rgba(255,255,255,0.1)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white">
                  {editingId ? "Edit Member" : "Add New Member"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Photo Upload */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-white/20 bg-white/5 overflow-hidden flex items-center justify-center group mb-2 cursor-pointer hover:border-blue-500/50 transition-colors">
                    {formData.image ? (
                      <>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <span className="text-xs text-white/40">Upload Photo</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-white/40">Square aspect ratio recommended</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Key */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Unique Key <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="e.g. technical-head"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <p className="text-[10px] text-white/30">Used for URLs and internal IDs</p>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Full Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Role <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g. President"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Display Order */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  {/* LinkedIn */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">LinkedIn URL</label>
                    <input
                      type="text"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  {/* GitHub */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">GitHub URL</label>
                    <input
                      type="text"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Biography</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Short bio about the member..."
                    rows={4}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-white/70 hover:text-white font-medium hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:shadow-none"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  );
}
