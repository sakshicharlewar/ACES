import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Loader2, Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2, Monitor } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

function getToken() {
  return localStorage.getItem("aces_admin_token");
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const DEFAULT_LABS = [
  {
    id: 1,
    title: "Project / Research Lab (Lab 1)",
    location: "Second Floor, Room 201",
    in_charge: "Prof. S. R. Charlewar",
    image: "/Lab1.jpeg",
    equipment: {
      left: [
        "30x Core i7 High-Performance Workstations",
        "NVIDIA RTX GPU Accelerators for AI/ML",
        "Dual 24-inch IPS High-Resolution Displays",
        "10Gbps High-Speed Fibre Optic LAN",
        "Smart Interactive Presentation Display"
      ],
      right: [
        "TensorFlow, PyTorch, CUDA Dev Environment",
        "MATLAB & Simulink with Real-Time Toolboxes",
        "Docker & Kubernetes Cluster Simulation",
        "VS Code Enterprise & JetBrains IDE Suites",
        "Centralized NAS Storage 100TB RAID-6"
      ]
    },
    display_order: 1
  },
  {
    id: 2,
    title: "Database & Software Eng. Lab (Lab 2)",
    location: "Second Floor, Room 202",
    in_charge: "Prof. A. B. Rathod",
    image: "/Lab2.jpeg",
    equipment: {
      left: [
        "35x Core i5 Desktop Systems",
        "Oracle Database Enterprise Server",
        "PostgreSQL & MySQL Cluster Setup",
        "Gigabit Ethernet Managed Switches",
        "Online UPS 20KVA Continuous Backup"
      ],
      right: [
        "MongoDB, Redis, Apache Cassandra",
        "Eclipse, NetBeans, IntelliJ IDEA",
        "Git & GitHub Enterprise Server",
        "JIRA & Scrum Project Management Suite",
        "Selenium & Postman Testing Platform"
      ]
    },
    display_order: 2
  },
  {
    id: 3,
    title: "Networks & Cybersecurity Lab (Lab 3)",
    location: "Second Floor, Room 203",
    in_charge: "Prof. K. N. Nagose",
    image: "/Lab3.jpeg",
    equipment: {
      left: [
        "30x Core i7 Workstations with Kali Linux",
        "Cisco 2900 Series Modular Enterprise Routers",
        "Cisco Catalyst 2960 Series Layer-2/3 Switches",
        "Hardware Firewall & Packet Inspection Appliance",
        "Wireless Access Points with 802.11ax Protocol"
      ],
      right: [
        "Wireshark, tcpdump, Snort IDS/IPS",
        "Cisco Packet Tracer & GNS3 Virtual Lab",
        "Metasploit, Burp Suite, Nmap Suite",
        "OpenSSL Cryptographic Toolkit",
        "VMware ESXi Server for Penetration Testing"
      ]
    },
    display_order: 3
  },
  {
    id: 4,
    title: "Cloud Computing & Web Tech Lab (Lab 4)",
    location: "Second Floor, Room 204",
    in_charge: "Prof. V. V. Sir",
    image: "/Lab4.jpeg",
    equipment: {
      left: [
        "35x Core i5 All-in-One Dual-Boot Systems",
        "Dedicated Ubuntu & AlmaLinux Server Racks",
        "High-Speed Gigabit LAN with Smart QoS",
        "Smart Podium with AV Recording Suite",
        "Centralised UPS Power Conditioning System"
      ],
      right: [
        "AWS, Google Cloud & Azure CLI Integration",
        "Node.js, React, Next.js, Vite Dev Stacks",
        "Python, Django, FastAPI Backend Suites",
        "Apache, Nginx, Caddy Reverse Proxy Servers",
        "OpenStack Private Cloud Simulation Environment"
      ]
    },
    display_order: 4
  }
];

function getStoredLabs() {
  const stored = localStorage.getItem("aces_laboratories");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return DEFAULT_LABS;
}

function saveStoredLabs(labs) {
  localStorage.setItem("aces_laboratories", JSON.stringify(labs));
}

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
    return res;
  } catch (e) {
    return { ok: false, status: 503, json: async () => ({}) };
  }
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

export function AdminLaboratories() {
  const [labs, setLabs] = useState(getStoredLabs());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    title: "",
    location: "",
    in_charge: "",
    image: "",
    equipment: { left: [""], right: [""] },
    display_order: 0
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/laboratories", { headers: {} });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLabs(data);
          saveStoredLabs(data);
          setError("");
          return;
        }
      }
    } catch (err) {}
    setLabs(getStoredLabs());
    setLoading(false);
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleOpenModal = (lab = null) => {
    if (lab) {
      setEditingId(lab.id);
      setFormData({
        title: lab.title,
        location: lab.location,
        in_charge: lab.in_charge,
        image: lab.image || "",
        equipment: lab.equipment || { left: [], right: [] },
        display_order: lab.display_order
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    reader.readAsDataURL(file);
  };

  const handleEquipmentChange = (side, index, value) => {
    const newEquipment = { ...formData.equipment };
    if (!newEquipment[side]) newEquipment[side] = [];
    newEquipment[side][index] = value;
    setFormData({ ...formData, equipment: newEquipment });
  };

  const addEquipmentField = (side) => {
    const newEquipment = { ...formData.equipment };
    if (!newEquipment[side]) newEquipment[side] = [];
    newEquipment[side].push("");
    setFormData({ ...formData, equipment: newEquipment });
  };

  const removeEquipmentField = (side, index) => {
    const newEquipment = { ...formData.equipment };
    newEquipment[side] = newEquipment[side].filter((_, i) => i !== index);
    setFormData({ ...formData, equipment: newEquipment });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Clean up empty equipment items
      const cleanedData = { ...formData };
      cleanedData.equipment = {
        left: (cleanedData.equipment?.left || []).filter(item => item && item.trim() !== ""),
        right: (cleanedData.equipment?.right || []).filter(item => item && item.trim() !== "")
      };

      const current = getStoredLabs();
      let updated;
      if (editingId) {
        updated = current.map(l => String(l.id) === String(editingId) ? { ...l, ...cleanedData, id: editingId } : l);
      } else {
        updated = [...current, { id: Date.now(), ...cleanedData }];
      }
      saveStoredLabs(updated);
      setLabs(updated);

      try {
        const url = editingId ? `/admin/api/laboratories/${editingId}` : "/admin/api/laboratories";
        const method = editingId ? "PUT" : "POST";
        await apiFetch(url, {
          method,
          body: JSON.stringify(cleanedData),
        });
      } catch (e) {}

      setToast({ type: "success", message: `Lab ${editingId ? "updated" : "added"} successfully!` });
      handleCloseModal();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lab?")) return;
    try {
      const current = getStoredLabs();
      const updated = current.filter(l => String(l.id) !== String(id));
      saveStoredLabs(updated);
      setLabs(updated);
      try {
        await apiFetch(`/admin/api/laboratories/${id}`, { method: "DELETE" });
      } catch (e) {}
      setToast({ type: "success", message: "Lab deleted successfully!" });
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Monitor className="w-8 h-8 text-blue-500" />
              Laboratories
            </h1>
            <p className="text-white/50">Manage department labs and their equipment</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
          >
            <Plus className="w-5 h-5" />
            Add Lab
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {labs.map((lab) => (
              <div key={lab.id} className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative group hover:border-white/10 transition-colors">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => handleOpenModal(lab)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg backdrop-blur-md">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(lab.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg backdrop-blur-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
                  {lab.image ? (
                    <img src={lab.image} alt={lab.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{lab.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
                      <span><strong className="text-white/70">Location:</strong> {lab.location}</span>
                      <span><strong className="text-white/70">In-Charge:</strong> {lab.in_charge}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">Major Equipment</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/60">
                      <ul className="list-disc pl-4 space-y-1">
                        {lab.equipment?.left?.slice(0, 3).map((item, i) => <li key={i} className="truncate">{item}</li>)}
                      </ul>
                      <ul className="list-disc pl-4 space-y-1">
                        {lab.equipment?.right?.slice(0, 3).map((item, i) => <li key={i} className="truncate">{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {labs.length === 0 && (
              <div className="col-span-full py-20 text-center text-white/40">
                No laboratories added yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-4xl my-8 relative shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#121212] rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{editingId ? "Edit Lab" : "Add New Lab"}</h2>
              <button onClick={handleCloseModal} className="text-white/50 hover:text-white p-2 bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-white/70 block">Lab Image</label>
                    <div className="relative w-full aspect-video rounded-xl border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center group cursor-pointer hover:border-blue-500/50 bg-black/40">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <span className="text-sm text-white/40 group-hover:text-blue-400">Upload Image</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white/70 block mb-2">Location</label>
                      <input
                        required
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70 block mb-2">In-Charge</label>
                      <input
                        required
                        type="text"
                        value={formData.in_charge}
                        onChange={(e) => setFormData({ ...formData, in_charge: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Equipment</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-white/70">Left Column</label>
                          <button type="button" onClick={() => addEquipmentField('left')} className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(formData.equipment?.left || []).map((item, index) => (
                            <div key={`left-${index}`} className="flex gap-2">
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => handleEquipmentChange('left', index, e.target.value)}
                                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Equipment detail"
                              />
                              <button type="button" onClick={() => removeEquipmentField('left', index)} className="p-2 text-white/40 hover:text-red-400 bg-white/5 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-white/70">Right Column</label>
                          <button type="button" onClick={() => addEquipmentField('right')} className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(formData.equipment?.right || []).map((item, index) => (
                            <div key={`right-${index}`} className="flex gap-2">
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => handleEquipmentChange('right', index, e.target.value)}
                                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Equipment detail"
                              />
                              <button type="button" onClick={() => removeEquipmentField('right', index)} className="p-2 text-white/40 hover:text-red-400 bg-white/5 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-4 sticky bottom-0 bg-[#121212]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-medium text-white/70 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editingId ? "Save Changes" : "Add Lab"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
