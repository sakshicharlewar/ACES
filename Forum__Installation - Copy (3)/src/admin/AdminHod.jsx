import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Loader2, Save, AlertCircle, CheckCircle2, UserCheck, Plus, Trash2 } from "lucide-react";
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
      </div>
    </div>
  );
}

function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [{ title: val, desc: "" }];
  }
  return [];
}

export function AdminHod() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    designation: "Head of Department",
    department: "Computer Engineering",
    image: "",
    professional_summary: "",
    academic_qualifications: [],
    professional_highlights: [],
    achievement_images: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/api/hod");
      if (!res.ok) throw new Error("Failed to load HOD Profile");
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setFormData({
          ...data,
          academic_qualifications: ensureArray(data.academic_qualifications),
          professional_highlights: ensureArray(data.professional_highlights),
          achievement_images: ensureArray(data.achievement_images)
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await apiFetch("/admin/api/hod", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update HOD profile");
      }
      setToast({ type: "success", message: "HOD Profile updated successfully!" });
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-blue-500" />
              HOD Profile
            </h1>
            <p className="text-white/50">Manage the Head of Department profile details</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Basic Info */}
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Photo Upload */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 overflow-hidden flex items-center justify-center group mb-2 cursor-pointer hover:border-blue-500/50 transition-colors">
                    {formData.image ? (
                      <img src={formData.image} alt="HOD" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-white/40">Upload Photo</span>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white/70 block mb-2">Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70 block mb-2">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Professional Summary</label>
                <textarea
                  value={formData.professional_summary}
                  onChange={(e) => setFormData({ ...formData, professional_summary: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Academic Qualifications */}
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Academic Qualifications</h2>
                <button
                  onClick={() => setFormData({
                    ...formData,
                    academic_qualifications: [...formData.academic_qualifications, { title: "", desc: "" }]
                  })}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.academic_qualifications.map((q, i) => (
                  <div key={i} className="flex gap-4 items-start bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex-1 space-y-3">
                      <input
                        placeholder="Degree / Title (e.g., Ph.D.)"
                        value={q.title}
                        onChange={(e) => {
                          const newQuals = [...formData.academic_qualifications];
                          newQuals[i].title = e.target.value;
                          setFormData({ ...formData, academic_qualifications: newQuals });
                        }}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                      <input
                        placeholder="Institution / Year"
                        value={q.desc}
                        onChange={(e) => {
                          const newQuals = [...formData.academic_qualifications];
                          newQuals[i].desc = e.target.value;
                          setFormData({ ...formData, academic_qualifications: newQuals });
                        }}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newQuals = formData.academic_qualifications.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, academic_qualifications: newQuals });
                      }}
                      className="p-2 text-white/40 hover:text-red-400 bg-white/5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.academic_qualifications.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-4">No qualifications added.</p>
                )}
              </div>
            </div>
            
            {/* Professional Highlights */}
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Professional Highlights</h2>
                <button
                  onClick={() => setFormData({
                    ...formData,
                    professional_highlights: [...formData.professional_highlights, { title: "" }]
                  })}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.professional_highlights.map((h, i) => (
                  <div key={i} className="flex gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
                    <input
                      placeholder="Highlight (e.g., 14+ Years Exp)"
                      value={h.title}
                      onChange={(e) => {
                        const newHigh = [...formData.professional_highlights];
                        newHigh[i].title = e.target.value;
                        setFormData({ ...formData, professional_highlights: newHigh });
                      }}
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newHigh = formData.professional_highlights.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, professional_highlights: newHigh });
                      }}
                      className="p-2 text-white/40 hover:text-red-400 bg-white/5 rounded-lg flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Images */}
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Achievement Gallery</h2>
                <button
                  onClick={() => setFormData({
                    ...formData,
                    achievement_images: [...formData.achievement_images, { src: "", title: "" }]
                  })}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Image
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.achievement_images.map((ach, i) => (
                  <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="relative w-full aspect-video rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/50">
                      {ach.src ? (
                        <img src={ach.src} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white/40">Upload Image</span>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const newAch = [...formData.achievement_images];
                              newAch[i].src = reader.result;
                              setFormData({ ...formData, achievement_images: newAch });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <input
                      placeholder="Image Title"
                      value={ach.title}
                      onChange={(e) => {
                        const newAch = [...formData.achievement_images];
                        newAch[i].title = e.target.value;
                        setFormData({ ...formData, achievement_images: newAch });
                      }}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newAch = formData.achievement_images.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, achievement_images: newAch });
                      }}
                      className="w-full px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
