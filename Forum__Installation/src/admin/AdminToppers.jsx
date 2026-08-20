import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Plus, Trash2, Edit, Loader2, X, Save, AlertCircle, CheckCircle2, Award, Camera
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

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

async function fetchToppers() {
  const res = await apiFetch("/admin/api/toppers");
  if (!res.ok) throw new Error("Failed to fetch toppers");
  return res.json();
}

async function createTopper(payload) {
  const res = await apiFetch("/admin/api/toppers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add topper");
  }
  return res.json();
}

async function updateTopper(id, payload) {
  const res = await apiFetch(`/admin/api/toppers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update topper");
  }
  return res.json();
}

async function deleteTopper(id) {
  const res = await apiFetch(`/admin/api/toppers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete topper");
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

export function AdminToppers() {
  const [toppers, setToppers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [activeTab, setActiveTab] = useState("final_year");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    year_group: "final_year",
    rank: 1,
    name: "",
    branch: "Computer Engineering",
    cgpa: "",
    score_label: "CGPA",
    achievement: "",
    image: "",
    display_order: 1
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchToppers();
      setToppers(data);
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

  const handleOpenModal = (topper = null) => {
    if (topper) {
      setEditingId(topper.id);
      setFormData({
        year_group: topper.year_group || activeTab,
        rank: topper.rank || 1,
        name: topper.name || "",
        branch: topper.branch || "Computer Engineering",
        cgpa: topper.cgpa || "",
        score_label: topper.score_label || "CGPA",
        achievement: topper.achievement || "",
        image: topper.image || "",
        display_order: topper.display_order || 1
      });
    } else {
      setEditingId(null);
      const groupToppers = toppers.filter(t => t.year_group === activeTab);
      const nextRank = groupToppers.length > 0 ? Math.max(...groupToppers.map(t => t.rank)) + 1 : 1;
      
      setFormData({
        year_group: activeTab,
        rank: nextRank,
        name: "",
        branch: "Computer Engineering",
        cgpa: "",
        score_label: "CGPA",
        achievement: "",
        image: "",
        display_order: nextRank
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
      if (!formData.name.trim() || !formData.cgpa.trim() || !formData.year_group) {
        throw new Error("Name, CGPA, and Year Group are required");
      }
      setIsSaving(true);
      
      const payload = {
        ...formData,
        rank: Number(formData.rank),
        display_order: Number(formData.display_order)
      };

      if (editingId) {
        await updateTopper(editingId, payload);
        setToast({ type: "success", msg: "Topper updated successfully!" });
      } else {
        await createTopper(payload);
        setToast({ type: "success", msg: "Topper added successfully!" });
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
    if (!window.confirm("Are you sure you want to delete this topper?")) return;
    try {
      setToast({ type: "info", msg: "Deleting topper..." });
      await deleteTopper(id);
      setToast({ type: "success", msg: "Topper deleted successfully!" });
      loadData();
    } catch (err) {
      setToast({ type: "error", msg: err.message });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const activeToppers = toppers.filter(t => t.year_group === activeTab).sort((a, b) => a.rank - b.rank);

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-500" />
              Academic Toppers
            </h1>
            <p className="text-white/50">Manage academic toppers for each year</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Topper
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("final_year")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "final_year" ? "bg-blue-600 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Final Year
          </button>
          <button
            onClick={() => setActiveTab("third_year")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "third_year" ? "bg-blue-600 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Third Year
          </button>
          <button
            onClick={() => setActiveTab("second_year")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "second_year" ? "bg-blue-600 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Second Year
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
            <p>Loading toppers...</p>
          </div>
        ) : activeToppers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl text-center">
            <Award className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No toppers found for this year</h3>
            <p className="text-white/50 mb-6 max-w-md">Get started by adding the first topper.</p>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" /> Add Topper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeToppers.map((topper) => (
              <div
                key={topper.id}
                className="group relative bg-[#121212] rounded-[24px] border border-[rgba(255,255,255,0.08)] overflow-hidden transition-all duration-300 hover:border-[rgba(59,130,246,0.3)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] flex flex-col"
              >
                {/* Actions Overlay */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(topper)}
                    className="p-2 bg-white/10 hover:bg-blue-500/20 text-white/70 hover:text-blue-400 backdrop-blur-md rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(topper.id)}
                    className="p-2 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 backdrop-blur-md rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 flex flex-col items-center flex-grow text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[rgba(59,130,246,0.3)] bg-[#1A1A1A]">
                      {topper.image ? (
                        <img src={topper.image} alt={topper.name} className="w-full h-full object-cover" />
                      ) : (
                        <Award className="w-12 h-12 text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg border border-blue-500 whitespace-nowrap">
                      Rank {topper.rank}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mt-2 mb-1">{topper.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-blue-400">{topper.score_label}: {topper.cgpa}</span>
                  </div>
                  
                  {topper.achievement && (
                    <p className="text-sm text-white/60 mb-2 truncate w-full">{topper.achievement}</p>
                  )}
                  <p className="text-xs text-white/40">{topper.branch}</p>
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
                  {editingId ? "Edit Topper" : "Add New Topper"}
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
                  {/* Year Group */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Year Group <span className="text-red-400">*</span></label>
                    <select
                      value={formData.year_group}
                      onChange={(e) => setFormData({ ...formData, year_group: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="final_year">Final Year</option>
                      <option value="third_year">Third Year</option>
                      <option value="second_year">Second Year</option>
                    </select>
                  </div>

                  {/* Rank */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Rank <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      min="1"
                      value={formData.rank}
                      onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Full Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Tushar Nimje"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Branch */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Branch <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g. Computer Engineering"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  {/* CGPA */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Score/CGPA <span className="text-red-400">*</span></label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.score_label}
                        onChange={(e) => setFormData({ ...formData, score_label: e.target.value })}
                        placeholder="Label"
                        className="w-1/3 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all"
                      />
                      <input
                        type="text"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                        placeholder="e.g. 9.85"
                        className="w-2/3 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Achievement */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Special Achievement</label>
                    <input
                      type="text"
                      value={formData.achievement}
                      onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                      placeholder="e.g. All Rounder Award"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
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
                  {editingId ? "Save Changes" : "Add Topper"}
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
